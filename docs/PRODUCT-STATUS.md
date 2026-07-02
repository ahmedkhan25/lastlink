# LastLink — Product Status (Investor-Demo MVP)

_Last updated: 2026-07-02 · Owner: Ahmed_

LastLink is a **verified digital death-notification and legacy-messaging platform**.
A person records messages for the people they love; when they die, **two trusted
advocates independently confirm it**; after a mandatory **24-hour cancellable
safety hold**, the messages are delivered to each recipient — in the sender's own
words, never secondhand.

This document is the source of truth for **what is live and working today**. It
covers every URL, its purpose, and the end-to-end flows that function on the
deployed system. It also states plainly what is intentionally deferred, so we
don't oversell in front of investors.

> **Status legend:** ✅ working end-to-end · 🟡 works with a caveat · ⛔ not built yet

---

## 1. Live URLs

All five services are deployed on **Render** (SHC workspace, `lastlink` project
only) and share one **Neon Postgres** database + one **Hasura** GraphQL engine.

| Surface | URL | Purpose | Status |
|---|---|---|---|
| **Marketing** | https://lastlink-marketing.onrender.com | Public homepage. The story, the problem, how it works, the verification model, pricing (visual), CTA into the app. | ✅ |
| **Registrant app** | https://lastlink-web.onrender.com | The core product. Sign up, onboard, write/record messages, add contacts, designate advocates, dashboard. Also hosts the **API** and the browser→Hasura proxy. | ✅ |
| **Advocate** | https://lastlink-advocate.onrender.com | Token-gated. An advocate accepts their role, and later initiates + confirms a passing and watches the 24h hold. Reached via email link. | ✅ |
| **Recipient message** | https://lastlink-message.onrender.com | Token-gated. Where a recipient opens the private message left for them (video or letter) + the audit footer. Reached via email link. | ✅ |
| Hasura (internal) | https://lastlink-hasura.onrender.com | GraphQL engine over Neon. Admin-secret gated; console + introspection off. **Not user-facing** — infra only. | ✅ |

**Notes**
- First request to any surface may **cold-start (~15–20s)** on Render's plan — open each once before a live demo.
- Advocate and recipient are **token-based** (no login, no cookies): every entry point is a signed, expiring link delivered by email.
- The registrant app + API + Hasura proxy are served from **one origin** (`lastlink-web`) so the session cookie is first-party.

---

## 2. How it fits together (architecture in one minute)

**Five front-ends, one backend.** The dividing line is deliberate and is the
heart of the product's integrity:

- **Hasura** handles ordinary, permission-scoped CRUD (contacts, message
  metadata, advocates) with row-level security — a registrant only ever sees
  their own rows. The browser reaches it **only** through an Express `/graphql`
  proxy that authenticates the session and injects the Hasura role.
- **Express (the API)** handles every **consequence**: identity, token minting,
  the death-confirmation state machine, the release, letter decryption, video
  signing, email. **A death confirmation is never a GraphQL mutation.**

```
Marketing ──▶ Registrant app ──▶ (Hasura via /graphql proxy)  ← CRUD
                    │
                    └────────────▶ Express API                ← consequence
                                     ├─ advocate tokens ─▶ Advocate surface
                                     └─ recipient tokens ─▶ Message surface
```

**Stack:** React 19 + Vite + React Router · Express 5 · Hasura v2 · Neon Postgres
· Better Auth (email/password) · Mux (video) · Resend (email) · pnpm monorepo.

---

## 3. Working flows (end-to-end)

### 3.1 Registrant — onboard & prepare ✅
`lastlink-web.onrender.com`
1. **Sign up** (email + password) → a registrant record is created.
2. **Onboarding** (6 steps): welcome → identity (demo-approved) → **contacts**
   (add people with name/email/group: Family / Close friends / Business) →
   **message** → **advocates** → sealed.
3. **Message step** — two working composers:
   - **Letter:** typed, **encrypted at rest** on save (AES-256-GCM), stored as
     ciphertext; only metadata is ever visible through Hasura. Instantly `ready`.
   - **Video:** record in-browser or upload a file → pushed to **Mux** (signed
     playback policy, auto-captions) → processes to `ready`. _(Recently hardened:
     you can no longer finish onboarding with an unsaved recording.)_
4. **Advocates step** — designate two people; each is emailed a real invite.
5. Finishing seals the account → **active & sealed**. No recurring check-ins.
6. **Dashboard** shows real status (identity, advocates accepted, messages),
   the message list, and per-message detail (letter preview / signed video).

### 3.2 Advocate — invite & accept ✅
`lastlink-advocate.onrender.com`
1. On designation, the API mints a **signed invite token** and Resend emails the
   advocate an accept link (`/accept/:token`).
