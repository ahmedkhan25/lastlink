# LastLink

> A verified digital death-notification and legacy-messaging platform. A **registrant** records messages (video, audio, letter) for the people they love. When they die, **two advocates independently confirm** the death; after a mandatory **24-hour cancellable safety hold**, LastLink delivers each message to its intended **recipients** — in the registrant's own words, never secondhand. An **enterprise HR console** brings the same verified notification to workplaces.

This repository is the **investor-demo MVP** — the full happy path across all surfaces on real infrastructure (Neon, Mux), seeded with the Daniel → Emily narrative. It is intentionally **demo-grade on security** (see [Security posture](#security-posture)); production hardening is deferred and explicitly scoped out.

Product & engineering source of truth: [`docs/LastLink-PRD.md`](docs/LastLink-PRD.md) and [`docs/LastLink-Architecture.md`](docs/LastLink-Architecture.md). Development conventions and the non-negotiable laws: [`.claude/skills/SKILL.md`](.claude/skills/SKILL.md).

---

## Architecture

Five front-end surfaces over one backend:

- **Hasura** serves permission-scoped CRUD (contacts, groups, draft messages, dashboard reads) with row-level security.
- **Express** owns every *consequential* operation — auth, the GraphQL proxy, verification/release, token issuance, video-upload init, and webhooks. **A death confirmation is never a GraphQL mutation.**
- One **Neon** Postgres with three schemas: `app` (operational), `audit` (event log), `enterprise` (B2B). pg-boss (planned) runs durable holds in the same DB.

```
                 Browser (SPAs)
                      │  credentials: include
                      ▼
        ┌──────────────────────────────┐
        │   Express API (apps/api)      │   ← Better Auth sessions, /graphql proxy,
        │   :10000                      │     sensitive endpoints, webhooks
        └───────┬───────────────┬───────┘
   admin-secret │               │ pg (node-postgres)
   + x-hasura-* │               ▼
        ▼               ┌──────────────┐
   ┌──────────┐         │ Neon Postgres│  app / audit / enterprise
   │ Hasura   │────────▶│  (managed)   │
   │ :8080    │  (Docker, points at Neon)
   └──────────┘         └──────────────┘
        external: Mux (video) · Resend (email, pending)
```

**The `/graphql` proxy is the only path from a browser to Hasura.** It authenticates the Better Auth session, derives trusted `x-hasura-role` / `x-hasura-user-id` headers, **strips any client-sent Hasura headers**, and forwards with the admin secret. Frontends never hold the admin secret and cannot set their own role. Secret columns (letter `body_ciphertext`, `token_hash`, Mux signing material) are excluded from every Hasura role.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 24 |
| Package manager / toolchain | **pnpm 10 via Vite+ (`vp`)** — Vite 8 (Rolldown), Oxlint, Oxfmt, Vitest |
| Frontend | React 19 + TypeScript + React Router + Tailwind v4 |
| Design system | `@lastlink/ui` — warm-bone tokens, DM Sans / Cormorant Garamond / JetBrains Mono |
| Backend | Express 5 + TypeScript |
| Database | PostgreSQL on **Neon** (single DB, schemas `app`/`audit`/`enterprise`) |
| GraphQL | Hasura v2 (row-level security), run locally in Docker against Neon |
| Auth | Better Auth (email/password; 2FA deferred) |
| Video | **Mux** — signed playback, generated captions, MP4 renditions |
| Email | Resend *(pending)* |
| Encryption | Local AES-256-GCM via `@lastlink/crypto` *(KMS deferred)* |

---

## Monorepo layout

```
lastlink/
├── apps/
│   ├── app/            # Registrant SPA (React 19 + React Router)   :5273
│   ├── api/            # Express 5 — auth, /graphql proxy, video, sensitive ops  :10000
│   ├── advocate/       # Advocate confirmation flow            (planned — M3)
│   ├── message/        # Recipient experience (Mux player)     (planned — M4)
│   ├── enterprise/     # HR console (React Admin + MUI)        (planned — M5)
│   ├── marketing/      # Public marketing site                 (planned — M5)
│   └── workers/        # pg-boss: holds, release, delivery      (planned — M3)
├── packages/
│   ├── shared/         # @lastlink/shared — state machine, durations, unions, plan limits
│   ├── crypto/         # @lastlink/crypto — local AES letter envelope (KMS later)
│   ├── ui/             # @lastlink/ui — tokens + Logo/Icon/ImgSlot atoms
│   ├── verification/   # @lastlink/verification — guards        (planned — M3)
│   └── notifications/  # @lastlink/notifications — Resend       (planned — M4)
├── hasura/             # docker-compose (engine → Neon)
├── db/                 # schema.sql (app/audit/enterprise)
├── scripts/            # hasura-setup.ts (track tables + RLS)
└── docs/               # PRD, Architecture, reviewer agents
```

---

## Prerequisites

- **Node.js 24** and **Vite+** (`vp` on your PATH; it wraps pnpm 10)
- **Docker** (for the local Hasura engine)
- **psql** (PostgreSQL client) for applying the schema
- A **Neon** project (provides `DATABASE_URL`)
- A **Mux** account (`MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`) for video

---

## Setup

```bash
# 1. Install dependencies (pnpm via Vite+)
vp install

# 2. Configure environment
cp .env.example .env
#   - DATABASE_URL / DATABASE_URL_DIRECT: from `neonctl connection-string` (pooled + direct)
#   - generate secrets: openssl rand -hex 24 (Hasura), -hex 32 (BetterAuth, LETTER_ENC_KEY)
#   - Mux token id/secret (can live in a separate mux env file the API also loads)

# 3. Apply the database schema to Neon
psql "$DATABASE_URL_DIRECT" -v ON_ERROR_STOP=1 -f db/schema.sql

# 4. Start Hasura (Docker, pointed at Neon) and track tables + RLS
docker compose --env-file .env -f hasura/docker-compose.yml up -d
set -a; . ./.env; set +a
vp exec tsx scripts/hasura-setup.ts          # tracks app tables, registrant RLS

# 5. (once) Create a Mux signing key for signed playback → appends to .env
set -a; . ./.env; . ./mux-Lastlink.env; set +a
vp exec tsx apps/api/create-signing-key.ts

# 6. Run the backend and the registrant app (two terminals)
vp exec tsx apps/api/src/index.ts            # API on :10000
cd apps/app && vp dev                        # SPA on :5273
```

Open **http://127.0.0.1:5273** → *Begin your LastLink* → onboarding → dashboard. Contacts, the letter composer, and video recording all read/write live against Neon.

### Ports

| Service | Port | Notes |
| --- | --- | --- |
| Registrant SPA (`apps/app`) | `5273` | `strictPort`; proxies `/api` + `/graphql` to the API (same-origin → first-party cookies) |
| Express API (`apps/api`) | `10000` | |
| Hasura | `8080` | Docker → Neon |

> Note: `5273` is dedicated to avoid colliding with other local dev servers. The SPA's Vite proxy keeps the browser same-origin, so auth cookies are first-party (no CORS, no `localhost`-vs-`127.0.0.1` cookie issues).

---

## Environment variables

See [`.env.example`](.env.example) for the full template. Summary:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` / `DATABASE_URL_DIRECT` | Neon pooled (runtime) / direct (migrations, Hasura) |
| `HASURA_GRAPHQL_ADMIN_SECRET` | Hasura admin secret (held only by the API) |
| `HASURA_GRAPHQL_ENDPOINT` | Hasura GraphQL URL the proxy targets |
| `BETTER_AUTH_SECRET` | Session signing |
| `API_BASE_URL` / `APP_BASE_URL` / `APP_ORIGINS` | URLs + allowed dev origins |
| `LETTER_ENC_KEY` | 32-byte hex key for AES letter encryption |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Mux API credentials |
| `MUX_SIGNING_KEY_ID` / `MUX_SIGNING_KEY_PRIVATE` | Signed playback (created by the script) |
| `MUX_WEBHOOK_SECRET` | Mux webhook signature (prod) |
| `RESEND_API_KEY` | Email (pending) |
| `HOLD_DURATION_MS` | Demo time-warp for the 24h hold |

---

## Key flows

- **Auth & RLS** — Better Auth creates a `user`; a DB hook creates an `app.registrants` row. The `/graphql` proxy maps the session → `registrant` role + registrant id; Hasura scopes every read/write by `X-Hasura-User-Id`.
- **Letters** — created as draft metadata via Hasura, then the plaintext is POSTed to `/api/messages/:id/letter`, which AES-encrypts it server-side. Ciphertext columns are never exposed through Hasura.
- **Video (Mux)** — `/api/messages/:id/upload-init` creates a signed direct upload; the browser records (`getUserMedia` + `MediaRecorder`, WebM/Chrome · MP4/Safari) or uploads, then UpChunk pushes the file resumably. Status is synced via `/api/messages/:id/media/refresh` (local) — a `/webhooks/mux` handler is added for production. Owner preview uses short-lived signed playback tokens (recipient tokens are minted only post-release).
- **Verification** *(M3, planned)* — dual-advocate confirm → durable 24h hold (pg-boss, never `setTimeout`) → release worker re-checks state in-transaction (cancel-during-hold provably no-ops) → delivery.

---

## Development commands

```bash
vp install        # install deps
vp dev            # dev server (run inside an app dir)
vp build          # production build
vp check          # lint + format + type-check (Oxlint + Oxfmt)
vp test           # Vitest
vp exec tsc --noEmit -p apps/<app>/tsconfig.json   # type-check a project
```

Use **`vp`** (it wraps pnpm 10); use `pnpm -F <pkg>` only where `vp` has no equivalent. Never `npm`/`npx`/`yarn`.

---

## Security posture

This is a **demo build**. The following production-grade controls are **deferred** (see SKILL.md):

- **AWS KMS / IAM key custody** → replaced by a local AES key behind `@lastlink/crypto` (same interface; swaps to KMS with no call-site changes).
- **Hash-chained, append-only audit log** → replaced by a plain `audit.event_log` table (still powers the advocate/enterprise/recipient timelines).
- **Mandatory 2FA, strict CSP, exhaustive RLS hardening.**

Kept because they *are* the product: the Express-for-consequence boundary, the GraphQL proxy role injection, scoped/expiring access tokens, signed Mux playback, idempotent mutations, and (M3) the durable hold + provable cancel-during-hold safety.

---

## Status

| Milestone | State |
| --- | --- |
| M0 — Foundations (monorepo, Neon schema, Better Auth, `/graphql` proxy + RLS) | ✅ |
| M1 — Registrant core (onboarding, contacts, letter compose, dashboard) | ✅ core |
| M2 — Video pipeline (Mux: record/upload → signed playback) | ✅ |
| M3 — Verification engine (advocate flow, 24h hold, cancel-safety) | ⏳ |
| M4 — Recipient experience + email delivery (Resend) | ⏳ |
| M5 — Enterprise console + marketing + demo seed + Render deploy | ⏳ |
