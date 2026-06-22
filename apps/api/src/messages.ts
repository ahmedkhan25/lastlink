import type { Request, Response } from "express";
import { encryptLetter, keyFromHex } from "@lastlink/crypto";
import { query } from "./db.js";
import { env } from "./env.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";

const LETTER_KEY = keyFromHex(env.LETTER_ENC_KEY);

// POST /api/messages/:id/letter — encrypt + store a letter body (envelope).
// The plaintext NEVER goes through Hasura; only ciphertext is persisted.
export async function saveLetter(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const id = String(req.params.id);
  const body = typeof req.body?.body === "string" ? req.body.body : "";
  if (!body.trim()) {
    res.status(400).json({ error: "empty letter body" });
    return;
  }

  // Ownership check — the message must belong to this registrant.
  const owned = await query<{ id: string }>(
    "select id from app.messages where id = $1 and registrant_id = $2 and type = 'letter'",
    [id, who.registrantId],
  );
  if (!owned.rows[0]) {
    res.status(404).json({ error: "message not found" });
    return;
  }

  const sealed = encryptLetter(body, LETTER_KEY);
  await query(
    `update app.messages
       set body_ciphertext = $1, body_iv = $2, enc_alg = $3, enc_key_id = $4, status = 'ready', updated_at = now()
     where id = $5`,
    [sealed.ciphertext, sealed.iv, sealed.alg, sealed.keyId, id],
  );
  await logEvent({
    actorType: "registrant",
    actorId: who.userId,
    action: "message.letter.saved",
    entityType: "message",
    entityId: id,
    data: { length: body.length },
  });
  res.json({ ok: true, status: "ready" });
}
