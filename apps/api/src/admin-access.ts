import { randomUUID } from "node:crypto";
import { query, pool } from "./db.js";
import { env } from "./env.js";
import { notifier } from "./notify.js";
import { logEvent } from "./audit.js";
import { administratorAccessEmail } from "@lastlink/notifications";
import { ADMIN_TTL_MS, hashAdminToken, signAdminToken, verifyAdminToken } from "./admin-token.js";
import type { PoolClient } from "pg";
type Database = Pick<PoolClient, "query">;

// Rechecked on every request. Reset, removal, revocation, dispute or loss of
// either distinct confirmation immediately invalidates administrator access.
export const ADMIN_ELIGIBILITY = `r.account_state='released' and v.state='released'
  and a.invite_status='accepted'
  and exists (select 1 from app.advocate_confirmations mine where mine.case_id=v.id and mine.advocate_id=a.id and mine.decision='confirm')
  and (select count(distinct a2.slot) from app.advocate_confirmations c2
    join app.advocates a2 on a2.id=c2.advocate_id
    where c2.case_id=v.id and c2.decision='confirm' and a2.registrant_id=r.id and a2.slot in ('A','B'))=2`;

interface Administrator {
  advocateId: string;
  registrantId: string;
  name: string;
  email: string;
  caseId: string;
  legalName: string;
}
async function eligibleAdministrator(
  advocateId: string,
  db: Database = pool,
): Promise<Administrator | null> {
  const { rows } = await db.query<Administrator>(
    `select a.id as "advocateId",r.id as "registrantId",a.full_name as name,a.email,
     v.id as "caseId",r.legal_name as "legalName" from app.advocates a
     join app.registrants r on r.id=a.registrant_id join app.verification_cases v on v.registrant_id=r.id
     where a.id=$1 and ${ADMIN_ELIGIBILITY} order by v.created_at desc limit 1`,
    [advocateId],
  );
  return rows[0] ?? null;
}

export async function resolveAdministrator(
  token: string,
  db: Database = pool,
): Promise<(Administrator & { linkId: string }) | null> {
  const claims = verifyAdminToken(token, env.ADVOCATE_TOKEN_SECRET);
  if (!claims) return null;
  const { rows } = await db.query<{ id: string }>(
    `select id from app.administrator_links where id=$1 and advocate_id=$2 and case_id=$3
      and token_hash=$4 and expires_at>now() and revoked=false`,
    [claims.jti, claims.sub, claims.caseId, hashAdminToken(token)],
  );
  if (!rows[0]) return null;
  const who = await eligibleAdministrator(claims.sub, db);
  return who?.caseId === claims.caseId ? { ...who, linkId: claims.jti } : null;
}

export async function emailAdministratorLink(
  advocateId: string,
  requestKey: string,
): Promise<boolean> {
  const who = await eligibleAdministrator(advocateId);
  if (!who) return false;
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + ADMIN_TTL_MS);
  const input = { id, advocateId, caseId: who.caseId, expiresAt };
  const initial = signAdminToken(input, env.ADVOCATE_TOKEN_SECRET);
  const { rows } = await query<{
    id: string;
    case_id: string;
    expires_at: Date;
    sent_at: Date | null;
    revoked: boolean;
  }>(
    `insert into app.administrator_links(id,advocate_id,case_id,token_hash,request_key,expires_at)
     values($1,$2,$3,$4,$5,$6) on conflict(advocate_id,request_key) do update
     set request_key=excluded.request_key returning id,case_id,expires_at,sent_at,revoked`,
    [id, advocateId, who.caseId, hashAdminToken(initial), requestKey, expiresAt],
  );
  const link = rows[0]!;
  if (link.revoked || new Date(link.expires_at).getTime() <= Date.now()) return false;
  if (link.sent_at) return true;
  const token = signAdminToken(
    { id: link.id, advocateId, caseId: link.case_id, expiresAt: new Date(link.expires_at) },
    env.ADVOCATE_TOKEN_SECRET,
  );
  // Fragment keeps the credential out of HTTP URLs, access logs and referrers.
  const url = `${env.APP_BASE_URL}/administrator#${token}`;
  const result = await notifier.send({
    to: who.email,
    email: administratorAccessEmail({ advocateName: who.name, registrantName: who.legalName, url }),
    idempotencyKey: `administrator-link-${link.id}`,
  });
  if (result.error || result.sink || !result.id) {
    await logEvent({
      actorType: "system",
      action: "administrator.email_failed",
      entityType: "advocate",
      entityId: advocateId,
    });
    return false;
  }
  await query(
    "update app.administrator_links set sent_at=now(),provider_message_id=$2 where id=$1",
    [link.id, result.id],
  );
  await logEvent({
    actorType: "system",
    action: "administrator.link_emailed",
    entityType: "advocate",
    entityId: advocateId,
    requestId: requestKey,
    data: { caseId: who.caseId, providerMessageId: result.id, expiresAt: link.expires_at },
  });
  return true;
}

export async function notifyCaseAdministrators(
  registrantId: string,
  caseId: string,
): Promise<void> {
  const { rows } = await query<{ id: string }>(
    "select id from app.advocates where registrant_id=$1 order by slot",
    [registrantId],
  );
  for (const a of rows) await emailAdministratorLink(a.id, `release-${caseId}-${a.id}`);
}
