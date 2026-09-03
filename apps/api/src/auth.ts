import { betterAuth } from "better-auth";
import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "node:http";
import { pool, query } from "./db.js";
import { env } from "./env.js";
import { logEvent } from "./audit.js";
import { ensureMemorial } from "./memorial-slug.js";

export const auth = betterAuth({
  database: pool,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.API_BASE_URL,
  basePath: "/api/auth",
  trustedOrigins: env.APP_ORIGINS,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // demo: skip the email round-trip
  },
  databaseHooks: {
    user: {
      create: {
        // Every new auth user gets a registrant profile in onboarding state.
        after: async (user) => {
          const created = await query<{ id: string; legal_name: string }>(
            `insert into app.registrants (user_id, legal_name, account_state)
             values ($1, $2, 'onboarding')
             on conflict (user_id) do nothing
             returning id, legal_name`,
            [user.id, user.name || user.email],
          );
          const registrant = created.rows[0] ?? (
            await query<{ id: string; legal_name: string }>(
              "select id, legal_name from app.registrants where user_id = $1",
              [user.id],
            )
          ).rows[0];
          if (registrant) {
            await ensureMemorial({ registrantId: registrant.id, legalName: registrant.legal_name });
          }
          await logEvent({
            actorType: "registrant",
            actorId: user.id,
            action: "registrant.created",
            entityType: "user",
            entityId: user.id,
          });
        },
      },
    },
  },
});

/** Resolve the app.registrants.id for a Better Auth user id (null if none). */
export async function registrantIdForUser(userId: string): Promise<string | null> {
  const { rows } = await query<{ id: string }>(
    "select id from app.registrants where user_id = $1",
    [userId],
  );
  return rows[0]?.id ?? null;
}

/** Guard for sensitive Express routes: returns the registrant identity or null. */
export async function requireRegistrant(
  headers: IncomingHttpHeaders,
): Promise<{ userId: string; registrantId: string; email: string } | null> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(headers) });
  if (!session?.user) return null;
  const registrantId = await registrantIdForUser(session.user.id);
  if (!registrantId) return null;
  return { userId: session.user.id, registrantId, email: session.user.email };
}
