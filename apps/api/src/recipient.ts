import type { Request, Response } from "express";
import { decryptLetter, keyFromHex } from "@lastlink/crypto";
import { query } from "./db.js";
import { env } from "./env.js";
import { verifyRecipientToken } from "./tokens.js";
import { mintPlaybackTokens } from "./video.js";
import { logEvent } from "./audit.js";

const LETTER_KEY = keyFromHex(env.LETTER_ENC_KEY);

interface DeliveryRow {
  delivery_id: string;
  message_id: string;
  msg_type: string;
  title: string | null;
  created_at: string;
  recipient_name: string;
  registrant_id: string;
  registrant_name: string;
  mux_playback_id: string | null;
  duration_seconds: number | null;
}

async function resolveDelivery(token: string): Promise<DeliveryRow | null> {
  const deliveryId = verifyRecipientToken(token);
  if (!deliveryId) return null;
  const { rows } = await query<DeliveryRow>(
    `select d.id as delivery_id, m.id as message_id, m.type as msg_type, m.title, m.created_at,
            ct.full_name as recipient_name, r.id as registrant_id, r.legal_name as registrant_name,
            ma.mux_playback_id, ma.duration_seconds
       from app.deliveries d
       join app.messages m on m.id = d.message_id
       join app.contacts ct on ct.id = d.contact_id
       join app.registrants r on r.id = m.registrant_id
       left join app.media_assets ma on ma.id = m.media_asset_id
      where d.id = $1`,
    [deliveryId],
  );
  return rows[0] ?? null;
}

// GET /recipient/:token — arrival payload (metadata only; never the ciphertext).
export async function getRecipient(req: Request, res: Response): Promise<void> {
  const d = await resolveDelivery(String(req.params.token));
  if (!d) return void res.status(401).json({ error: "This link isn't valid or has expired." });
  const advs = await query<{ full_name: string }>(
    "select full_name from app.advocates where registrant_id=$1 order by slot", [d.registrant_id]);
  await query("update app.deliveries set status='delivered', delivered_at=coalesce(delivered_at, now()) where id=$1", [d.delivery_id]);
  res.json({
    recipientName: d.recipient_name,
    registrantName: d.registrant_name,
    message: { type: d.msg_type, title: d.title, durationSeconds: d.duration_seconds, recordedDate: d.created_at },
    advocates: advs.rows.map((a) => a.full_name),
  });
}

// POST /recipient/:token/open — mint playback tokens (video) or decrypt the letter.
export async function openRecipient(req: Request, res: Response): Promise<void> {
  const d = await resolveDelivery(String(req.params.token));
  if (!d) return void res.status(401).json({ error: "invalid link" });

  if (d.msg_type === "video") {
    if (!d.mux_playback_id) return void res.status(409).json({ error: "video not ready" });
    const tokens = await mintPlaybackTokens(d.mux_playback_id);
    await logEvent({ actorType: "recipient", action: "recipient.opened", entityType: "delivery", entityId: d.delivery_id, data: { type: "video" } });
    return void res.json({ type: "video", playbackId: d.mux_playback_id, tokens });
  }

  if (d.msg_type === "letter") {
    const { rows } = await query<{ body_ciphertext: Buffer; body_iv: Buffer; enc_alg: string | null; enc_key_id: string | null }>(
      "select body_ciphertext, body_iv, enc_alg, enc_key_id from app.messages where id=$1", [d.message_id]);
    const m = rows[0];
    if (!m?.body_ciphertext || !m.body_iv) return void res.status(409).json({ error: "letter unavailable" });
    const body = decryptLetter({ ciphertext: m.body_ciphertext, iv: m.body_iv, alg: m.enc_alg ?? "aes-256-gcm", keyId: m.enc_key_id ?? "local-v1" }, LETTER_KEY);
    await logEvent({ actorType: "recipient", action: "recipient.opened", entityType: "delivery", entityId: d.delivery_id, data: { type: "letter" } });
    return void res.json({ type: "letter", title: d.title, body });
  }

  res.status(409).json({ error: "unsupported message type" });
}
