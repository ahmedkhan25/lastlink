import type { Request, Response } from "express";
import { env } from "./env.js";
import { query } from "./db.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";

// GET /api/account/me — profile bits served over REST (avatar_url is not
// exposed through Hasura; the column is untracked there).
export async function getMe(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const { rows } = await query<{ legal_name: string; avatar_url: string | null }>(
    "select legal_name, avatar_url from app.registrants where id = $1",
    [who.registrantId],
  );
  res.json({
    legalName: rows[0]?.legal_name ?? null,
    avatarUrl: rows[0]?.avatar_url ?? null,
    // Lets the app hide the upload affordance in environments without UploadThing.
    uploadsEnabled: Boolean(env.UPLOADTHING_TOKEN),
  });
}

// POST /api/account/seal — completes onboarding. Sets the account to
// active_sealed. NO recurring check-in is scheduled (product principle #1).
export async function sealAccount(req: Request, res: Response): Promise<void> {
  const who = await requireRegistrant(req.headers);
  if (!who) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  await query(
    `update app.registrants
       set account_state = 'active_sealed', sealed_at = now(), updated_at = now()
     where id = $1 and account_state = 'onboarding'`,
    [who.registrantId],
  );
  await logEvent({
    actorType: "registrant",
    actorId: who.userId,
    action: "account.sealed",
    entityType: "registrant",
    entityId: who.registrantId,
  });
  res.json({ ok: true, account_state: "active_sealed" });
}

// POST /api/demo/reset — DEMO ONLY (gated by DEMO_RESET=true). Resurrects the
// authenticated registrant so the verification → hold → release flow can be
// demoed again: deletes their verification case(s), which cascades to advocate
// confirmations, releases, deliveries, and recipient tokens (invalidating any
// released message links), and returns the account to 'active_sealed'. Messages
// and contacts are untouched. Session-gated: a registrant can only reset itself.
export async function demoReset(req: Request, res: Response): Promise<void> {
  if (process.env.DEMO_RESET !== "true") {
    res.status(404).json({ error: "not found" });
    return;
  }
  const who = await requireRegistrant(req.headers);
  if (!who) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const del = await query<{ id: string }>(
    "delete from app.verification_cases where registrant_id = $1 returning id",
    [who.registrantId],
  );
  await query(
    "update app.registrants set account_state = 'active_sealed', updated_at = now() where id = $1",
    [who.registrantId],
  );
  await logEvent({
    actorType: "registrant",
    actorId: who.userId,
    action: "demo.reset",
    entityType: "registrant",
    entityId: who.registrantId,
    data: { casesDeleted: del.rowCount },
  });
  res.json({ ok: true, casesDeleted: del.rowCount, account_state: "active_sealed" });
}
