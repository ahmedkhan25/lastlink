import { NotificationService } from "@lastlink/notifications";
import { env } from "./env.js";

// Shared email sender (Resend, or log-sink when no key).
export const notifier = new NotificationService({ resendApiKey: env.RESEND_API_KEY, from: env.RESEND_FROM });
