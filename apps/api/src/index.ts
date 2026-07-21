import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { toNodeHandler } from "better-auth/node";
import { env } from "./env.js";
import { query } from "./db.js";
import { logEvent } from "./audit.js";
import { auth } from "./auth.js";
import { graphqlProxy } from "./graphql-proxy.js";
import { saveLetter } from "./messages.js";
import { sealAccount, demoReset } from "./account.js";
import { uploadInit, mediaRefresh, playbackToken, muxWebhook } from "./video.js";
import { inviteAdvocate, getInvite, acceptInvite, requestAdvocateLink } from "./advocates.js";
import { getCase, initiateCase, confirmCase, cancelCase, releaseNow } from "./case.js";
import { getRecipient, openRecipient } from "./recipient.js";

const app = express();

// CORS for the registrant SPA (credentials = session cookie). Reflect the
// request origin if it's an allowed dev origin (localhost OR 127.0.0.1).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    // Reflect the origin so the token-based surfaces (advocate/message/enterprise,
    // which never send cookies) work cross-origin. Only grant credentials —
    // required for the registrant session cookie — to trusted origins.
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    if (env.APP_ORIGINS.includes(origin)) res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Headers", "content-type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Better Auth owns /api/auth/* and reads the raw body — mount BEFORE express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

// Mux webhook needs the RAW body for signature verification — before express.json().
app.post("/webhooks/mux", express.raw({ type: "*/*" }), muxWebhook);

app.use(express.json());

// The single browser→Hasura path.
app.post("/graphql", graphqlProxy);

// Sensitive consequence endpoints (Express, never Hasura).
app.post("/api/messages/:id/letter", saveLetter);
app.post("/api/account/seal", sealAccount);
app.post("/api/demo/reset", demoReset); // DEMO ONLY (DEMO_RESET=true) — resurrect the registrant to re-run the flow
// Video (Mux). Local dev polls /media/refresh; prod adds the /webhooks/mux handler.
app.post("/api/messages/:id/upload-init", uploadInit);
app.post("/api/messages/:id/media/refresh", mediaRefresh);
app.post("/api/messages/:id/playback-token", playbackToken);

// Advocate invite (registrant) + accept (token-based, no session).
app.post("/api/advocates/:id/invite", inviteAdvocate);
app.get("/advocate/invite/:token", getInvite);
app.post("/advocate/invite/:token/accept", acceptInvite);
app.post("/advocate/request-link", requestAdvocateLink); // re-entry: email me my link

// Death-confirmation lifecycle (advocate token). Release runs inline (no worker).
app.get("/advocate/:token/case", getCase);
app.post("/advocate/:token/initiate", initiateCase);
app.post("/advocate/:token/confirm", confirmCase);
app.post("/advocate/:token/cancel", cancelCase);
app.post("/advocate/:token/release", releaseNow);

// Recipient (the message experience), token-based.
app.get("/recipient/:token", getRecipient);
app.post("/recipient/:token/open", openRecipient);

app.get("/health", async (_req, res) => {
  try {
    const { rows } = await query<{ now: string }>("select now() as now");
    res.json({ ok: true, db: "up", now: rows[0]?.now });
  } catch (err) {
    res.status(503).json({ ok: false, db: "down", error: String(err) });
  }
});

app.post("/internal/audit-smoke", async (req, res) => {
  await logEvent({ actorType: "system", action: "smoke.ping", entityType: "demo", entityId: "m0", data: { note: req.body?.note } });
  const { rows } = await query("select id, action, data, occurred_at from audit.event_log order by id desc limit 3");
  res.json({ ok: true, recent: rows });
});

// Production single-origin: serve the built registrant SPA so app + API + /graphql
// share one domain (first-party cookies; avoids the *.onrender.com PSL cookie issue).
const spaDir = resolve(import.meta.dirname, "../../app/dist");
if (existsSync(spaDir)) {
  app.use(express.static(spaDir));
  app.get("/*splat", (_req, res) => res.sendFile(resolve(spaDir, "index.html")));
  console.log(`[lastlink-api] serving SPA from ${spaDir}`);
}

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`[lastlink-api] listening on :${env.PORT} (${env.NODE_ENV})`);
});
