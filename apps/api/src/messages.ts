import type { Request, Response } from "express";
import { encryptLetter, keyFromHex } from "@lastlink/crypto";
import crypto from "node:crypto";
import { pool } from "./db.js";
import { env } from "./env.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";
import { assertOwnedAudience, insertMessageRecipients, parseMessageAudience } from "./audience.js";

const LETTER_KEY = keyFromHex(env.LETTER_ENC_KEY);

// POST /api/messages/letter — create the encrypted letter and its audience in
// one transaction. This is the primary path used by the app.
export async function createLetter(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  const title = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 300) : "";
  const body = typeof req.body?.body === "string" ? req.body.body : "";
  if (!body.trim()) return void res.status(400).json({ error: "empty letter body" });

  let audience;
  try { audience = parseMessageAudience(req.body); }
  catch (error) { return void res.status(400).json({ error: error instanceof Error ? error.message : "invalid audience" }); }

  const sealed = encryptLetter(body, LETTER_KEY);
  const messageId = crypto.randomUUID();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await assertOwnedAudience(client, who.registrantId, audience);
    await client.query(
      `insert into app.messages
         (id, registrant_id, audience_type, type, title, status, body_ciphertext, body_iv, enc_alg, enc_key_id)
       values ($1,$2,$3,'letter',$4,'ready',$5,$6,$7,$8)`,
      [messageId, who.registrantId, audience.audienceType, title || null,
        sealed.ciphertext, sealed.iv, sealed.alg, sealed.keyId],
    );
    await insertMessageRecipients(client, messageId, audience);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => {});
    if (error instanceof Error && /contact|recipient/.test(error.message)) {
      return void res.status(400).json({ error: error.message });
    }
    throw error;
  } finally {
    client.release();
  }
  await logEvent({ actorType: "registrant", actorId: who.userId, action: "message.letter.saved", entityType: "message", entityId: messageId, data: { length: body.length, audienceType: audience.audienceType } });
  res.json({ ok: true, messageId, status: "ready" });
}
