import { query } from "./db.js";

export interface AuditEvent {
  actorType: "registrant" | "advocate" | "recipient" | "org_admin" | "system";
  actorId?: string;
  action: string; // e.g. "advocate.confirmed", "case.released"
  entityType?: string;
  entityId?: string;
  data?: Record<string, unknown>;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Append a row to audit.event_log. Powers the advocate/enterprise/recipient
 * timelines. (Hash-chaining + append-only triggers are deferred to hardening.)
 */
export async function logEvent(e: AuditEvent): Promise<void> {
  await query(
    `insert into audit.event_log
       (actor_type, actor_id, action, entity_type, entity_id, data, request_id, ip, user_agent)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      e.actorType,
      e.actorId ?? null,
      e.action,
      e.entityType ?? null,
      e.entityId ?? null,
      e.data ? JSON.stringify(e.data) : null,
      e.requestId ?? null,
      e.ip ?? null,
      e.userAgent ?? null,
    ],
  );
}
