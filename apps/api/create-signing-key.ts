// One-time: create a Mux RSA signing key for signed playback and append it to
// the repo-root .env. Run: source .env + mux env, then tsx this file.
import Mux from "@mux/mux-node";
import { readFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(import.meta.dirname, "../../.env");
const current = readFileSync(envPath, "utf8");
if (current.includes("MUX_SIGNING_KEY_ID")) {
  console.log("signing key already present in .env — skipping");
  process.exit(0);
}

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});
const key = await mux.system.signingKeys.create();
const privateKey = (key as { privateKey?: string; private_key?: string }).privateKey
  ?? (key as { private_key?: string }).private_key;
appendFileSync(envPath, `\nMUX_SIGNING_KEY_ID="${key.id}"\nMUX_SIGNING_KEY_PRIVATE="${privateKey}"\n`);
console.log("created Mux signing key:", key.id);
