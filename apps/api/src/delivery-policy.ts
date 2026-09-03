export const RESEND_DELIVERY_STATUS = {
  "email.sent": "sent",
  "email.delivery_delayed": "delayed",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
  "email.suppressed": "failed",
} as const;

export function deliveryStatusForResendEvent(eventType: string): string | null {
  return RESEND_DELIVERY_STATUS[eventType as keyof typeof RESEND_DELIVERY_STATUS] ?? null;
}

// Public messages go to contacts who opted into the Public list. Private
// messages go only to the contacts explicitly selected for that message.
export function isRecipientAuthorized(
  audienceType: "public" | "private",
  receivesPublic: boolean,
  selectedContactId: string | null,
): boolean {
  return audienceType === "public" ? receivesPublic : selectedContactId !== null;
}
