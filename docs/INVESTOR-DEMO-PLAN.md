# Investor demo — plan

**Date:** 2026-07-20 · **Goal:** walk investors through the *entire* LastLink workflow end to end, using the real product where it's built and clearly-labelled mocks only where a feature is deferred — so the story is complete without overselling.

Companion docs: `GAP-ANALYSIS-ruby-vs-new.md` (why these mocks exist), `docs/mocks/` (the mocks themselves), `EMAIL-prod-not-sending.md` (a live blocker — see §4).

---

## 1. The demo spine (real vs mock)

The full narrated path, in order. "Real" = shipped and hitting Postgres/Mux/Resend. "Mock" = presentational stand-in for a deferred feature. This is also the **Investor demo path** screen in `docs/mocks/gallery.html`.

| # | Step | Status | Surface |
|---|---|---|---|
| 1 | Marketing site | ✅ Real | `lastlink-marketing` |
| 2 | Sign up (incl. Google/Apple) | 🟡 Real + **mock** social buttons | `app` |
| 3 | Onboarding wizard | 🟡 Real + **mock** consent/avatar/import | `app` |
| 4 | Dashboard ("active & sealed") | ✅ Real | `app` |
| 5 | Compose video / letter | ✅ Real (Mux + encryption) | `app` |
| 6 | Contacts (+ import) | 🟡 Real + **mock** import | `app` |
| 7 | Designate two advocates | ✅ Real | `app` |
| 8 | Account sealed | ✅ Real | `app` |
| 9 | Advocate confirms passing (×2) | ✅ Real | `advocate` |
| 10 | 24-hour cancellable hold | ✅ Real (time-warped for demo) | `advocate` |
| 11 | Release (decrypt, tokens, fan-out) | ✅ Real | `api` + workers |
| 12 | Recipient opens the message | ✅ Real | `message` |
| 13 | Public memorial + condolences | ⛔ **Mock** | new `memorial` |
| 14 | Remember them / upgrade to Premium | ⛔ **Mock** | `app` |

**Only three places on the whole path are mocks:** the social sign-in buttons, three additions inside onboarding, and the two post-death surfaces (memorial + offerings/billing). Everything on the critical verification/release path is real.

---

## 2. The mocks (all built)

In `docs/mocks/gallery.html` — one page, left-nav TOC, every screen switchable, in the real design system:

1. **Memorial + condolences** (public) — GAP 1+2
2. **Condolence moderation** (app) — GAP 3
3. **Import contacts** — Google + CSV — GAP 6
4. **Memorial settings & renewal** (app) — GAP 4
5. **Plan & billing** (app) — GAP 5
6. **Profile & avatar** (app) — GAP 7b
7. **Sign in (social)** — GAP 7a
8. **Onboarding (enhanced)** — the 7-step wizard adding consent, avatar, and an import entry point (the four onboarding gaps)
9. **Investor demo path** — the §1 spine as a screen

Plus `docs/mocks/01-memorial-page.html` — the standalone flagship memorial page.

---

## 3. Plan — how to actually run the demo

Two options, in increasing effort. Recommendation: **B for the next investor meeting**, then A as the real build.

### Option A — mocks stay as the design spec, real app is the demo
Demo the real deployed app for steps 1, 4–12; open the gallery mocks in a second tab for steps 2, 3, 6, 13, 14. Fastest (nothing to build), but the demo "jumps tabs" at the mock points — fine for a technical audience, less smooth for investors.

### Option B — inline the mocks into the real app as placeholder routes  ✅ DONE
Ported each HTML mock into a real React screen in the app, so the *real app itself* walks the whole path without leaving the browser. The screens are presentational (fixture data, no backend) and each carries a subtle **Preview** chip. Shipped:

- `apps/app` new routes: `/contacts/import`, `/condolences`, `/memorial/settings`, `/account/plan`, `/account/profile` (in `src/screens/preview/`); nav gains **Memorial** and **Account**; **Import** button on Contacts.
- `apps/app/src/screens/Onboarding.tsx`: added a **Consent** step (now 7 steps), an **avatar** on Identity, and an **import** entry on Contacts.
- `apps/app/src/screens/SignIn.tsx`: **Continue with Google / Apple** buttons.
- New **`apps/memorial`** app (public, port 5276, Render service `lastlink-memorial`): the memorial page + condolences + offerings.

All of it typechecks and production-builds clean. Original design intent below.

- `apps/app`: add routes — `/account/plan` (billing), `/account/profile` (avatar), `/memorial/settings` (renewal), `/condolences` (moderation), a `/contacts/import` modal, and the consent/avatar/import additions to `Onboarding.tsx`. Add "Continue with Google/Apple" to `SignIn.tsx`.
- New `apps/memorial` (or a route in `apps/message`): the public memorial + condolences page.
- Each reuses `@lastlink/ui`; each renders from a local fixtures module.
- Label them subtly (a "Preview" chip) so the team never mistakes a mock for a shipped feature.

### Option C — the real build (post-demo)
Turn the mocks into real features: add the schema (a `memorials` table, `condolences`, `messages.visible_on_memorial`, `registrants.portrait_ref`), the Hasura permissions, and the Express endpoints. This is the actual roadmap, sequenced in `GAP-ANALYSIS-ruby-vs-new.md` §7.3.

### Suggested build order for Option B (one PR per theme)
1. Onboarding additions (consent + avatar + import entry) — small diffs into `Onboarding.tsx`; highest demo value, it's early in the path.
2. Social sign-in buttons — tiny.
3. Contact import modal.
4. Memorial page + condolences (new surface) — the flagship.
5. Condolence moderation.
6. Plan & billing + memorial renewal.

---

## 4. Blocker to clear before a live demo: production email

Advocate invites and recipient notifications **do not send in prod** — the Resend account has no verified domain and `RESEND_FROM` is unset, so every send to a non-owner address is 403'd. A live demo that relies on a real email link (steps 9, 12) will not work until this is fixed. Full diagnosis + fix in `EMAIL-prod-not-sending.md`. Either fix it (verify `notify.lastlink.com` on Resend, set `RESEND_FROM`) or, for a scripted demo, use pre-opened advocate/recipient links so no email is needed.

---

## 5. Decisions needed from you (don't block mocking; do block shipping)

- **Post-death condolence moderation authority** — advocate, or a nominated "memorial keeper"?
- **Memorial visibility default** — public/SEO, or unlisted? (Ruby defaulted public; new brand leans private.)
- **Consent copy & placement** in onboarding — legal sign-off (arch §6.3 compliance track).
- **Premium pricing** — keep "visual" or set real numbers for the billing screen?
- **Social login vs 2FA-sealing** interaction — security review.

---

## 6. Status & next step

**Option B is built** (all preview screens + the memorial app) and the **email fix config** is in `render.yaml` (`RESEND_FROM`) with a startup warning in the API. The one remaining action is yours: **verify a sending domain on Resend** (`notify.lastlink.com`) so email actually delivers — the code and config are ready for it. After that, Option C (the real schema + endpoints, per `GAP-ANALYSIS-ruby-vs-new.md` §7.3) is the roadmap to turn these previews into shipped features.
