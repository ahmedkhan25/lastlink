// Canonical durations, roles, channels. No magic numbers elsewhere — import these.

/** Mandatory cancellable safety hold after both advocates confirm (PRD §4). */
export const HOLD_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Delivery SLA after release authorization — a dispatch deadline, NOT a second wait. */
export const DELIVERY_SLA_MS = 48 * 60 * 60 * 1000; // 48 hours

/** Recipient access token lifetime ("the link expires; the message stays"). */
export const RECIPIENT_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Advocate scoped token lifetime. */
export const ADVOCATE_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Demo time-warp: when set (ms), overrides HOLD_DURATION_MS so the hold is
 * observable live in a demo. Read by the API/worker from env HOLD_DURATION_MS.
 */
export function resolveHoldDurationMs(env?: string | number): number {
  const v = typeof env === "string" ? Number(env) : env;
  return Number.isFinite(v) && (v as number) > 0 ? (v as number) : HOLD_DURATION_MS;
}

export const ROLES = [
  "registrant",
  "advocate",
  "recipient",
  "org_admin",
  "org_case_handler",
  "platform_admin",
  "anonymous",
] as const;
export type Role = (typeof ROLES)[number];

export const REACH_CHANNELS = ["email", "sms"] as const;
export type ReachChannel = (typeof REACH_CHANNELS)[number];
