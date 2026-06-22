import express from "express";
import { toNodeHandler } from "better-auth/node";
import { env } from "./env.js";
import { query } from "./db.js";
import { logEvent } from "./audit.js";
import { auth } from "./auth.js";
import { graphqlProxy } from "./graphql-proxy.js";
import { saveLetter } from "./messages.js";

const app = express();

// CORS for the registrant SPA (credentials = session cookie). Reflect the
// request origin if it's an allowed dev origin (localhost OR 127.0.0.1).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && env.APP_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Credentials", "true");
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

app.use(express.json());

// The single browser→Hasura path.
app.post("/graphql", graphqlProxy);

// Sensitive consequence endpoints (Express, never Hasura).
app.post("/api/messages/:id/letter", saveLetter);

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

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`[lastlink-api] listening on :${env.PORT} (${env.NODE_ENV})`);
});
