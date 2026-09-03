import type pg from "pg";
import type { MessageAudience as AudienceType } from "@lastlink/shared";

export interface MessageAudienceSelection {
  audienceType: AudienceType;
  contactIds: string[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseMessageAudience(body: unknown): MessageAudienceSelection {
  const value = (body ?? {}) as { audienceType?: unknown; contactIds?: unknown };
  const audienceType = value.audienceType === "private" ? "private" : value.audienceType === "public" || value.audienceType == null ? "public" : null;
  if (!audienceType) throw new Error("audience must be public or private");

  const rawIds = Array.isArray(value.contactIds) ? value.contactIds : [];
  const contactIds = [...new Set(rawIds.filter((id): id is string => typeof id === "string"))];
  if (contactIds.some((id) => !UUID.test(id))) throw new Error("invalid contact selection");
  if (audienceType === "private" && contactIds.length === 0) throw new Error("choose at least one private recipient");
  if (contactIds.length > 1000) throw new Error("too many recipients");
  return { audienceType, contactIds: audienceType === "private" ? contactIds : [] };
}

export async function assertOwnedAudience(
  db: Pick<pg.PoolClient, "query">,
  registrantId: string,
  audience: MessageAudienceSelection,
): Promise<void> {
  if (audience.audienceType === "public") return;
  const result = await db.query<{ id: string }>(
    "select id from app.contacts where registrant_id=$1 and email is not null and id = any($2::uuid[])",
    [registrantId, audience.contactIds],
  );
  if (result.rows.length !== audience.contactIds.length) throw new Error("selected contacts must belong to you and have an email address");
}

export async function insertMessageRecipients(
  db: Pick<pg.PoolClient, "query">,
  messageId: string,
  audience: MessageAudienceSelection,
): Promise<void> {
  if (audience.audienceType !== "private") return;
  await db.query(
    `insert into app.message_recipients (message_id, contact_id)
     select $1, unnest($2::uuid[])`,
    [messageId, audience.contactIds],
  );
}
