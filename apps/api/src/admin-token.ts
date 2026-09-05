import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const AUDIENCE = "lastlink-account-administrator";
export const ADMIN_TTL_MS = 60 * 60 * 1000;
interface AdminClaims {
  jti: string;
  sub: string;
  caseId: string;
  exp: number;
  aud: string;
  iss: string;
}
export function hashAdminToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
export function signAdminToken(
  input: { id: string; advocateId: string; caseId: string; expiresAt: Date },
  secret: string,
): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const claims: AdminClaims = {
    jti: input.id,
    sub: input.advocateId,
    caseId: input.caseId,
    exp: Math.floor(input.expiresAt.getTime() / 1000),
    aud: AUDIENCE,
    iss: "lastlink",
  };
  const payload = `${header}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function verifyAdminToken(
  token: string,
  secret: string,
  now = Date.now(),
): AdminClaims | null {
  try {
    if (token.length > 2048) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts as [string, string, string];
    const meta = JSON.parse(Buffer.from(header, "base64url").toString());
    if (meta.alg !== "HS256" || meta.typ !== "JWT") return null;
    const expected = createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");
    if (
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return null;
    const c = JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminClaims;
    if (
      c.aud !== AUDIENCE ||
      c.iss !== "lastlink" ||
      !Number.isFinite(c.exp) ||
      c.exp * 1000 <= now
    )
      return null;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return [c.jti, c.sub, c.caseId].every((v) => typeof v === "string" && uuid.test(v)) ? c : null;
  } catch {
    return null;
  }
}
