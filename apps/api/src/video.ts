import type { Request, Response } from "express";
import crypto from "node:crypto";
import Mux from "@mux/mux-node";
import { pool, query } from "./db.js";
import { env } from "./env.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";
import { assertOwnedAudience, assertMessageAuthoringOpen, insertMessageRecipients, parseMessageAudience } from "./audience.js";

const mux = new Mux({ tokenId: env.MUX_TOKEN_ID, tokenSecret: env.MUX_TOKEN_SECRET });
const CORS_ORIGIN = process.env.MUX_CORS_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? "*"; // exact origin in prod
const MAX_VIDEO_DURATION_SECONDS = 5 * 60;

export interface PlaybackTokens { playback: string; thumbnail: string; storyboard: string }

/** Mint short-lived signed playback tokens for a Mux playback id. */
export async function mintPlaybackTokens(playbackId: string): Promise<PlaybackTokens> {
  const opts = { keyId: env.MUX_SIGNING_KEY_ID, keySecret: env.MUX_SIGNING_KEY_PRIVATE, expiration: "2h" } as const;
  const [playback, thumbnail, storyboard] = await Promise.all([
    mux.jwt.signPlaybackId(playbackId, { ...opts, type: "video" }),
    mux.jwt.signPlaybackId(playbackId, { ...opts, type: "thumbnail" }),
    mux.jwt.signPlaybackId(playbackId, { ...opts, type: "storyboard" }),
  ]);
  return { playback, thumbnail, storyboard };
}

interface MediaRow {
  id: string;
  mux_upload_id: string | null;
  mux_asset_id: string | null;
  mux_playback_id: string | null;
  status: string;
}

async function ownedMedia(messageId: string, registrantId: string): Promise<MediaRow | null> {
  const { rows } = await query<MediaRow>(
    `select ma.id, ma.mux_upload_id, ma.mux_asset_id, ma.mux_playback_id, ma.status
       from app.messages m join app.media_assets ma on ma.id = m.media_asset_id
      where m.id = $1 and m.registrant_id = $2`,
    [messageId, registrantId],
  );
  return rows[0] ?? null;
}

/** Create a Mux upload for a known message id. No database writes happen here. */
async function createMuxUpload(messageId: string) {
  return mux.video.uploads.create({
    cors_origin: CORS_ORIGIN,
    new_asset_settings: {
      playback_policies: ["signed"],
      video_quality: "basic",
      passthrough: messageId,
    } as never,
  });
}

const DEMO_MEMORIAL_VIDEO_URL =
  "https://lastlink-marketing.onrender.com/assets/video/LastLink_30s_Marketing_v2.mp4";

/**
 * Import the approved investor-demo clip directly from the LastLink marketing
 * service. This avoids browser/CORS upload configuration while still creating
 * an independent signed Mux asset. It is unavailable outside demo mode and the
 * source URL is intentionally not caller-selectable.
 */
