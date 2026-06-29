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
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const payload = Buffer.from(payloadB64, "base64url").toString();
  const expected = sign(payload, env.ADVOCATE_TOKEN_SECRET);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [advocateId, expStr] = payload.split(".");
  if (!advocateId || !expStr || Date.now() > Number(expStr)) return null;
  return advocateId;
}
