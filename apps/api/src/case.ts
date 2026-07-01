import type { Request, Response } from "express";
import { applyConfirmation, canCancel, isReleasable, type Confirmation } from "@lastlink/verification";
import { resolveHoldDurationMs, type AdvocateSlot, type AdvocateDecision } from "@lastlink/shared";
import { recipientMessageEmail } from "@lastlink/notifications";
import { pool, query } from "./db.js";
import { env } from "./env.js";
import { logEvent } from "./audit.js";
import { verifyAdvocateInvite, signAdvocateInvite, signRecipientToken } from "./tokens.js";
import { notifier } from "./notify.js";
import crypto from "node:crypto";

interface Who { advocateId: string; registrantId: string; slot: AdvocateSlot; advocateName: string; registrantName: string }

async function resolveAdvocate(token: string): Promise<Who | null> {
  const advId = verifyAdvocateInvite(token);
  if (!advId) return null;
  const { rows } = await query<{ registrant_id: string; slot: string; full_name: string; legal_name: string }>(
    `select a.registrant_id, a.slot, a.full_name, r.legal_name
       from app.advocates a join app.registrants r on r.id = a.registrant_id where a.id = $1`,
    [advId],
  );
  const row = rows[0];
  if (!row) return null;
  return { advocateId: advId, registrantId: row.registrant_id, slot: row.slot as AdvocateSlot, advocateName: row.full_name, registrantName: row.legal_name };
}

async function activeCase(registrantId: string) {
  const { rows } = await query<{ id: string; state: string; hold_expires_at: string | null; reported_dod: string | null }>(
    `select id, state, hold_expires_at, reported_dod from app.verification_cases
       where registrant_id = $1 and state not in ('released','cancelled') order by created_at desc limit 1`,
    [registrantId],
  );
  return rows[0] ?? null;
}

async function caseConfirmations(caseId: string): Promise<{ confirmations: Confirmation[]; mineBy: Record<string, boolean> }> {
  const { rows } = await query<{ slot: string; decision: string }>(
    `select a.slot, c.decision from app.advocate_confirmations c join app.advocates a on a.id = c.advocate_id where c.case_id = $1`,
    [caseId],
  );
  return {
    confirmations: rows.map((r) => ({ slot: r.slot as AdvocateSlot, decision: r.decision as AdvocateDecision })),
    mineBy: Object.fromEntries(rows.map((r) => [r.slot, true])),
  };
}

// GET /advocate/:token/case — advocate's view of the case (or invitation to start one).
export async function getCase(req: Request, res: Response): Promise<void> {
  const who = await resolveAdvocate(String(req.params.token));
  if (!who) return void res.status(401).json({ error: "invalid link" });
  const c = await activeCase(who.registrantId);
  const advocates = await query<{ slot: string; full_name: string; invite_status: string }>(
    "select slot, full_name, invite_status from app.advocates where registrant_id=$1 order by slot", [who.registrantId],
  );
  let confirmations: Confirmation[] = [];
  let mineBy: Record<string, boolean> = {};
  if (c) ({ confirmations, mineBy } = await caseConfirmations(c.id));
  const contactCount = await query<{ n: string }>("select count(*) n from app.contacts where registrant_id=$1", [who.registrantId]);

  res.json({
    registrantName: who.registrantName,
    advocate: { name: who.advocateName, slot: who.slot },
    advocates: advocates.rows.map((a) => ({ slot: a.slot, name: a.full_name, status: a.invite_status })),
    contactsAffected: Number(contactCount.rows[0]?.n ?? 0),
    case: c ? {
      id: c.id, state: c.state, holdExpiresAt: c.hold_expires_at,
      iConfirmed: !!mineBy[who.slot],
      confirmCount: confirmations.filter((x) => x.decision === "confirm").length,
    } : null,
  });
}

