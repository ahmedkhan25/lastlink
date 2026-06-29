import { Resend } from "resend";
import type { Email } from "./templates.js";

export * from "./templates.js";

export interface SendInput {
  to: string;
  email: Email;
  idempotencyKey?: string; // prevents duplicate posthumous sends
}

export interface NotificationConfig {
  resendApiKey?: string;
  from?: string;
}

/**
 * Email sender (Resend). When no API key is configured it runs as a log-sink so
 * the flow still works in dev/demo; swap to live by setting RESEND_API_KEY.
 * SMS (Twilio) is out of scope for this increment — email only.
 */
export class NotificationService {
  private resend?: Resend;
  private from: string;

  constructor(cfg: NotificationConfig) {
    this.from = cfg.from ?? "LastLink <onboarding@resend.dev>";
    if (cfg.resendApiKey) this.resend = new Resend(cfg.resendApiKey);
  }

  async send({ to, email, idempotencyKey }: SendInput): Promise<{ id?: string; sink: boolean; error?: string }> {
    if (!this.resend) {
      // eslint-disable-next-line no-console
      console.log(`[notifications:log-sink] → ${to} · ${email.subject}`);
      return { sink: true };
    }
    // Resend returns { data, error } — it does not throw on send failures.
    const { data, error } = await this.resend.emails.send(
      { from: this.from, to, subject: email.subject, html: email.html },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
    if (error) {
      // eslint-disable-next-line no-console
      console.error(`[notifications] resend error → ${to}: ${error.message}`);
      return { sink: false, error: error.message };
    }
    return { id: data?.id, sink: false };
  }
}
