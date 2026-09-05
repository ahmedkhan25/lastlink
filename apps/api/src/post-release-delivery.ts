import type { PoolClient } from "pg";
import { createHash } from "node:crypto";
import { pool } from "./db.js";
import { env } from "./env.js";
import { notifier } from "./notify.js";
import { recipientMessageEmail } from "@lastlink/notifications";
import { signRecipientToken } from "./tokens.js";

export async function queueAdditionalPublicDeliveries(
  db: PoolClient,
  registrantId: string,
  contactId: string,
): Promise<string[]> {
  const { rows } = await db.query<{ release_id: string; message_id: string }>(
    `select r.id as release_id,m.id as message_id from app.releases r
     join app.verification_cases v on v.id=r.case_id join app.registrants reg on reg.id=r.registrant_id
     join app.release_messages snapshot on snapshot.release_id=r.id and snapshot.audience_type='public'
     join app.messages m on m.id=snapshot.message_id and m.registrant_id=r.registrant_id
     join app.contacts c on c.registrant_id=r.registrant_id and c.id=$2
     where r.registrant_id=$1 and v.state='released' and reg.account_state='released'
       and c.receives_public and c.archived_at is null and c.email is not null
       and r.status='complete' and m.audience_type='public'`,
    [registrantId, contactId],
  );
  const ids: string[] = [];
  for (const row of rows) {
    const d = await db.query<{ id: string }>(
      `insert into app.deliveries(release_id,message_id,contact_id,channel,status,recipient_email)
      select $1,$2,id,'email','queued',email from app.contacts where id=$3
      on conflict(release_id,message_id,contact_id,channel) do nothing returning id`,
      [row.release_id, row.message_id, contactId],
    );
    const id = d.rows[0]?.id;
    if (!id) continue;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const hash = createHash("sha256")
      .update(signRecipientToken(id, expiresAt.getTime()))
      .digest("hex");
    const tk = await db.query<{ id: string }>(
      `insert into app.recipient_tokens(delivery_id,contact_id,message_id,token_hash,expires_at)
      values($1,$2,$3,$4,$5) returning id`,
      [id, contactId, row.message_id, hash, expiresAt],
    );
    await db.query("update app.deliveries set recipient_token_id=$2 where id=$1", [
      id,
      tk.rows[0]!.id,
    ]);
    ids.push(id);
  }
  return ids;
}

// Deterministic token + provider key across retries. Lock each delivery while
// sending so repeated admin requests cannot create duplicate notifications.
export async function dispatchAdditionalDeliveries(
  ids: string[],
): Promise<{ accepted: number; failed: number }> {
  let accepted = 0,
    failed = 0;
  for (const id of ids) {
    const db = await pool.connect();
    try {
      await db.query("begin");
      const { rows } = await db.query<{
        status: string;
        email: string;
        recipient_name: string;
        registrant_name: string;
        expires_at: Date;
        token_hash: string;
      }>(
        `select d.status,d.recipient_email as email,c.full_name as recipient_name,r.legal_name as registrant_name,t.expires_at,t.token_hash
         from app.deliveries d join app.contacts c on c.id=d.contact_id join app.releases rel on rel.id=d.release_id
         join app.verification_cases v on v.id=rel.case_id join app.registrants r on r.id=rel.registrant_id
         join app.recipient_tokens t on t.id=d.recipient_token_id
         where d.id=$1 and v.state='released' and r.account_state='released' and not t.revoked and t.expires_at>now()
           and (d.status not in ('queued','failed') or d.created_at>now()-interval '23 hours')
         for update of d`,
        [id],
      );
      const d = rows[0];
      if (!d) {
        await db.query("rollback");
        failed++;
        continue;
      }
      if (!["queued", "failed"].includes(d.status)) {
        await db.query("rollback");
        accepted++;
        continue;
      }
      const token = signRecipientToken(id, new Date(d.expires_at).getTime());
      if (createHash("sha256").update(token).digest("hex") !== d.token_hash)
        throw new Error("Recipient token mismatch");
      const result = await notifier.send({
        to: d.email,
        email: recipientMessageEmail({
          recipientName: d.recipient_name,
          registrantName: d.registrant_name,
          openUrl: `${env.MESSAGE_BASE_URL}/m/${token}`,
        }),
        idempotencyKey: `post-release-public-${id}`,
      });
      const ok = !!result.id && !result.sink && !result.error;
      await db.query(
        `update app.deliveries set status=$2,provider_message_id=$3,provider_event_type=$4,provider_error=$5,
        sent_at=case when $2='sent' then now() else sent_at end,last_provider_event_at=now() where id=$1`,
        [
          id,
          ok ? "sent" : "failed",
          result.id ?? null,
          ok ? "api.accepted" : "api.rejected",
          result.error ?? (ok ? null : "Email provider unavailable"),
        ],
      );
      await db.query(
        `insert into audit.event_log(actor_type,action,entity_type,entity_id,data)
        values('system','delivery.additional_public_sent','delivery',$1,$2)`,
        [id, JSON.stringify({ accepted: ok, providerMessageId: result.id ?? null })],
      );
      await db.query("commit");
      if (ok) accepted++;
      else failed++;
    } catch {
      await db.query("rollback");
      failed++;
    } finally {
      db.release();
    }
  }
  return { accepted, failed };
}

/** Persisted outbox recovery on process startup; no in-memory delay/timer.
 * Only queued additional sends are resumed. Accepted records are never resent.
 * The same provider key makes crash-after-send/before-commit replay safe within
 * its 24-hour window. Older uncertain records need manual provider reconciliation.
 */
export async function recoverAdditionalDeliveryOutbox(): Promise<void> {
  const { rows } = await pool.query<{ id: string }>(`select distinct d.id from app.deliveries d
    join app.administrator_actions a on d.id=any(a.delivery_ids)
    where d.status='queued' and d.created_at>now()-interval '23 hours' limit 100`);
  if (rows.length) await dispatchAdditionalDeliveries(rows.map((d) => d.id));
}
