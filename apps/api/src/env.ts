import { config } from "dotenv";
import { resolve } from "node:path";

// Load the repo-root .env (gitignored) plus the Mux env file.
const root = resolve(import.meta.dirname, "../../..");
config({ path: resolve(root, ".env") });
config({ path: resolve(root, "mux-Lastlink.env") });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 10000),
  DATABASE_URL: required("DATABASE_URL"),
  HOLD_DURATION_MS: process.env.HOLD_DURATION_MS, // demo time-warp (optional)
  // Auth + proxy
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "dev-insecure-secret-change-me",
  API_BASE_URL: process.env.API_BASE_URL ?? "http://localhost:10000",
  APP_BASE_URL: process.env.APP_BASE_URL ?? "http://localhost:5273",
  HASURA_GRAPHQL_ENDPOINT: process.env.HASURA_GRAPHQL_ENDPOINT ?? "http://localhost:8080/v1/graphql",
  HASURA_GRAPHQL_ADMIN_SECRET: process.env.HASURA_GRAPHQL_ADMIN_SECRET ?? "",
  // Providers
  MUX_TOKEN_ID: process.env.MUX_TOKEN_ID,
  MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
} as const;
