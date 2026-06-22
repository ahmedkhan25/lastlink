import type { Request, Response } from "express";
import { query } from "./db.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";

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
