import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env.js";

// Stateless signed invite tokens (HMAC). Format: base64url(payload).sig
// payload = "<advocateId>.<expiryMs>". No storage needed for the demo.
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signAdvocateInvite(advocateId: string): string {
  const payload = `${advocateId}.${Date.now() + INVITE_TTL_MS}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload, env.ADVOCATE_TOKEN_SECRET)}`;
}

export function verifyAdvocateInvite(token: string): string | null {
  return verifyToken(token, env.ADVOCATE_TOKEN_SECRET);
}

const RECIPIENT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days ("the link expires; the message stays")

/** Recipient access token encoding the delivery id. */
export function signRecipientToken(deliveryId: string): string {
  const payload = `${deliveryId}.${Date.now() + RECIPIENT_TTL_MS}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload, env.ADVOCATE_TOKEN_SECRET)}`;
}
export function verifyRecipientToken(token: string): string | null {
  return verifyToken(token, env.ADVOCATE_TOKEN_SECRET);
}

function verifyToken(token: string, secret: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = Buffer.from(token.slice(0, dot), "base64url").toString();
  const expected = sign(payload, secret);
  const a = Buffer.from(token.slice(dot + 1));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [id, expStr] = payload.split(".");
  if (!id || !expStr || Date.now() > Number(expStr)) return null;
  return id;
}
