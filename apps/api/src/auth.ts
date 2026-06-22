import { betterAuth } from "better-auth";
import { pool, query } from "./db.js";
import { env } from "./env.js";
import { logEvent } from "./audit.js";

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
          await query(
            `insert into app.registrants (user_id, legal_name, account_state)
             values ($1, $2, 'onboarding')
             on conflict (user_id) do nothing`,
            [user.id, user.name || user.email],
          );
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
