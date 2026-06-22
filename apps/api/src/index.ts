import express from "express";
import { env } from "./env.js";
import { query } from "./db.js";
import { logEvent } from "./audit.js";

const app = express();
app.use(express.json());

// Liveness + DB connectivity check.
app.get("/health", async (_req, res) => {
  try {
    const { rows } = await query<{ now: string }>("select now() as now");
    res.json({ ok: true, db: "up", now: rows[0]?.now });
  } catch (err) {
    res.status(503).json({ ok: false, db: "down", error: String(err) });
  }
});

// Smoke endpoint: write + read back an event-log row (proves the audit spine).
app.post("/internal/audit-smoke", async (req, res) => {
  await logEvent({
    actorType: "system",
    action: "smoke.ping",
    entityType: "demo",
    entityId: "m0",
    data: { note: req.body?.note ?? "hello from M0" },
  });
  const { rows } = await query(
    "select id, action, data, occurred_at from audit.event_log order by id desc limit 3",
  );
  res.json({ ok: true, recent: rows });
});

app.listen(env.PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`[lastlink-api] listening on :${env.PORT} (${env.NODE_ENV})`);
});
