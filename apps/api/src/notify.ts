import { NotificationService } from "@lastlink/notifications";
import { env } from "./env.js";

// Loud warning if prod is about to send from an unverified test domain — that
// sender can only deliver to the Resend account owner, so real recipients 403
// and email silently fails. See docs/EMAIL-prod-not-sending.md.
if (process.env.NODE_ENV === "production" && env.RESEND_FROM.includes("resend.dev")) {
  // eslint-disable-next-line no-console
  console.warn(
    "[notify] RESEND_FROM is a resend.dev test sender — email will only reach the Resend account owner. " +
      "Verify a domain at resend.com/domains and set RESEND_FROM.",
  );
}

// Shared email sender (Resend, or log-sink when no key).
export const notifier = new NotificationService({ resendApiKey: env.RESEND_API_KEY, from: env.RESEND_FROM });
