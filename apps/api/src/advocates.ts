import type { Request, Response } from "express";
import { advocateInviteEmail } from "@lastlink/notifications";
import { query } from "./db.js";
import { env } from "./env.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";
import { signAdvocateInvite, verifyAdvocateInvite } from "./tokens.js";
import { notifier } from "./notify.js";

// POST /api/advocates/:id/invite — registrant sends the advocate their email invite.
export async function inviteAdvocate(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) return void res.status(401).json({ error: "unauthorized" });
  const id = String(req.params.id);

  const r = await query<{ full_name: string; email: string; legal_name: string }>(
    `select a.full_name, a.email, reg.legal_name
       from app.advocates a join app.registrants reg on reg.id = a.registrant_id
      where a.id = $1 and a.registrant_id = $2`,
    [id, who.registrantId],
  );
  const adv = r.rows[0];
  if (!adv) return void res.status(404).json({ error: "advocate not found" });

  const token = signAdvocateInvite(id);
  const acceptUrl = `${env.ADVOCATE_BASE_URL}/accept/${token}`;
  const result = await notifier.send({
    to: adv.email,
    email: advocateInviteEmail({ advocateName: adv.full_name, registrantName: adv.legal_name, acceptUrl }),
    // Unique per send (token varies each call) → invites can be re-sent; true
    // retries within the request still dedupe.
    idempotencyKey: `advocate-invite-${token.slice(0, 24)}`,
  });
  if (result.sink) console.log(`[advocate-invite] (no email key) accept URL: ${acceptUrl}`);
  await query("update app.advocates set invite_status = 'pending', invited_at = now() where id = $1", [id]);
  await logEvent({ actorType: "registrant", actorId: who.userId, action: "advocate.invited", entityType: "advocate", entityId: id, data: { sink: result.sink } });

  res.json({ ok: true, sentTo: adv.email, delivered: !result.sink && !result.error, error: result.error });
}

// GET /advocate/invite/:token — advocate accept page payload (token-auth).
export async function getInvite(req: Request, res: Response): Promise<void> {
  const advId = verifyAdvocateInvite(String(req.params.token));
  if (!advId) return void res.status(401).json({ error: "invalid or expired invite" });
  const r = await query<{ full_name: string; relationship: string | null; invite_status: string; legal_name: string }>(
    `select a.full_name, a.relationship, a.invite_status, reg.legal_name
       from app.advocates a join app.registrants reg on reg.id = a.registrant_id where a.id = $1`,
    [advId],
  );
  const row = r.rows[0];
  if (!row) return void res.status(404).json({ error: "not found" });
  res.json({
    advocate: { name: row.full_name, relationship: row.relationship, status: row.invite_status },
    registrantName: row.legal_name,
  });
}

// POST /advocate/request-link — an advocate re-enters when the day comes. They
// won't have the year-old email; they enter their address and we mint a FRESH
// secure link and email it. Always 200 (never reveal whether the email exists).
export async function requestAdvocateLink(req: Request, res: Response): Promise<void> {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return void res.status(400).json({ error: "Enter a valid email." });

  const r = await query<{ id: string; full_name: string; legal_name: string }>(
    `select a.id, a.full_name, reg.legal_name
       from app.advocates a join app.registrants reg on reg.id = a.registrant_id
      where lower(a.email) = $1 and reg.account_state in ('active_sealed','in_verification')`,
    [email],
  );
  for (const adv of r.rows) {
    const url = `${env.ADVOCATE_BASE_URL}/confirm/${signAdvocateInvite(adv.id)}`;
    await notifier.send({
      to: email,
      email: {
        subject: `Your LastLink advocate link for ${adv.legal_name}`,
        html: `<p>${adv.full_name}, here is your secure link to act as <strong>${adv.legal_name}</strong>'s advocate. `
          + `If they have passed, open it to begin the confirmation — both advocates confirm independently, then a 24-hour hold before anything is released.</p>`
          + `<p><a href="${url}">Open your advocate page</a></p>`
          + `<p style="color:#888;font-size:12px">If you didn't request this, you can ignore it.</p>`,
      },
    });
  }
  await logEvent({ actorType: "advocate", action: "advocate.link_requested", entityType: "advocate", entityId: email, data: { matched: r.rows.length } });
  res.json({ ok: true });
}

// POST /advocate/invite/:token/accept — advocate accepts the role (token-auth).
export async function acceptInvite(req: Request, res: Response): Promise<void> {
  const advId = verifyAdvocateInvite(String(req.params.token));
  if (!advId) return void res.status(401).json({ error: "invalid or expired invite" });
  await query(
    "update app.advocates set invite_status = 'accepted', accepted_at = now(), identity_verified = true where id = $1",
    [advId],
  );
  await logEvent({ actorType: "advocate", actorId: advId, action: "advocate.accepted", entityType: "advocate", entityId: advId });
  res.json({ ok: true });
}
