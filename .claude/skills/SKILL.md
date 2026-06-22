---
name: lastlink-dev
description: LastLink development conventions. Use when writing code, running commands, or making changes in the lastlink monorepo. Encodes the stack, the high-stakes verification/crypto laws, and the conventions that prevent catastrophic mistakes (false release, key leakage, audit tampering).
---

## LastLink Development Rules

You are working in the `lastlink` monorepo — a verified death-notification and legacy-messaging platform. The product delivers a person's final messages to their loved ones after **two advocates** independently confirm their death. **A false or premature release is irreversible and catastrophic.** Several rules below exist solely to prevent that. Treat them as non-negotiable.

Source of truth: `documents/LastLink-Architecture.md` (how it's built) and `documents/LastLink-PRD.md` (what + acceptance). Read the relevant section before changing a subsystem.

### Commands — use vp (Vite+) over pnpm; pnpm is the package manager vp wraps

**pnpm 10 (via Vite+) is the package manager** for this monorepo. Prefer the `vp` wrapper; drop to `pnpm` directly only where `vp` has no equivalent (e.g. workspace filters). **Never** use `npm`/`npx`/`yarn`.

- `vp install` — install dependencies (wraps `pnpm install`)
- `vp dev` — start dev server
- `vp build` — production build
- `vp test` — run Vitest
- `vp check` — lint + format + type-check in one pass (Oxlint + Oxfmt)
- `vp run <script>` — run a package.json script
- `vp add <pkg>` — add dependency
- `vp create` — scaffold new app/package
- `pnpm -F <app> <cmd>` — workspace-filtered command (no `vp` equivalent)

Routing in the SPAs uses **React Router** (`react-router-dom`).

> **Demo-increment note:** for the current investor-demo build, Laws #7 (KMS worker-only IAM), #8 (hash-chained append-only audit), and mandatory 2FA are **deferred** to a later hardening phase. Crypto uses a local AES key behind `@lastlink/crypto`; the audit log is a plain `event_log` table. All other laws below remain in force. Remove this note when hardening resumes.

### Pre-push checklist (ALWAYS run before committing)

1. `vp check` — lint + format
2. `vp test` — run all Vitest tests
3. `npx tsc --noEmit -p apps/api/tsconfig.json` — API type-check (standard tsconfig)
4. `npx tsc --noEmit -p apps/workers/tsconfig.json` — workers type-check
5. `npx tsc -b apps/app/tsconfig.json` — registrant SPA (project references → MUST use `-b`)
6. `npx tsc -b apps/advocate/tsconfig.json apps/message/tsconfig.json apps/marketing/tsconfig.json` — other SPAs
7. `npx tsc -b apps/enterprise/tsconfig.json` — enterprise console

CRITICAL: SPAs and the enterprise console use project references (`tsconfig.json` has `"files": []`). `tsc --noEmit` silently checks ZERO files for these — it passes even with type errors. Use `tsc -b` (build mode), which traverses references. The API and workers use standard tsconfigs, so `--noEmit` works there. Render deploys fail if `tsc` fails.

---

## The Non-Negotiable Laws (LastLink-specific — read every time)

These are the rules where a violation is not a bug, it's a disaster. Never relax them for convenience or speed.

1. **A death confirmation or release is NEVER a GraphQL mutation.** Anything that advances the verification case, authorizes a release, mints a token, decrypts a message, or charges a card is an explicit Express endpoint in `apps/api` with its own guards, idempotency, and audit write. Hasura is for permission-scoped CRUD only.

2. **Never expose secret material through Hasura to ANY role.** `body_ciphertext`, `body_iv`, `wrapped_dek`, `dek_key_id`, `gov_id_ref`, `recipient_tokens.token_hash`, and any Mux signing material are excluded from every role's SELECT permissions. Recipients see message *metadata* only (title, type, duration). Decryption and playback-token minting happen only in Express, only post-release.

3. **Never use in-memory timers (`setTimeout`/`setInterval`) for holds or scheduled releases.** They die on every deploy/restart/crash — for a 24-hour hold that is guaranteed data loss with catastrophic consequences. Use **pg-boss** (in the same Postgres) with `singletonKey: case_id`, and persist the job id on the case.

4. **The release worker MUST re-check state inside the transaction before releasing.** `SELECT ... FOR UPDATE` the case, then proceed only if state is still `safety_hold` AND `now() >= hold_expires_at`. If a cancel landed a millisecond earlier, the release is a no-op (audited). Job cancellation is best-effort; this guard is the real safety net.

5. **All mutating Express endpoints require an `Idempotency-Key` header and write to the audit log.** No exceptions. Duplicate posthumous notifications and double-releases are unacceptable.

6. **Webhook routes use the RAW request body and verify signatures before any processing.** Mount `express.raw()` on `/webhooks/*` *before* the JSON body parser. Verify Mux (HMAC), Resend (Svix), Stripe, and Twilio signatures. Return 200 fast, process async, dedupe (all are at-least-once).

7. **`kms:Decrypt` on the message KEK is worker-only IAM. The API role must NOT have it.** Before `release_authorized`, even a full DB + API compromise must yield only ciphertext + wrapped DEKs.

8. **The audit log is append-only and hash-chained. Never UPDATE or DELETE it.** Triggers + role grants enforce this at the DB. The app role cannot touch `audit.audit_events`; only the audit-writer role inserts. Canonicalization of the event payload must be deterministic or the chain breaks.

9. **Advocate and recipient access is short-lived scoped JWTs, not full sessions.** Store the token *hash*, never the raw token. Enforce expiry. On revisit, re-verify identity before re-minting ("the link expires; the message stays").

10. **Mux playback tokens are minted ONLY post-release**, only for a recipient holding a valid scoped token. Assets always use the `signed` playback policy. Signing keys live in env/KMS, never in client code or Hasura.

11. **Honesty in security/compliance copy.** Do not write or surface "SOC 2 Type II compliant," "HIPAA compliant," or "keys you alone hold" as present-tense fact — these are roadmap/aspirational (see PRD §9). Build the substance; label the claims correctly.

When a change touches subsystems behind laws 1–10, the **verification-reviewer** and **security-reviewer** agents must review it before merge.

---

### Do NOT create these files (Vite+ owns them)

- `.eslintrc` / `eslint.config.js`
- `.prettierrc`
- `vitest.config.ts`
- `lint-staged.config.js`

### Coding conventions

- ESM only (`import`/`export`, never `require`/`module.exports`)
- Functional components, no classes, files < 100 lines (extract helpers if longer)
- Consumer/advocate/message/marketing surfaces: **Shadcn/Tailwind — never MUI**
- Enterprise console (`apps/enterprise`): **MUI 7 / React Admin 5 — never Shadcn**
- Dash-case directories, camelCase variables, named exports (not default)
- Tests in `__tests__/` (mirror of `src/`), not co-located
- No custom CSS files — Tailwind utilities (SPAs) or MUI `sx`/`styled` (enterprise)
- Shared cross-cutting logic lives in packages, not app code: state machine → `@lastlink/verification`, crypto → `@lastlink/crypto`, sends → `@lastlink/notifications`, types/zod → `@lastlink/shared`

### TypeScript rules

- Use `interface` for props and data shapes
- **Avoid `enum` — use union types or object maps.** And in the DB, **never use Postgres enums** in the `app`/`audit`/`enterprise` schemas. Use `text` columns with `CHECK` constraints instead, because these are non-default schemas and Hasura v2 enum tracking is broken for them. (This corrects the `CREATE TYPE ... AS ENUM` shown in early DDL drafts — replace with `text` + `CHECK` + a TS union in `@lastlink/shared`.)
- Always type function parameters and return values
- RORO pattern (Receive an Object, Return an Object) for non-trivial functions
- No magic numbers/strings — extract to named constants (state names, plan limits, hold/SLA durations all live in `@lastlink/shared`)
- Place static constants and helpers OUTSIDE the component body

### GraphQL rules (CRITICAL)

- Implementation order: DB schema → verify in `psql` → test in Hasura via curl → write `gql\`\`` → wire frontend
- Frontend NEVER talks to Hasura directly — all GraphQL goes through the Express `/graphql` proxy, which injects `X-Hasura-Role` / `X-Hasura-User-Id` (and `-Contact-Id` / `-Delivery-Id` for recipients) from the authenticated session/token and **strips any client-sent Hasura headers**
- Backend services use `executeGraphQL()` with the admin secret (trusted, server-side only)
- Queries centralized in `lib/graphql/` (not co-located with components)
- Test every query/mutation against live Hasura before wiring into components — TypeScript cannot catch GraphQL type mismatches
- Re-read Law #2: secret columns are excluded from every role

### React rules

- Use the `function` keyword for component declarations (not arrow for top-level)
- Prefer explicit prop typing over `React.FC<Props>`
- Early returns and guard clauses for conditional logic
- Validate forms with Zod + react-hook-form
- Mux playback uses `@mux/mux-player-react` with **server-issued tokens only** — never embed signing keys; recording uses `MediaRecorder` → `@mux/mux-uploader-react` (resumable direct upload)

### useEffect guidelines

- DON'T use Effects to transform data for rendering — calculate during render
- DON'T use Effects to handle user events — use event handlers
- DON'T chain Effects that only trigger other state updates
- DO use Effects only for syncing with external systems (APIs, subscriptions, browser APIs)
- DO prefer `useMemo` for expensive calculations over Effect + state
- DO use cleanup functions to prevent race conditions in data fetching

### Role names (canonical — use everywhere)

`registrant`, `advocate`, `recipient`, `org_admin`, `org_case_handler`, `platform_admin`, `anonymous`. Registrants and org admins get Better Auth sessions; advocates and recipients get tokenized scoped JWTs.

### Architecture

- Frontend → Express `/graphql` proxy → Hasura. Never frontend → Hasura.
- Sensitive/consequential operations → dedicated Express endpoints (verification, release, tokens, video init, webhooks, payments).
- File uploads (gov-ID) use signed URLs — never upload through the backend server.
- Video: server-side Mux Direct Upload (`cors_origin` exact, `playback_policies: ['signed']`, `static_renditions`, `generated_subtitles`, `passthrough: messageId`); rely on webhooks (subscribe to the **singular** `video.asset.static_rendition.ready`), never poll the assets endpoint.
- Email via Resend on `notify.` subdomain; SMS via Twilio; both behind the `NotificationService` abstraction with idempotency keys.
- Use `getApiUrl()` for ALL frontend API calls (exception: Better Auth client uses relative URLs).
- Optimize images to WebP and lazy-load.

### Routing & deployment

- When adding a route, ALWAYS update `render.yaml` rewrite rules for ALL environments — missing rewrites = 404 on refresh in production.
- **Custom domains are mandatory in staging/prod.** `*.onrender.com` is on the Public Suffix List and silently breaks Better Auth cross-subdomain cookies. Never rely on the default Render domain for an authenticated surface.
- Pin `HASURA_GRAPHQL_MIGRATIONS_SERVER_PORT` and always set `HASURA_GRAPHQL_ADMIN_SECRET`.
- Hasura console + introspection disabled in production.

### Validation

- Zod schemas on both client and backend (share them via `@lastlink/shared`)
- Handle edge cases early with guard clauses (`if (error) return ...`)
- Never nest validation logic — fail fast

### Surfaces map

| App | Stack | Domain | Notes |
|---|---|---|---|
| `apps/marketing` | React SSG + Shadcn | lastlink.com | Only indexed surface |
| `apps/app` | React 19 + Shadcn | app.lastlink.com | Registrant (`#onboarding/#dashboard/#compose/#contacts/#advocates`) |
| `apps/advocate` | React 19 + Shadcn | advocate.lastlink.com | Token-gated, `noindex` |
| `apps/message` | React 19 + Shadcn | msg.lastlink.com | Token-gated, `noindex`, Mux player |
| `apps/enterprise` | React Admin 5 + MUI 7 | hr.lastlink.com | SSO, `noindex` |
| `apps/api` | Express 5 | api.lastlink.com | Sensitive ops, webhooks, tokens |
| `apps/workers` | pg-boss | (no public port) | Durable holds, release, delivery fan-out |