// POST /advocate/:token/initiate — start a verification case (demo: an advocate reports the passing).
export async function initiateCase(req: Request, res: Response): Promise<void> {
  const who = await resolveAdvocate(String(req.params.token));
  if (!who) return void res.status(401).json({ error: "invalid link" });
  if (await activeCase(who.registrantId)) return void res.status(409).json({ error: "a case is already open" });

  const reportedDod = typeof req.body?.reportedDod === "string" ? req.body.reportedDod : null;
  const ins = await query<{ id: string }>(
    `insert into app.verification_cases (registrant_id, state, initiated_by, reported_dod)
     values ($1, 'initiated', $2, $3) returning id`,
    [who.registrantId, who.advocateId, reportedDod],
  );
  const caseId = ins.rows[0]!.id;
  await query("update app.registrants set account_state='in_verification', updated_at=now() where id=$1", [who.registrantId]);
  await logEvent({ actorType: "advocate", actorId: who.advocateId, action: "case.initiated", entityType: "case", entityId: caseId });

  // Email BOTH advocates a confirmation link.
  const advs = await query<{ id: string; full_name: string; email: string }>(
    "select id, full_name, email from app.advocates where registrant_id=$1", [who.registrantId]);
  for (const a of advs.rows) {
    const url = `${env.ADVOCATE_BASE_URL}/confirm/${signAdvocateInvite(a.id)}`;
    await notifier.send({
      to: a.email,
      email: {
        subject: `Action needed: confirm ${who.registrantName}'s passing`,
        html: `<p>${a.full_name}, a request has been made to confirm the passing of <strong>${who.registrantName}</strong>. Both advocates must confirm, independently, before anything is released.</p><p><a href="${url}">Review and confirm</a></p>`,
      },
      idempotencyKey: `case-${caseId}-adv-${a.id}`,
    });
  }
  res.json({ ok: true, caseId, state: "initiated" });
}

// POST /advocate/:token/confirm — confirm/dispute/decline the death details.
export async function confirmCase(req: Request, res: Response): Promise<void> {
  const who = await resolveAdvocate(String(req.params.token));
  if (!who) return void res.status(401).json({ error: "invalid link" });
  const c = await activeCase(who.registrantId);
  if (!c) return void res.status(404).json({ error: "no open case" });

  const decision = (req.body?.decision ?? "confirm") as AdvocateDecision;
  const details = req.body?.details ?? {};
  const { confirmations } = await caseConfirmations(c.id);
  const result = applyConfirmation(c.state as never, confirmations, who.slot, decision);
  if (!result.ok) return void res.status(409).json({ error: result.error });

  await query(
    `insert into app.advocate_confirmations (case_id, advocate_id, confirmed_details, decision, ip, user_agent)
     values ($1,$2,$3,$4,$5,$6) on conflict (case_id, advocate_id) do nothing`,
    [c.id, who.advocateId, JSON.stringify(details), decision, req.ip ?? null, req.headers["user-agent"] ?? null],
  );

  let holdExpiresAt: string | null = null;
  if (result.startsHold) {
    const holdMs = resolveHoldDurationMs(env.HOLD_DURATION_MS);
    const r = await query<{ hold_expires_at: string }>(
      `update app.verification_cases set state='safety_hold', hold_started_at=now(),
         hold_expires_at = now() + ($2 || ' milliseconds')::interval, updated_at=now()
       where id=$1 returning hold_expires_at`,
      [c.id, String(holdMs)],
    );
    holdExpiresAt = r.rows[0]?.hold_expires_at ?? null;
    // Contact attempt to the registrant during the hold.
    const reg = await query<{ legal_name: string }>("select legal_name from app.registrants where id=$1", [who.registrantId]);
    void reg;
    await logEvent({ actorType: "system", action: "hold.started", entityType: "case", entityId: c.id, data: { holdExpiresAt } });
  } else {
    await query("update app.verification_cases set state=$2, updated_at=now() where id=$1", [c.id, result.nextState]);
  }
  await logEvent({ actorType: "advocate", actorId: who.advocateId, action: `advocate.${decision}`, entityType: "case", entityId: c.id });

  res.json({ ok: true, state: result.nextState, holdExpiresAt, startsHold: !!result.startsHold });
}

// POST /advocate/:token/cancel — stop the release (the safety).
export async function cancelCase(req: Request, res: Response): Promise<void> {
  const who = await resolveAdvocate(String(req.params.token));
  if (!who) return void res.status(401).json({ error: "invalid link" });
  const c = await activeCase(who.registrantId);
  if (!c) return void res.status(404).json({ error: "no open case" });
  if (!canCancel(c.state as never)) return void res.status(409).json({ error: "cannot cancel" });

  await query("update app.verification_cases set state='cancelled', cancelled_at=now(), cancel_reason=$2, updated_at=now() where id=$1",
    [c.id, req.body?.reason ?? "advocate stopped the release"]);
  await query("update app.registrants set account_state='active_sealed', updated_at=now() where id=$1", [who.registrantId]);
  await logEvent({ actorType: "advocate", actorId: who.advocateId, action: "case.cancelled", entityType: "case", entityId: c.id });
  res.json({ ok: true, state: "cancelled" });
}

