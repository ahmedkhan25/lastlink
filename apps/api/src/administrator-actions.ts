import type { PoolClient } from "pg";
import { queueAdditionalPublicDeliveries } from "./post-release-delivery.js";
function text(value: unknown, max = 500): string {
  if (typeof value !== "string" || value.length > max) throw new Error("Invalid text field");
  return value.trim();
}
function id(value: unknown): string {
  const v = text(value, 36);
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v)) throw new Error("Invalid record");
  return v;
}
function url(value: unknown): string {
  const v = text(value, 2048);
  if (!/^https:\/\//.test(v)) throw new Error("Use an HTTPS image URL");
  return v;
}

// No message, recipient assignment, advocate or account-state operation.
// Removing a contact archives it: released delivery links survive.
export async function runAdministratorAction(
  db: PoolClient,
  registrantId: string,
  raw: unknown,
): Promise<string[]> {
  const b = (raw ?? {}) as Record<string, unknown>;
  let result;
  switch (b.action) {
    case "delivery-retry": {
      // Retry only queued/API-failed additional deliveries from this account;
      // never resubmit accepted/delivered/bounced mail or mint new deliveries.
      const pending = await db.query<{ id: string }>(
        `select distinct d.id from app.deliveries d
        join app.releases r on r.id=d.release_id
        join app.administrator_actions a on d.id=any(a.delivery_ids)
        where r.registrant_id=$1 and d.status in ('queued','failed')
          and (d.provider_message_id is null)`,
        [registrantId],
      );
      return pending.rows.map((d) => d.id);
    }
    case "contact-add": {
      const name = text(b.name, 200);
      const email = text(b.email, 320);
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Enter a name and valid email");
      if (typeof b.notifyPublic !== "boolean")
        throw new Error("Choose whether to send released public messages");
      const existing = await db.query(
        "select id from app.contacts where registrant_id=$1 and lower(email)=lower($2) and archived_at is null",
        [registrantId, email],
      );
      if (existing.rowCount) throw new Error("This email is already in the contact list");
      result = await db.query(
        `insert into app.contacts(registrant_id,full_name,email,relationship,receives_public)
        values($1,$2,$3,$4,$5) returning id`,
        [
          registrantId,
          name,
          email,
          b.relationship ? text(b.relationship, 200) : null,
          b.notifyPublic,
        ],
      );
      return b.notifyPublic
        ? queueAdditionalPublicDeliveries(db, registrantId, result.rows[0].id)
        : [];
    }
    case "contact-remove":
      result = await db.query(
        "update app.contacts set archived_at=coalesce(archived_at,now()) where id=$1 and registrant_id=$2 returning id",
        [id(b.id), registrantId],
      );
      break;
    case "memorial-save": {
      const set = (b.set ?? {}) as Record<string, unknown>;
      const fields = [
        "visibility",
        "headline",
        "location",
        "birth_year",
        "death_year",
        "quote",
        "story",
        "service_when",
        "service_details",
      ];
      const values = fields
        .filter((f) => Object.hasOwn(set, f))
        .map((f) => {
          const v = set[f];
          if (f === "visibility") {
            if (v !== "public" && v !== "unlisted") throw new Error("Invalid visibility");
          } else if (f.endsWith("_year")) {
            if (v !== null && (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 9999))
              throw new Error("Invalid year");
          } else if (v !== null) text(v, f === "story" ? 30000 : 5000);
          return { field: f, value: v };
        });
      if (!values.length) throw new Error("No memorial changes supplied");
      result = await db.query(
        `update app.memorials set ${values.map((v, i) => `${v.field}=$${i + 2}`).join(",")} where registrant_id=$1 returning id`,
        [registrantId, ...values.map((v) => v.value)],
      );
      break;
    }
    case "memorial-status":
      if (b.status !== "published" && b.status !== "hidden")
        throw new Error("Invalid memorial status");
      result = await db.query(
        `update app.memorials set status=$2,published_at=case when $2='published' then coalesce(published_at,now()) else published_at end where registrant_id=$1 returning id`,
        [registrantId, b.status],
      );
      break;
    case "gallery-add":
      result = await db.query(
        `insert into app.memorial_media(memorial_id,url,file_key,sort_order)
        select id,$2,$3,(select count(*)::int from app.memorial_media where memorial_id=m.id) from app.memorials m where registrant_id=$1 returning id`,
        [registrantId, url(b.url), b.key ? text(b.key) : null],
      );
      break;
    case "gallery-caption":
      result = await db.query(
        `update app.memorial_media g set caption=$3,alt_text=$3 from app.memorials m
        where g.id=$1 and g.memorial_id=m.id and m.registrant_id=$2 returning g.id`,
        [id(b.id), registrantId, text(b.caption, 1000)],
      );
      break;
    case "gallery-remove":
      result = await db.query(
        `delete from app.memorial_media g using app.memorials m
        where g.id=$1 and g.memorial_id=m.id and m.registrant_id=$2 returning g.id`,
        [id(b.id), registrantId],
      );
      break;
    case "condolence-review":
      if (b.status !== "approved" && b.status !== "hidden")
        throw new Error("Invalid moderation status");
      result = await db.query(
        `update app.condolences c set status=$3,reviewed_at=now() from app.memorials m
        where c.id=$1 and c.memorial_id=m.id and m.registrant_id=$2 returning c.id`,
        [id(b.id), registrantId, b.status],
      );
      break;
    default:
      throw new Error("This action is not available to account administrators");
  }
  if (!result.rowCount) throw new Error("Record not found in this account");
  return [];
}