2. The advocate opens it, sees who entrusted them, and **accepts** → status flips
   to `accepted` (visible on the registrant's dashboard).
3. The accepted page also exposes a discreet **"Begin the confirmation"** entry
   (same token) so the confirmation flow is reachable when the day comes.

### 3.3 Death confirmation & release — the core IP ✅
`lastlink-advocate.onrender.com/confirm/:token` → API state machine
1. **Initiate** — an advocate reports the passing (with a date). This emails
   **both** advocates a confirmation link. Case state: `initiated`.
2. **Confirm (independent)** — each advocate confirms separately. First confirm →
   `awaiting_second`; second confirm → **`safety_hold`** with a live countdown.
   Either advocate can instead **dispute**, which halts everything.
3. **24-hour safety hold** — a durable, cancellable window. Either advocate can
   **"Stop the release"** at any moment. (A demo **"Advance hold & release now"**
   control time-warps the hold so it's watchable in a demo.)
4. **Release** — runs **inline in a transaction** that re-checks state with
   `SELECT … FOR UPDATE`. It decrypts letters / mints signed Mux playback tokens,
   creates one delivery per recipient (idempotent), mints **recipient tokens**
   (only the hash is stored), and Resend-emails each recipient a private link.
5. Every consequential step writes to an **audit event log**.

**The safety guarantee (verified):** if a cancel lands during the hold, the
release becomes a **no-op** and **zero messages are delivered**. This is enforced
both by a pure state-machine (7 unit tests, incl. the cancel-during-hold race)
and by the in-transaction re-check. It was validated against the live API with a
14-check end-to-end script (happy path, cancel-safety, dispute).

### 3.4 Recipient — receive the message ✅
`lastlink-message.onrender.com/m/:token`
1. The recipient opens their private link → an **arrival card**: _"[Name] left
   something for you"_ → "Open when you're ready."
2. On open: a **letter renders decrypted**, or a **Mux video plays** with signed,
   short-lived tokens (private even though it's a shareable link).
3. Below: an **aftercare** note and an **audit footer** naming both advocates and
   confirming the 24-hour hold — the trust payoff.

### 3.5 Marketing ✅
`lastlink-marketing.onrender.com`
Long-scroll homepage: hero → the problem → 5-step "how it works" → the
verification model → trust & security → who it's for → pricing (visual only) →
CTA into the app. Copy has had an **honesty pass** (24h hold, "patent-pending"
not a fabricated patent number, "SOC 2 audit underway" rather than certified,
"encryption at rest" not false end-to-end claims).

---

## 4. Intentionally deferred (so we don't oversell)

These are **out of the current demo scope** by design — the demo proves the spine,
not the full hardened product.

| Area | Today | Later |
|---|---|---|
| **Enterprise / HR console** | ⛔ not built | `apps/enterprise` — org case management, metrics |
| **Payments** | ⛔ none (pricing is visual) | Stripe |
| **SMS** | ⛔ none (email only) | Twilio |
| **Audio messages** | 🟡 stubbed ("post-MVP") | recording pipeline |
| **Key custody** | 🟡 local AES key | AWS KMS behind the same interface |
| **Audit log** | 🟡 plain event log | hash-chained / tamper-evident |
| **Auth hardening** | 🟡 email+password | mandatory 2FA, strict CSP |
| **Delivery worker** | 🟡 on-demand/time-warp release | pg-boss durable holds + fan-out |
| **ID verification** | 🟡 demo-approved | real vendor (liveness/gov-ID) |

The **durable, cancellable hold + provable cancel-during-hold** is *kept* — it is
the product itself.

---

## 5. Known constraints for demos

- **Email (Resend):** running on a **dev key with no verified domain**, so email
  only delivers to the Resend account's own address + `delivered@resend.dev`.
  Demo trick: use that one inbox for both advocates *and* the recipient contact so
  every email lands somewhere you can screen-record. A verified sending domain
  (`notify.lastlink.com`) removes the limit — no code change.
- **Cold starts:** warm each URL once before recording.
- **Video path:** needs a camera + ~30–90s of Mux processing. The **letter path**
  is the most reliable for a clean demo take.

---

## 6. Repo & deploy

- **Monorepo:** `apps/{marketing,app,advocate,message,api}` + `packages/{ui,
  shared,crypto,notifications,verification}`. pnpm workspaces via Vite+ (`vp`).
- **GitHub:** `ahmedkhan25/lastlink` (branch `main`).
- **Deploy:** Render Blueprint (`render.yaml`). Push to `main` auto-deploys;
  static sites build fast, the web service occasionally needs a `--clear-cache`
  redeploy (pnpm prod-cache quirk).
- **Data:** single Neon Postgres (`bold-mouse-03150772`). Schema in `db/schema.sql`.

---

## 7. The 90-second demo (what to show investors)

1. **Marketing** → "Begin your LastLink."
2. **Daniel** signs up → writes a letter (or records a video) → adds a recipient →
   designates 2 advocates → "active & sealed."
3. **Advocates** accept via email → one begins the confirmation → both confirm →
   **24-hour hold** with live countdown.
4. Point out **"Stop the release"** (the safety), then **advance the hold**.
5. **Recipient** opens the private link → the message plays/reads, with the audit
   footer naming both advocates.

Every step above works on the live URLs today.
