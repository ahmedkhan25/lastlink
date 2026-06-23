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
  // Auth + proxy. On Render, RENDER_EXTERNAL_URL is the public origin (single-origin
  // deploy: API serves the SPA, so app + API share this URL).
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "dev-insecure-secret-change-me",
  API_BASE_URL: process.env.API_BASE_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:10000",
  APP_BASE_URL: process.env.APP_BASE_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:5273",
  // Allowed origins for CORS + Better Auth trusted origins.
  APP_ORIGINS: (
    process.env.APP_ORIGINS ??
    process.env.RENDER_EXTERNAL_URL ??
    "http://localhost:5273,http://127.0.0.1:5273"
  ).split(","),
  HASURA_GRAPHQL_ENDPOINT: process.env.HASURA_GRAPHQL_ENDPOINT ?? "http://localhost:8080/v1/graphql",
  HASURA_GRAPHQL_ADMIN_SECRET: process.env.HASURA_GRAPHQL_ADMIN_SECRET ?? "",
  // Letter encryption (local AES; 64 hex chars). Demo default — override in real envs.
  LETTER_ENC_KEY: process.env.LETTER_ENC_KEY ?? "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
  // Providers
  MUX_TOKEN_ID: process.env.MUX_TOKEN_ID ?? "",
  MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET ?? "",
  MUX_WEBHOOK_SECRET: process.env.MUX_WEBHOOK_SECRET ?? "",
  MUX_SIGNING_KEY_ID: process.env.MUX_SIGNING_KEY_ID ?? "",
  MUX_SIGNING_KEY_PRIVATE: process.env.MUX_SIGNING_KEY_PRIVATE ?? "",
  RESEND_API_KEY: process.env.RESEND_API_KEY,
} as const;
