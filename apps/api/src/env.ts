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
  MUX_TOKEN_ID: process.env.MUX_TOKEN_ID,
  MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
} as const;
