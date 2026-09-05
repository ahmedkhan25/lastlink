import type { Request, Response } from "express";
import type { AccountStatus } from "@lastlink/shared";
import { query } from "./db.js";
import { requireRegistrant } from "./auth.js";

export async function readAccountStatus(registrantId: string): Promise<AccountStatus> {
  const reg = await query<{ legal_name: string; account_state: string }>(
    "select legal_name,account_state from app.registrants where id=$1",
    [registrantId],
  );
  const cases = await query<{
    id: string;
    state: string;
    reportedDate: string | null;
    releasedAt: string | null;
    holdExpiresAt: string | null;
  }>(
    `select id,state,reported_dod::text as "reportedDate",released_at as "releasedAt",hold_expires_at as "holdExpiresAt"
      from app.verification_cases where registrant_id=$1 order by created_at desc limit 1`,
    [registrantId],
  );
  const c = cases.rows[0];
  const confirmations = c
    ? await query<{ name: string; slot: string; confirmedAt: string }>(
        `select a.full_name as name,a.slot,c.created_at as "confirmedAt" from app.advocate_confirmations c
     join app.advocates a on a.id=c.advocate_id where c.case_id=$1 and a.registrant_id=$2 and c.decision='confirm'
     order by c.created_at`,
        [c.id, registrantId],
      )
    : { rows: [] };
  const deliveries = c
    ? await query<AccountStatus["deliveries"][number]>(
        `select d.id,m.title,m.type,ct.full_name as "recipientName",coalesce(d.recipient_email,ct.email) as email,d.status,
      d.sent_at as "sentAt",d.delivered_at as "deliveredAt"
     from app.deliveries d join app.releases r on r.id=d.release_id
     join app.messages m on m.id=d.message_id join app.contacts ct on ct.id=d.contact_id
     where r.case_id=$1 and r.registrant_id=$2 order by d.created_at,d.id`,
        [c.id, registrantId],
      )
    : { rows: [] };
  const publicMessages = c
    ? await query<AccountStatus["publicMessages"][number]>(
        `select m.id,m.title,m.type
    from app.release_messages s join app.releases r on r.id=s.release_id join app.messages m on m.id=s.message_id
    where r.case_id=$1 and r.registrant_id=$2 and s.audience_type='public'`,
        [c.id, registrantId],
      )
    : { rows: [] };
  return {
    legalName: reg.rows[0]?.legal_name ?? "Account",
    accountState: reg.rows[0]?.account_state ?? "unknown",
    case: c
      ? {
          ...c,
          confirmations: confirmations.rows,
          confirmedAt: confirmations.rows.length === 2 ? confirmations.rows[1]!.confirmedAt : null,
        }
      : null,
    deliveries: deliveries.rows,
    publicMessages: publicMessages.rows,
  };
}

export async function getAccountStatus(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  res.set("Cache-Control", "no-store").json(await readAccountStatus(who.registrantId));
}
