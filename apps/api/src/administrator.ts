import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import { pool } from "./db.js";
import { resolveAdministrator } from "./admin-access.js";
import { readAccountStatus } from "./account-status.js";
import { runAdministratorAction } from "./administrator-actions.js";
import { dispatchAdditionalDeliveries } from "./post-release-delivery.js";

export async function getAdministratorAccount(req: Request, res: Response): Promise<void> {
  res.set("Cache-Control", "no-store");
  const who = await resolveAdministrator(
    req.header("authorization")?.replace(/^Bearer /, "") ?? "",
  );
  if (!who)
    return void res
      .status(401)
      .json({ error: "Administrator link expired or invalid. Request a fresh email link." });
  res.json({
    administrator: { name: who.name, role: "Account administrator" },
    account: await readAccountStatus(who.registrantId),
  });
}

export async function manageAdministratorAccount(req: Request, res: Response): Promise<void> {
  const key = req.header("idempotency-key")?.trim();
  if (!key || key.length > 200)
    return void res.status(400).json({ error: "Idempotency-Key required" });
  const token = req.header("authorization")?.replace(/^Bearer /, "") ?? "";
  const who = await resolveAdministrator(token);
  if (!who) return void res.status(401).json({ error: "Administrator link expired or invalid" });
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `select r.id from app.registrants r join app.advocates a on a.registrant_id=r.id
      join app.verification_cases v on v.registrant_id=r.id join app.administrator_links l on l.case_id=v.id and l.advocate_id=a.id
      where l.id=$1 for update of r,a,v,l`,
      [who.linkId],
    );
    if (!(await resolveAdministrator(token, client)))
      throw new Error("Administrator access no longer available");
    const hash = createHash("sha256")
      .update(JSON.stringify(req.body ?? {}))
      .digest("hex");
    const inserted = await client.query(
      `insert into app.administrator_actions(link_id,request_key,body_hash)
      values($1,$2,$3) on conflict do nothing returning link_id`,
      [who.linkId, key, hash],
    );
    if (!inserted.rowCount) {
      const previous = await client.query(
        "select body_hash,delivery_ids from app.administrator_actions where link_id=$1 and request_key=$2",
        [who.linkId, key],
      );
      await client.query("rollback");
      if (previous.rows[0]?.body_hash !== hash)
        return void res.status(409).json({ error: "Request key already used for another action" });
      return void res.json({
        ok: true,
        emails: await dispatchAdditionalDeliveries(previous.rows[0].delivery_ids),
      });
    }
    const deliveryIds = await runAdministratorAction(client, who.registrantId, req.body);
    await client.query(
      "update app.administrator_actions set delivery_ids=$3 where link_id=$1 and request_key=$2",
      [who.linkId, key, deliveryIds],
    );
    await client.query(
      `insert into audit.event_log(actor_type,actor_id,action,entity_type,entity_id,data,request_id)
      values('advocate',$1,'administrator.managed','registrant',$2,$3,$4)`,
      [
        who.advocateId,
        who.registrantId,
        JSON.stringify({ action: req.body.action, targetId: req.body.id ?? null }),
        key,
      ],
    );
    await client.query("commit");
    res.json({ ok: true, emails: await dispatchAdditionalDeliveries(deliveryIds) });
  } catch (e) {
    await client.query("rollback");
    res.status(400).json({ error: e instanceof Error ? e.message : "Unable to save changes" });
  } finally {
    client.release();
  }
}
