import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import { pool } from "./db.js";
import { requireRegistrant } from "./auth.js";
import { assertOwnedAudience, insertMessageRecipients, parseMessageAudience } from "./audience.js";

export async function updateMessageAudience(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who)
    return void res
      .status(401)
      .json({ error: "Only the account owner can change message audience" });
  const key = req.header("idempotency-key")?.trim();
  if (!key || key.length > 200)
    return void res.status(400).json({ error: "Idempotency-Key required" });
  const client = await pool.connect();
  try {
    const audience = parseMessageAudience(req.body);
    await client.query("begin");
    await assertOwnedAudience(client, who.registrantId, audience);
    const message = await client.query(
      "select id,audience_type from app.messages where id=$1 and registrant_id=$2 for update",
      [req.params.id, who.registrantId],
    );
    if (!message.rowCount) throw new Error("Message not found");
    const fingerprint = createHash("sha256")
      .update(JSON.stringify({ id: req.params.id, ...audience }))
      .digest("hex");
    const prior = await client.query(
      "select data from audit.event_log where actor_id=$1 and request_id=$2 and action='message.audience_changed'",
      [who.userId, key],
    );
    if (prior.rowCount) {
      if (prior.rows[0].data?.fingerprint !== fingerprint)
        throw new Error("Request key already used");
      await client.query("rollback");
      return void res.json({ ok: true });
    }
    await client.query("delete from app.message_recipients where message_id=$1", [req.params.id]);
    await insertMessageRecipients(client, String(req.params.id), audience);
    await client.query(
      `update app.messages set audience_type=$2,visible_on_memorial=case when $2='private' then false else visible_on_memorial end,updated_at=now() where id=$1`,
      [req.params.id, audience.audienceType],
    );
    await client.query(
      `insert into audit.event_log(actor_type,actor_id,action,entity_type,entity_id,request_id,data)
      values('registrant',$1,'message.audience_changed','message',$2,$3,$4)`,
      [
        who.userId,
        req.params.id,
        key,
        JSON.stringify({
          from: message.rows[0].audience_type,
          to: audience.audienceType,
          contactIds: audience.contactIds,
          fingerprint,
        }),
      ],
    );
    await client.query("commit");
    res.json({ ok: true });
  } catch (e) {
    await client.query("rollback");
    res.status(409).json({ error: e instanceof Error ? e.message : "Unable to change audience" });
  } finally {
    client.release();
  }
}
