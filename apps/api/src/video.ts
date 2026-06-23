import type { Request, Response } from "express";
import Mux from "@mux/mux-node";
import { query } from "./db.js";
import { env } from "./env.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";

const mux = new Mux({ tokenId: env.MUX_TOKEN_ID, tokenSecret: env.MUX_TOKEN_SECRET });
const CORS_ORIGIN = process.env.MUX_CORS_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? "*"; // exact origin in prod

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

// POST /api/messages/:id/upload-init → Mux direct upload (signed, captions, MP4).
export async function uploadInit(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  const id = String(req.params.id);

  const owned = await query<{ id: string }>("select id from app.messages where id=$1 and registrant_id=$2", [id, who.registrantId]);
  if (!owned.rows[0]) return void res.status(404).json({ error: "message not found" });

  const upload = await mux.video.uploads.create({
    cors_origin: CORS_ORIGIN,
    new_asset_settings: {
      playback_policy: ["signed"],
      video_quality: "basic",
      passthrough: id,
      static_renditions: [{ resolution: "highest" }, { resolution: "audio-only" }],
      inputs: [{ generated_subtitles: [{ language_code: "en", name: "English CC" }] }],
    } as never,
  });

  const ins = await query<{ id: string }>(
    `insert into app.media_assets (registrant_id, mux_upload_id, status) values ($1,$2,'waiting') returning id`,
    [who.registrantId, upload.id],
  );
  const mediaAssetId = ins.rows[0]!.id;
  await query("update app.messages set type='video', media_asset_id=$1, updated_at=now() where id=$2", [mediaAssetId, id]);
  await logEvent({ actorType: "registrant", actorId: who.userId, action: "video.upload.init", entityType: "message", entityId: id });

  res.json({ uploadUrl: upload.url, mediaAssetId });
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
    status = a.status === "ready" ? "ready" : a.status === "errored" ? "errored" : "processing";
    await query(
      `update app.media_assets set status=$1, mux_playback_id=$2, duration_seconds=$3, caption_status=$4,
         static_rendition_status=$5, updated_at=now() where id=$6`,
      [status, playbackId, duration, captions, a.static_renditions?.status ?? "pending", media.id],
    );
    if (status === "ready") await query("update app.messages set status='ready', updated_at=now() where id=$1", [id]);
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
