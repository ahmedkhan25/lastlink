import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth, registrantIdForUser } from "./auth.js";
import { env } from "./env.js";

// The ONLY path from a browser to Hasura. The proxy authenticates the Better
// Auth session, derives trusted x-hasura-* headers, strips any client-sent
// Hasura headers, and forwards using the admin secret. Frontends never hold
// the admin secret and can never set their own role.
export async function graphqlProxy(req: Request, res: Response): Promise<void> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  let role = "anonymous";
  const hasuraHeaders: Record<string, string> = {};
  if (session?.user) {
    const registrantId = await registrantIdForUser(session.user.id);
    if (registrantId) {
      role = "registrant";
      hasuraHeaders["x-hasura-user-id"] = registrantId;
    }
  }
  hasuraHeaders["x-hasura-role"] = role;

  const upstream = await fetch(env.HASURA_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret": env.HASURA_GRAPHQL_ADMIN_SECRET,
      ...hasuraHeaders,
    },
    body: JSON.stringify(req.body),
  });

  const payload = await upstream.text();
  res.status(upstream.status).type("application/json").send(payload);
}