// POST /advocate/:token/release — demo time-warp: advance the hold and release (inline, no worker).
// Re-checks state in a transaction with FOR UPDATE so a cancel-a-ms-earlier no-ops.
export async function releaseNow(req: Request, res: Response): Promise<void> {
  const who = await resolveAdvocate(String(req.params.token));
  if (!who) return void res.status(401).json({ error: "invalid link" });
  const c = await activeCase(who.registrantId);
  if (!c) return void res.status(404).json({ error: "no open case" });

  const client = await pool.connect();
  try {
    await client.query("begin");
    const locked = await client.query<{ state: string; hold_expires_at: string | null }>(
      "select state, hold_expires_at from app.verification_cases where id=$1 for update", [c.id]);
    const row = locked.rows[0];
    // Time-warp the hold to now, then re-check the guard.
    await client.query("update app.verification_cases set hold_expires_at = now() where id=$1 and state='safety_hold'", [c.id]);
    if (!row || !isReleasable(row.state as never, Date.now(), Date.now())) {
      await client.query("rollback");
      return void res.status(409).json({ error: `not releasable (state: ${row?.state})` });
    }
    await client.query("update app.verification_cases set state='releasing', release_authorized_at=now() where id=$1", [c.id]);

    const rel = await client.query<{ id: string }>(
      "insert into app.releases (case_id, registrant_id, status) values ($1,$2,'in_progress') returning id", [c.id, who.registrantId]);
    const releaseId = rel.rows[0]!.id;

    const messages = await client.query<{ id: string; title: string | null; type: string }>(
      "select id, title, type from app.messages where registrant_id=$1 and status='ready'", [who.registrantId]);
    const contacts = await client.query<{ id: string; full_name: string; email: string | null }>(
      "select id, full_name, email from app.contacts where registrant_id=$1 and email is not null", [who.registrantId]);

    const emails: { to: string; recipientName: string; openUrl: string }[] = [];
    for (const m of messages.rows) {
      for (const ct of contacts.rows) {
        const del = await client.query<{ id: string }>(
          `insert into app.deliveries (release_id, message_id, contact_id, channel, status)
           values ($1,$2,$3,'email','queued')
           on conflict (release_id, message_id, contact_id, channel) do nothing returning id`,
          [releaseId, m.id, ct.id]);
        if (!del.rows[0]) continue;
        const deliveryId = del.rows[0].id;
        const token = signRecipientToken(deliveryId);
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const tk = await client.query<{ id: string }>(
          `insert into app.recipient_tokens (delivery_id, contact_id, message_id, token_hash, expires_at)
           values ($1,$2,$3,$4, now() + interval '30 days') returning id`,
          [deliveryId, ct.id, m.id, tokenHash]);
        await client.query("update app.deliveries set recipient_token_id=$1, status='sent', sent_at=now() where id=$2", [tk.rows[0]!.id, deliveryId]);
        emails.push({ to: ct.email!, recipientName: ct.full_name, openUrl: `${env.MESSAGE_BASE_URL}/m/${token}` });
      }
    }

    await client.query("update app.releases set status='complete', completed_at=now() where id=$1", [releaseId]);
    await client.query("update app.verification_cases set state='released', released_at=now() where id=$1", [c.id]);
    await client.query("update app.registrants set account_state='released', updated_at=now() where id=$1", [who.registrantId]);
    await client.query("commit");

    // Send recipient emails outside the txn (idempotent per delivery).
    for (const e of emails) {
      await notifier.send({
        to: e.to,
        email: recipientMessageEmail({ recipientName: e.recipientName, registrantName: who.registrantName, openUrl: e.openUrl }),
        idempotencyKey: `release-${releaseId}-${e.to}-${e.openUrl.slice(-12)}`,
      });
    }
    await logEvent({ actorType: "system", action: "case.released", entityType: "case", entityId: c.id, data: { deliveries: emails.length } });
    res.json({ ok: true, state: "released", recipientsNotified: emails.length });
  } catch (err) {
    await client.query("rollback").catch(() => {});
    res.status(500).json({ error: String(err) });
  } finally {
    client.release();
  }
}
