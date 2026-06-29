import type { Request, Response } from "express";
import { NotificationService, advocateInviteEmail } from "@lastlink/notifications";
import { query } from "./db.js";
import { env } from "./env.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";
import { signAdvocateInvite, verifyAdvocateInvite } from "./tokens.js";

const notifier = new NotificationService({ resendApiKey: env.RESEND_API_KEY, from: env.RESEND_FROM });

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

  const acceptUrl = `${env.ADVOCATE_BASE_URL}/accept/${signAdvocateInvite(id)}`;
  const result = await notifier.send({
    to: adv.email,
    email: advocateInviteEmail({ advocateName: adv.full_name, registrantName: adv.legal_name, acceptUrl }),
    idempotencyKey: `advocate-invite-${id}`,
  });
  if (result.sink) console.log(`[advocate-invite] (no email key) accept URL: ${acceptUrl}`);
  await query("update app.advocates set invite_status = 'pending', invited_at = now() where id = $1", [id]);
  await logEvent({ actorType: "registrant", actorId: who.userId, action: "advocate.invited", entityType: "advocate", entityId: id, data: { sink: result.sink } });

  res.json({ ok: true, sentTo: adv.email, delivered: !result.sink });
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