export async function createDemoVideoImport(req: Request, res: Response): Promise<void> {
  if (!env.DEMO_MEMORIAL) return void res.status(404).json({ error: "not found" });
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  if (req.body?.sourceUrl !== DEMO_MEMORIAL_VIDEO_URL) {
    return void res.status(400).json({ error: "unsupported demo video" });
  }
  try { await assertMessageAuthoringOpen(pool, who.registrantId); }
  catch(e) { return void res.status(409).json({error:e instanceof Error ? e.message : "Messages are read-only"}); }

  const messageId = crypto.randomUUID();
  const title = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 300) : null;
  let asset;
  try {
    asset = await mux.video.assets.create({
      inputs: [{ url: DEMO_MEMORIAL_VIDEO_URL }],
      playback_policies: ["signed"],
      video_quality: "basic",
      passthrough: messageId,
    } as never);
  } catch (error) {
    const muxError = error as { status?: number; message?: string; error?: { messages?: string[] } };
    console.error("[video-demo-import] Mux create failed", error);
    return void res.status(502).json({
      error: "Mux import failed",
      muxStatus: muxError.status ?? null,
      detail: muxError.error?.messages?.[0] ?? muxError.message ?? "unknown Mux error",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    await assertMessageAuthoringOpen(client,who.registrantId);
    const inserted = await client.query<{ id: string }>(
      `insert into app.media_assets (registrant_id, mux_asset_id, status)
       values ($1,$2,'processing') returning id`,
      [who.registrantId, asset.id],
    );
    const mediaAssetId = inserted.rows[0]!.id;
    await client.query(
      `insert into app.messages (id, registrant_id, audience_type, type, title, status, media_asset_id)
       values ($1,$2,'public','video',$3,'draft',$4)`,
      [messageId, who.registrantId, title || null, mediaAssetId],
    );
    await client.query("commit");
    await logEvent({
      actorType: "registrant",
      actorId: who.userId,
      action: "video.demo_import.init",
      entityType: "message",
      entityId: messageId,
      data: { source: "lastlink-marketing" },
    }).catch((err) => console.error("[video-demo-import] audit log failed", err));
    res.json({ messageId, mediaAssetId });
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// POST /api/messages/video/upload-init → initialize Mux first, then create the
// media + message rows in one DB transaction. A failed Mux request therefore
// cannot leave a dashboard-visible orphan draft.
export async function createVideoUpload(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  const title = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 300) : null;
  let audience;
  try { audience = parseMessageAudience(req.body); }
  catch (error) { return void res.status(400).json({ error: error instanceof Error ? error.message : "invalid audience" }); }

  // Validate before allocating anything at Mux, then repeat inside the database
  // transaction to close the small contact-deletion race.
  const validationClient = await pool.connect();
  try { await assertOwnedAudience(validationClient, who.registrantId, audience); }
  catch (error) {
    return void res.status(400).json({ error: error instanceof Error ? error.message : "invalid audience" });
  } finally { validationClient.release(); }

  const messageId = crypto.randomUUID();
  const upload = await createMuxUpload(messageId);
  const client = await pool.connect();
  try {
    await client.query("begin");
    const ins = await client.query<{ id: string }>(
      `insert into app.media_assets (registrant_id, mux_upload_id, status)
       values ($1,$2,'waiting') returning id`,
      [who.registrantId, upload.id],
    );
    const mediaAssetId = ins.rows[0]!.id;
    await client.query(
      `insert into app.messages (id, registrant_id, audience_type, type, title, status, media_asset_id)
       values ($1,$2,$3,'video',$4,'draft',$5)`,
      [messageId, who.registrantId, audience.audienceType, title || null, mediaAssetId],
    );
    await assertOwnedAudience(client, who.registrantId, audience);
    await insertMessageRecipients(client, messageId, audience);
    await client.query("commit");
    await logEvent({ actorType: "registrant", actorId: who.userId, action: "video.upload.init", entityType: "message", entityId: messageId, data: { audienceType: audience.audienceType } })
      .catch((err) => console.error("[video-upload] audit log failed", err));
    res.json({ messageId, uploadUrl: upload.url, mediaAssetId });
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// POST /api/messages/:id/upload-failed → make a failed client upload explicit
// instead of leaving it as an apparently valid draft.
export async function markVideoUploadFailed(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  const id = String(req.params.id);
  const reason = typeof req.body?.reason === "string" ? req.body.reason.slice(0, 1000) : "client upload failed";
  const result = await query(
    `update app.media_assets ma set status='errored', errored_reason=$3, updated_at=now()
       from app.messages m
      where m.media_asset_id=ma.id and m.id=$1 and m.registrant_id=$2 and m.status='draft'`,
    [id, who.registrantId, reason],
  );
  if (!result.rowCount) return void res.status(404).json({ error: "message not found" });
  await query("update app.messages set status='failed', updated_at=now() where id=$1", [id]);
  await logEvent({ actorType: "registrant", actorId: who.userId, action: "video.upload.failed", entityType: "message", entityId: id, data: { reason } });
  res.json({ ok: true, status: "failed" });
}

// POST /api/messages/:id/media/refresh → poll Mux and sync media_assets (local-dev
// substitute for webhooks, which can't reach localhost).
export async function mediaRefresh(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  const id = String(req.params.id);
  const media = await ownedMedia(id, who.registrantId);
  if (!media) return void res.status(404).json({ error: "no media" });

  let assetId = media.mux_asset_id;
  if (!assetId && media.mux_upload_id) {
    const up = await mux.video.uploads.retrieve(media.mux_upload_id);
    if (up.asset_id) {
      assetId = up.asset_id;
      await query("update app.media_assets set mux_asset_id=$1, status='processing', updated_at=now() where id=$2", [assetId, media.id]);
    }
  }

  let status = media.status;
  let playbackId = media.mux_playback_id;
  let duration: number | null = null;
  if (assetId) {
    const a = (await mux.video.assets.retrieve(assetId)) as never as {
      status: string; duration?: number;
      playback_ids?: { id: string; policy: string }[];
      tracks?: { type: string; status?: string }[];
      static_renditions?: { status?: string };
    };
    playbackId = a.playback_ids?.find((p) => p.policy === "signed")?.id ?? playbackId;
    duration = a.duration ? Math.round(a.duration) : null;
    const captions = a.tracks?.some((t) => t.type === "text" && t.status === "ready") ? "ready" : "pending";
    const tooLong = typeof duration === "number" && duration > MAX_VIDEO_DURATION_SECONDS;
    status = tooLong ? "errored" : a.status === "ready" ? "ready" : a.status === "errored" ? "errored" : "processing";
    await query(
      `update app.media_assets set status=$1, mux_playback_id=$2, duration_seconds=$3, caption_status=$4,
         static_rendition_status=$5, errored_reason=$6, updated_at=now() where id=$7`,
      [status, tooLong ? null : playbackId, duration, captions, a.static_renditions?.status ?? "pending",
        tooLong ? `Video exceeds the ${MAX_VIDEO_DURATION_SECONDS}-second limit` : null, media.id],
    );
    if (status === "ready") await query("update app.messages set status='ready', updated_at=now() where id=$1", [id]);
    if (status === "errored") await query("update app.messages set status='failed', updated_at=now() where id=$1", [id]);
  }

  res.json({ status, playbackId, duration });
}

// POST /api/messages/:id/playback-token → owner preview (signed). Recipient
// playback tokens are minted post-release in M4.
export async function playbackToken(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  const id = String(req.params.id);
  const media = await ownedMedia(id, who.registrantId);
  if (!media?.mux_playback_id || media.status !== "ready") return void res.status(409).json({ error: "not ready" });

  const opts = { keyId: env.MUX_SIGNING_KEY_ID, keySecret: env.MUX_SIGNING_KEY_PRIVATE, expiration: "2h" } as const;
  const [playback, thumbnail, storyboard] = await Promise.all([
    mux.jwt.signPlaybackId(media.mux_playback_id, { ...opts, type: "video" }),
    mux.jwt.signPlaybackId(media.mux_playback_id, { ...opts, type: "thumbnail" }),
    mux.jwt.signPlaybackId(media.mux_playback_id, { ...opts, type: "storyboard" }),
  ]);
  res.json({ playbackId: media.mux_playback_id, tokens: { playback, thumbnail, storyboard } });
}

// POST /webhooks/mux — server-side reconciliation (the durable path per Mux docs).
// Mux calls us when an asset is ready, so state syncs even if the uploader's
// browser tab is gone. We correlate by `passthrough` (the message id we set at
// upload-init). Mounted with a RAW body so the signature can be verified.
function verifyMuxSignature(raw: Buffer, header: string, secret: string): boolean {
  // Mux-Signature: "t=<unix>,v1=<hex hmac of `${t}.${rawBody}`>"
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=")) as [string, string][]);
  if (!parts.t || !parts.v1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${raw.toString()}`).digest("hex");
  const a = Buffer.from(parts.v1), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function muxWebhook(req: Request, res: Response): Promise<void> {
  const raw: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  const secret = env.MUX_WEBHOOK_SECRET;
  if (secret) {
    const header = String(req.headers["mux-signature"] ?? "");
    if (!verifyMuxSignature(raw, header, secret)) return void res.status(400).send("bad signature");
  } else {
    console.warn("[mux-webhook] MUX_WEBHOOK_SECRET unset — processing without signature verification");
  }

  let evt: { type?: string; data?: Record<string, unknown> };
  try { evt = JSON.parse(raw.toString()); } catch { return void res.sendStatus(400); }
  const data = (evt.data ?? {}) as { id?: string; passthrough?: string; duration?: number;
    playback_ids?: { id: string; policy: string }[]; tracks?: { type: string; status?: string }[] };
  const messageId = data.passthrough; // set as new_asset_settings.passthrough at upload-init

  try {
    if (evt.type === "video.asset.ready" && messageId) {
      const duration = data.duration ? Math.round(data.duration) : null;
      if (duration !== null && duration > MAX_VIDEO_DURATION_SECONDS) {
        await query(
          `update app.media_assets ma set status='errored', mux_asset_id=$1, duration_seconds=$2,
             errored_reason=$3, updated_at=now()
           from app.messages m where m.media_asset_id = ma.id and m.id = $4`,
          [data.id ?? null, duration, `Video exceeds the ${MAX_VIDEO_DURATION_SECONDS}-second limit`, messageId],
        );
        await query("update app.messages set status='failed', updated_at=now() where id=$1", [messageId]);
        await logEvent({ actorType: "system", action: "video.asset.rejected_duration", entityType: "message", entityId: messageId, data: { duration } });
        return void res.sendStatus(200);
      }
      const playbackId = data.playback_ids?.find((p) => p.policy === "signed")?.id ?? null;
      const captions = data.tracks?.some((t) => t.type === "text" && t.status === "ready") ? "ready" : "pending";
      await query(
        `update app.media_assets ma set status='ready', mux_asset_id=$1, mux_playback_id=$2,
           duration_seconds=$3, caption_status=$4, updated_at=now()
         from app.messages m where m.media_asset_id = ma.id and m.id = $5`,
        [data.id ?? null, playbackId, duration, captions, messageId]);
      await query("update app.messages set status='ready', updated_at=now() where id=$1", [messageId]);
      await logEvent({ actorType: "system", action: "video.asset.ready", entityType: "message", entityId: messageId });
    } else if (evt.type === "video.asset.errored" && messageId) {
      await query(
        `update app.media_assets ma set status='errored', updated_at=now()
         from app.messages m where m.media_asset_id = ma.id and m.id = $1`, [messageId]);
      await query("update app.messages set status='failed', updated_at=now() where id=$1", [messageId]);
      await logEvent({ actorType: "system", action: "video.asset.errored", entityType: "message", entityId: messageId });
    }
  } catch (err) {
    console.error("[mux-webhook] handler error", err);
  }
  res.sendStatus(200); // always 200 so Mux doesn't retry-storm on our bugs
}
