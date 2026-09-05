// Additive fixture entirely rolled back; no external notifications or user edits.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool } from "../apps/api/src/db.js";
import { env } from "../apps/api/src/env.js";
import { runAdministratorAction } from "../apps/api/src/administrator-actions.js";
import { queueAdditionalPublicDeliveries } from "../apps/api/src/post-release-delivery.js";
import { resolveAdministrator } from "../apps/api/src/admin-access.js";
import { signAdminToken, hashAdminToken } from "../apps/api/src/admin-token.js";
const db = await pool.connect();
try {
  await db.query("begin");
  const userId = `test-${randomUUID()}`;
  await db.query(
    `insert into public."user"(id,name,email,"emailVerified","createdAt","updatedAt") values($1,'Rollback fixture',$2,false,now(),now())`,
    [userId, `${userId}@example.invalid`],
  );
  const reg = (
    await db.query(
      `insert into app.registrants(user_id,legal_name,account_state) values($1,'Admin integration fixture','released') returning id`,
      [userId],
    )
  ).rows[0].id;
  const advs = (
    await db.query(
      `insert into app.advocates(registrant_id,slot,full_name,email,invite_status)
    values($1,'A','Test A','test-a@example.invalid','accepted'),($1,'B','Test B','test-b@example.invalid','accepted') returning id`,
      [reg],
    )
  ).rows;
  const c = (
    await db.query(
      `insert into app.verification_cases(registrant_id,state) values($1,'released') returning id`,
      [reg],
    )
  ).rows[0].id;
  await db.query(
    `insert into app.advocate_confirmations(case_id,advocate_id,decision) values($1,$2,'confirm'),($1,$3,'confirm')`,
    [c, advs[0].id, advs[1].id],
  );
  const rel = (
    await db.query(
      `insert into app.releases(case_id,registrant_id,status) values($1,$2,'complete') returning id`,
      [c, reg],
    )
  ).rows[0].id;
  const msgs = (
    await db.query(
      `insert into app.messages(registrant_id,type,title,audience_type,status)
    values($1,'letter','Released public','public','ready'),($1,'letter','Released private','private','ready'),($1,'letter','Not in release','public','ready') returning id,audience_type,title`,
      [reg],
    )
  ).rows;
  await db.query(
    `insert into app.release_messages(release_id,message_id,audience_type) values($1,$2,'public'),($1,$3,'private')`,
    [rel, msgs[0].id, msgs[1].id],
  );
  const linkId = randomUUID(),
    expiresAt = new Date(Date.now() + 60000);
  const token = signAdminToken(
    { id: linkId, advocateId: advs[0].id, caseId: c, expiresAt },
    env.ADVOCATE_TOKEN_SECRET,
  );
  await db.query(
    `insert into app.administrator_links(id,advocate_id,case_id,token_hash,request_key,expires_at) values($1,$2,$3,$4,'integration-test',$5)`,
    [linkId, advs[0].id, c, hashAdminToken(token), expiresAt],
  );
  assert.equal((await resolveAdministrator(token, db))?.registrantId, reg);
  await db.query("update app.administrator_links set revoked=true where id=$1", [linkId]);
  assert.equal(await resolveAdministrator(token, db), null);
  await db.query("update app.administrator_links set revoked=false where id=$1", [linkId]);
  await db.query("update app.registrants set account_state='active_sealed' where id=$1", [reg]);
  assert.equal(await resolveAdministrator(token, db), null);
  await db.query("update app.registrants set account_state='released' where id=$1", [reg]);
  const ids = await runAdministratorAction(db, reg, {
    action: "contact-add",
    name: "Missed recipient",
    email: "missed@example.invalid",
    notifyPublic: true,
  });
  assert.equal(ids.length, 1);
  const delivery = (await db.query("select * from app.deliveries where id=$1", [ids[0]])).rows[0];
  assert.equal(delivery.message_id, msgs[0].id);
  assert.equal(delivery.recipient_email, "missed@example.invalid");
  assert.equal((await queueAdditionalPublicDeliveries(db, reg, delivery.contact_id)).length, 0);
  await runAdministratorAction(db, reg, { action: "contact-remove", id: delivery.contact_id });
  assert.equal((await db.query("select id from app.deliveries where id=$1", [ids[0]])).rowCount, 1);
  assert.equal(
    (await db.query("select id from app.recipient_tokens where delivery_id=$1", [ids[0]])).rowCount,
    1,
  );
  assert.equal((await queueAdditionalPublicDeliveries(db, reg, delivery.contact_id)).length, 0);
  await assert.rejects(
    runAdministratorAction(db, reg, { action: "gallery-remove", id: randomUUID() }),
    /not found/,
  );
  await assert.rejects(
    runAdministratorAction(db, reg, { action: "message-create" }),
    /not available/,
  );
  console.log(
    "PASS: scoped auth, revoked/reset rejection, public-release-only fan-out, private/later-message exclusion, delivery dedupe, address snapshot, archive preserves links, cross-record denial. No emails sent.",
  );
} finally {
  await db.query("rollback");
  db.release();
  await pool.end();
}
