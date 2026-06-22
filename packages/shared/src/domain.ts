// Domain unions + plan entitlements. Mirror the DB CHECK constraints exactly
// (db/schema.sql). Keep in sync — these are the TS source of truth.

export const PLANS = ["free", "premium"] as const;
export type Plan = (typeof PLANS)[number];

export const ACCOUNT_STATES = [
  "onboarding",
  "active_sealed",
  "in_verification",
  "released",
  "closed",
] as const;
export type AccountState = (typeof ACCOUNT_STATES)[number];

export const MESSAGE_TYPES = ["video", "audio", "letter"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_STATES = ["draft", "ready", "released"] as const;
export type MessageState = (typeof MESSAGE_STATES)[number];

export const MEDIA_STATES = ["waiting", "processing", "ready", "errored"] as const;
export type MediaState = (typeof MEDIA_STATES)[number];

export const DELIVERY_STATES = ["queued", "sent", "delivered", "bounced", "failed"] as const;
export type DeliveryState = (typeof DELIVERY_STATES)[number];

export const ENTERPRISE_STAGES = [
  "identity_verification",
  "advocate_review",
  "verified_delivering",
  "resolved",
] as const;
export type EnterpriseStage = (typeof ENTERPRISE_STAGES)[number];

export interface PlanLimits {
  messages: number | "unlimited";
  groups: number | "unlimited";
  advocates: number;
  contacts: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { messages: 1, groups: 1, advocates: 2, contacts: 50 },
  premium: { messages: "unlimited", groups: "unlimited", advocates: 2, contacts: 1000 },
};
