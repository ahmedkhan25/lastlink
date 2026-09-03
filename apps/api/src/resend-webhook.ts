import type { Request, Response } from "express";
import { Webhook } from "svix";
import { pool } from "./db.js";
import { env } from "./env.js";
import { deliveryStatusForResendEvent } from "./delivery-policy.js";

interface ResendWebhookEvent {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    [key: string]: unknown;
  };
}

function eventError(event: ResendWebhookEvent): string | null {
  if (!event.type || !["email.bounced", "email.complained", "email.failed", "email.suppressed"].includes(event.type)) return null;
  const detail = event.data?.bounce ?? event.data?.failed ?? event.data?.error ?? null;
  return detail ? JSON.stringify(detail).slice(0, 2000) : event.type;
}

// POST /webhooks/resend — verify the raw Svix payload, dedupe at-least-once
// delivery, and apply only the newest provider event for each message.
export async function resendWebhook(req: Request, res: Response): Promise<void> {
  if (!env.RESEND_WEBHOOK_SECRET) return void res.status(503).send("webhook secret not configured");
  const eventId = String(req.headers["svix-id"] ?? "");
  const timestamp = String(req.headers["svix-timestamp"] ?? "");
  const signature = String(req.headers["svix-signature"] ?? "");
  if (!eventId || !timestamp || !signature || !Buffer.isBuffer(req.body)) return void res.status(400).send("invalid webhook request");

  let event: ResendWebhookEvent;
  try {
    const payload = req.body.toString("utf8");
    new Webhook(env.RESEND_WEBHOOK_SECRET).verify(payload, {
      "svix-id": eventId,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    });
    event = JSON.parse(payload) as ResendWebhookEvent;
  } catch {
    return void res.status(400).send("bad signature");
  }

  const eventType = event.type ?? "unknown";
  const providerMessageId = event.data?.email_id ?? null;
  const eventDate = event.created_at ? new Date(event.created_at) : new Date();
  const providerEventAt = Number.isNaN(eventDate.getTime()) ? new Date() : eventDate;
  const status = deliveryStatusForResendEvent(eventType);
  const client = await pool.connect();
  try {
    await client.query("begin");
    const inserted = await client.query(
      `insert into app.provider_webhook_events (event_id, provider, event_type, provider_message_id, provider_event_at)
       values ($1,'resend',$2,$3,$4) on conflict (event_id) do nothing returning event_id`,
      [eventId, eventType, providerMessageId, providerEventAt],
    );
    if (inserted.rowCount && status && providerMessageId) {
      await client.query(
        `update app.deliveries
            set status=$2, provider_event_type=$3, provider_error=$4,
                last_provider_event_at=$5,
                sent_at=case when $2='sent' then coalesce(sent_at,$5) else sent_at end,
                delivered_at=case when $2='delivered' then coalesce(delivered_at,$5) else delivered_at end
          where provider_message_id=$1
            and (last_provider_event_at is null or last_provider_event_at <= $5)`,
        [providerMessageId, status, eventType, eventError(event), providerEventAt],
      );
    }
    await client.query("commit");
    res.sendStatus(200);
  } catch (err) {
    await client.query("rollback").catch(() => {});
    console.error("[resend-webhook] handler error", err);
    res.sendStatus(500);
  } finally {
    client.release();
  }
}
