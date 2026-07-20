# LastLink — Gap Analysis: legacy Ruby app → new platform

**Date:** 2026-07-20 · **Owner:** Ahmed · **Status:** planning
**Purpose:** Audit every feature the CEO's 2020 Rails app (`~/Repos/lastlink-rb-old-code`) shipped, decide whether the new platform (per `LastLink-Architecture.md`) covers it, and plan a **mock screen in the new UX** for each genuine gap. Section 6 maps onboarding old→new.

> Sources: the legacy app was revived and browsed locally (`~/Repos/lastlink-rb-local`, `docker compose up`); the new app was read from `apps/`, `db/schema.sql`, and `docs/LastLink-Architecture.md`. File:line citations are to those trees.

---

## 1. TL;DR

The new platform is **far ahead** of the Ruby app on the core product — pre-recorded video/audio/letter messages, a real dual-advocate verification state machine, a 24h cancellable hold, envelope encryption, and audit logging. The Ruby app had **none** of that; it was text-only with an unguarded, GET-based death trigger.

But the Ruby app shipped a **whole product surface the new app deliberately deferred or dropped**: the public **memorial page** ("Love Links"), a **condolence guestbook** with moderation, and a **memorial-page lifecycle** (expiry + paid renewal). It also had **Google Contacts import**, **social login**, and **profile avatars**. These are the real gaps.

**Mocks are built** — browse them in `docs/mocks/gallery.html` (a TOC + all seven screens in one page) and `docs/mocks/01-memorial-page.html` (the standalone flagship). **Seven mock screens**, grouped into three themes:

| # | Mock screen | Surface | Legacy origin | New-app status |
|---|---|---|---|---|
| 1 | Public memorial / memory page | new `memorial` surface | Love Links | ⛔ deferred post-MVP (arch §13) |
| 2 | Condolence guestbook (post) | new `memorial` surface | Condolences | ⛔ absent (no table) |
| 3 | Condolence moderation | registrant `app` | Condolence status enum | ⛔ absent |
| 4 | Memorial lifecycle & renewal | registrant `app` | Order ($49.95 / $99.95) | ⛔ absent (offerings ≠ page renewal) |
| 5 | Plan & billing / upgrade | registrant `app` | MembershipPayment | 🟡 planned, unbuilt (Epic 5.2) |
| 6 | Contact import (Google + CSV) | registrant `app` | Google Contacts import | 🟡 CSV planned; Google absent |
| 7 | Profile & account, incl. avatar + social sign-in | registrant `app` / auth | avatar, omniauth | ⛔ absent |

---

## 2. Method & the direction of the comparison

This audit runs **legacy feature → new platform**: for each thing the Ruby app actually did, we ask "does the new architecture cover it?" Three outcomes:

- **✅ Covered (often improved).** The new app does this, usually better. No action.
- **🟡 Planned but unbuilt.** The architecture names it but there's no screen yet. Mock clarifies the UX.
- **⛔ Absent / deferred.** No table, no surface, no plan — or explicitly punted to "post-MVP." Mock defines what we'd build.

We do **not** propose re-importing the Ruby app's *weaknesses* (unguarded release, PayPal, hardcoded email). Where the new app replaced a legacy mechanism with a stronger one (Stripe for PayPal, the verification engine for the GET trigger), that's marked ✅.

---

## 3. Full feature inventory

| Legacy feature | Legacy evidence | New-platform equivalent | Status |
|---|---|---|---|
| Pre-recorded messages | text-only: `memorial.story`, `list.message` (rich text) | video / audio / letter (`message_type_t`, Mux pipeline, arch §9) | ✅ new is a superset |
| Death confirmation by advocates | `advocates_controller#confirm_death` (GET, **no authz**) | verification state machine, tokenized advocate JWTs (arch §8) | ✅ new far stronger |
| Dual-advocate requirement | `if advocates.where(status: evidenced).length == 2` | slots A/B, `both_confirmed` guard, distinct-advocate check (arch §8.3) | ✅ |
| Safety hold / cancel | none — release is synchronous & irreversible | mandatory 24h cancellable hold, pg-boss durable job (arch §8.4) | ✅ |
| Contacts | `Contact` (email/phone text arrays, `public_list`) | `app.contacts` + `reach_channels` (arch §6.1) | ✅ |
| Contact grouping / targeted messages | private `List` + `ContactList` join (Premium) | `contact_groups` + `messages.group_id` (arch §6.1) | ✅ |
| Public broadcast notification | `contact.public_list = true` → `public_list_notification` | per-message group targeting; **no "everyone" broadcast concept** | 🟡 subtly different — see §5.1 note |
| Audit trail | none | append-only hash-chained `audit.audit_events` (arch §6.5) | ✅ |
| Email delivery | SendGrid SMTP, several mailers hardcoded to dev's Gmail | Resend + Twilio `NotificationService` (arch §11) | ✅ |
| **Public memorial page** | `memorials#show`, `love-links/:id`, `friendly_id` slug | **deferred post-MVP; "stub the UI, no backend" (arch §13)** | ⛔ **GAP 1** |
| **Condolence guestbook** | `Condolence` (name/email/message/status) on memorial | **no table, no surface anywhere** | ⛔ **GAP 2** |
| **Condolence moderation** | `status` enum pending/accepted/rejected; `update_status` | none | ⛔ **GAP 3** |
| **Memorial expiry + paid renewal** | `Order`: $49.95 → +1yr, $99.95 → permanent; `MemorialSponsorJob` reminder | **offerings are flowers/donation/memorial, not page renewal** (arch §6.3) | ⛔ **GAP 4** |
| **Free/Premium membership + payment** | `MembershipPayment` $99.95 via PayPal; Premium unlocks private lists + permanent page | `plan_t` enum + gating **planned** (Epic 5.2); no upgrade/billing screen | 🟡 **GAP 5** |
| **Google Contacts import** | `google_controller` OAuth → `ImportContactsJob` → merge by email | CSV import **planned** (Epic 1.2); no Google, no import UI yet | 🟡 **GAP 6** |
| **Social login** (Facebook / Google) | `omniauth-facebook`, `omniauth-google-oauth2`, `User.from_omniauth` | email/password + mandatory 2FA only (Better Auth, arch §5.2) | ⛔ **GAP 7a** |
| **Profile avatar** | `has_attached_file :avatar` (Paperclip) | `registrants` has no avatar/photo column | ⛔ **GAP 7b** |
| ToS acceptance | `t_n_c_agreement`, `complete_registration` | not an explicit onboarding step | 🟡 onboarding gap — see §6 |
| "Deaths today" counter | marketing hero JS | different marketing site | ➖ cosmetic, skip |
| PayPal subscriptions (scaffolded) | unrouted `paypal_create_subscription` — dead code | Stripe Billing (arch §12) | ➖ legacy dead code, ignore |

---

## 4. New-app UX conventions (so mocks match)

Any mock must be built in the established design language (`packages/ui/src/styles.css`, and screens like `Dashboard.tsx`, `Onboarding.tsx`):

- **Palette:** warm "bone" background (`--bone #FAF7F1`), white surfaces, deep-brown ink (`--ink #1F1814`), brand gradient purple→blue (`--brand-grad`) used *sparingly*. A `dusk` dark palette exists via `[data-palette="dusk"]`.
- **Type:** headings in **Cormorant Garamond** serif (`.serif`, often 28–56px, italic for quiet/emotional lines); body in **DM Sans**; small ALL-CAPS labels in **JetBrains Mono** (`.mono`, letter-spacing ~0.12–0.14em).
- **Components:** `.ll-btn` (+ `.ghost`), soft cards on `--surface` with `--shadow-1/2`, `--r-3/4` radii, `Icon`, `Logo`, `ImgSlot` (image placeholder), `LLPhotos`.
- **Tone:** calm, unhurried, second-person, reassurance over urgency ("The link expires; the message stays"). Token-gated surfaces are `noindex`.
- **Density:** spacing via `--space-*` scale; `[data-density]` switch.

Mocks should be React screens in the relevant app (preferred, reuses `@lastlink/ui`) or standalone HTML using the same tokens. Each mock is **presentational only** — no backend — matching how the arch doc says to stub deferred modules.

---

## 5. Mock screen specifications

Each spec: where it lives, route, layout, components, the data it *would* bind to, and states to show. Ordered by priority.

### 5.1 GAP 1 — Public memorial / memory page  ★ flagship

**Legacy:** `love-links/:id` → `memorials#show`. A `friendly_id`-slugged public page with the person's name, a date, an avatar, three prose blocks (`last_words`, `story` rich text, `memorial_details`), and a Condolences tab. Text-only.

**New status:** Architecture §13 explicitly defers "the memorial/memory-site" to post-MVP and says "stub the UI, no backend." So there's *intent* but nothing built and no table.

**Why it matters:** it's the one public, shareable, SEO-relevant artifact of the whole product — the thing a grieving family actually links to. It also anchors the offerings (flowers/donation) that the new app *does* plan to monetize.

**Proposed surface:** a new **`apps/memorial`** SPA (or a route inside `apps/message`), served at `memorial.lastlink.com/:slug`. Public, but the *private* messages remain token-gated on `msg.` — the memorial page is the public face; the private letters/videos are not on it.

**Layout (mock):**
- Full-bleed calm header: butterfly `Logo`, the person's `legal_name` in large Cormorant serif, dates ("1962 – 2026"), an `ImgSlot` portrait.
- Tabs: **About** · **Condolences** · **Remember them** (offerings).
- About: `last_words` as a pulled serif italic quote; `story` prose; `memorial_details` (service info) in a bordered card.
- Optional released **public** video/letter tiles (only messages the registrant marked "visible on memorial" — new field, see below).
- "Remember them" strip: flowers / donation offering cards (ties into arch §12 offerings).
- Footer: audit-style provenance line ("Verified by two advocates · confirmed 2026-06-11"), reinforcing the brand's integrity promise.

**Data it would bind to (new columns to add later):** a `memorials` table keyed to `registrant_id` — `slug`, `published`, `headline`, `about_html`, `service_details`, `portrait_ref`, `visibility` — plus a `messages.visible_on_memorial boolean`. None exist today; the mock defines them.

**States to mock:** published memorial (rich), minimal memorial (name + dates only), not-yet-published (private preview the registrant sees).

### 5.2 GAP 2 — Condolence guestbook (visitor posts)

**Legacy:** `Condolence` (name, email, message, status). Anyone on the memorial page could post; auto-`accepted` on create (`condolences_controller.rb:45`); shown once accepted.

**Proposed:** the **Condolences** tab of the memorial page (5.1). A simple, warm compose card ("Share a memory") + a moderated feed of accepted notes (name, relative-time, message). Spam/pending notes hidden.

**Layout (mock):** feed of condolence cards (serif name, mono timestamp, body); sticky "Leave a message" card with name/email/message fields and a gentle submit. Empty state: "Be the first to share a memory of {name}."

**Data (new):** `condolences` table — `memorial_id`, `author_name`, `author_email`, `body`, `status (pending|accepted|rejected)`, `created_at`. Mirror of the legacy model, but default to **pending** (the legacy auto-accept is a spam hole).

### 5.3 GAP 3 — Condolence moderation (registrant/family)

**Legacy:** any advocate could flip status via `update_status_condolences_path`.

**Proposed:** a screen in **`apps/app`** (registrant) — or a delegated advocate view — listing incoming condolences with **Approve / Hide / Report** actions. Reachable from the dashboard once a memorial is published.

**Layout (mock):** table/list of pending + accepted condolences; per-row author, message preview, timestamp, action buttons; a small counter ("3 awaiting review"). Matches `Dashboard.tsx` card idiom.

**Note:** who moderates after death is a **product decision** — the registrant is gone, so this likely delegates to an advocate or a nominated "memorial keeper." Flag for product; the mock assumes an advocate-delegated moderator.

### 5.4 GAP 4 — Memorial lifecycle & renewal

**Legacy:** `Order` extends an expiring memorial page — $49.95 → +1 year, $99.95 → permanent (`orders_controller#submit`). `MemorialSponsorJob` emailed a reminder 10 days before `expiry_date`. Premium made the page permanent by default.

**New status:** absent. The new `offerings` are flowers/donation/memorial *products*, not page-lifecycle billing.

**Proposed:** a **Memorial settings** panel in `apps/app` (registrant, pre-death) and a renewal path for the memorial keeper (post-death). Controls: publish toggle, visibility (public / unlisted / private), expiry status ("Active — permanent on Premium" / "Expires 14 Aug 2026"), and an **Extend** action that routes to Stripe Checkout (reusing the arch §12 payment plumbing rather than PayPal).

**Layout (mock):** a settings card with the memorial URL + copy button, a lifecycle status row with a subtle warn state near expiry, and an "Extend / make permanent" CTA. Post-death variant is the keeper-facing version of the same card.

### 5.5 GAP 5 — Plan & billing / upgrade

**Legacy:** `MembershipPayment` ($99.95, PayPal) flips Free→Premium; Premium unlocks private lists + permanent memorial. UI gated pages with "Please upgrade your membership."

**New status:** `plan_t` enum exists and Epic 5.2 plans entitlement gating (unlimited video, custom groups, 1000 contacts, memorial flag, 24/7 support) — but **no upgrade or billing screen exists**.

**Proposed:** an **Account → Plan** screen in `apps/app`: current plan, a Free-vs-Premium comparison, an **Upgrade** CTA → Stripe Billing, and a billing-history stub. Entitlement limits surface inline elsewhere (e.g. "3 of 3 free videos used — upgrade for unlimited").

**Layout (mock):** two plan cards (Free / Premium) with feature checklists mapped to the Epic 5.2 entitlements; current-plan badge; upgrade button using `--brand-grad`. Keep pricing "visual" per PRODUCT-STATUS unless product sets real numbers.

### 5.6 GAP 6 — Contact import (Google + CSV)

**Legacy:** Google OAuth → `ImportContactsJob` → `GoogleFetcher.retrieve_other_contacts` → merge by email, default `public_list = true`.

**New status:** CSV import is *planned* (Epic 1.2) but there's no import UI, and no Google import at all. Today contacts are added one at a time (`Contacts.tsx`).

**Proposed:** an **Import contacts** modal/screen in `apps/app` with two paths — **Connect Google** (OAuth) and **Upload CSV** — then a review/dedupe step that maps imported people to `contact_groups` and `reach_channels` before saving.

**Layout (mock):** source picker (Google card / CSV drop zone); a review table (name, email, phone, suggested group, include toggle); a "12 new, 3 already in your contacts" summary. Ties to the onboarding Contacts step (§6).

### 5.7 GAP 7 — Profile, avatar & social sign-in

**Legacy:** user `avatar` (Paperclip); `omniauth` Facebook + Google login.

**New status:** `registrants` has `legal_name`, `dob`, `country` but **no avatar**; auth is email/password + 2FA only (Better Auth).

**Proposed (two small mocks, one screen + one auth variant):**
- **Account → Profile** in `apps/app`: name, DOB, country, and an **avatar** uploader (`ImgSlot` → upload). The avatar also feeds the memorial portrait (5.1).
- **Sign-in with social**: a `SignIn.tsx` variant adding "Continue with Google / Apple" buttons above the email/password form. ⚠️ Better Auth supports OAuth providers; this is a config + UX change, and **2FA-sealing rules must still apply** before an account is `active_sealed` — flag for security review.

**Layout (mock):** standard profile form + avatar circle with hover-to-change; sign-in card with social buttons, an "or" divider, then the existing email/password fields.

---

## 6. Onboarding: legacy vs new

### 6.1 Legacy onboarding (Ruby)

Reconstructed from `registrations_controller`, `application_controller`, `user.rb` callbacks, and the live app:

1. **Sign up** at `/users/sign_up` — email/password **or** Facebook/Google OAuth (`User.from_omniauth`, OAuth users auto-confirmed via `skip_confirmation!`).
2. **Email confirmation** — Devise `:confirmable`; email/password users must confirm before login (OAuth users skip it).
3. **`after_create` side effects** (`user.rb:108-123`): auto-create a blank `Memorial`, set `membership_type = Free`, backfill any `Advocate` rows that pre-invited this email.
4. **ToS gate** — `after_sign_in_path_for` redirects to `complete_registration` until `t_n_c_agreement == true`; `complete_registration` records acceptance.
5. **Loose guided setup** — no wizard; the app nudges via "NEXT STEP" buttons across pages: Profile → Links (contacts) → Linkers (advocates) → Private Messages. Each is optional and skippable.
6. **No sealing, no identity verification, no mandatory message, no 2FA.** The account is "done" once ToS is accepted; everything else is optional forever.

### 6.2 New onboarding (React, `apps/app/src/screens/Onboarding.tsx`)

A single 6-step wizard ("STEP n OF 6"), progress-dotted:

0. **Welcome** — sets expectations (verify identity, contacts, message, advocates).
1. **Identity** — ID verification (**stubbed**: fields not fully bound, no gov-ID handler, nothing persisted).
2. **Contacts** — add people (one at a time in the current build).
3. **Message** — record/write the first message (video / audio-stubbed / letter).
4. **Advocates** — designate exactly two (slots A + B), invites sent `pending`.
5. **Done** — seals the account → `account_state = active_sealed`.

### 6.3 Side-by-side & gaps

| Dimension | Legacy | New | Gap / action |
|---|---|---|---|
| Structure | loose, optional, skippable | linear 6-step wizard, ends in "sealed" | ✅ new is better |
| Sign-up methods | email/pw **+ Facebook/Google** | email/pw + 2FA only | ⛔ **social login missing** (GAP 7a) |
| Email verification | Devise confirmable | Better Auth `requireEmailVerification` | ✅ parity |
| **ToS / consent** | explicit `t_n_c_agreement` step | **not an explicit step** | ⛔ **add a consent checkpoint** (legal-sensitive; likely belongs at Welcome or Done) |
| Identity verification | none | dedicated step (stubbed) | ✅ new ahead (needs real vendor) |
| First message | optional, never enforced | a wizard step | ✅ new ahead |
| Advocates | invited ad hoc, up to 5 (view-only cap) | exactly 2, slots A/B, enforced | ✅ new ahead |
| Contacts | manual + **Google import** | manual only (import planned) | 🟡 **import missing from onboarding** (GAP 6) |
| Profile photo / avatar | avatar at signup | none | ⛔ **avatar missing** (GAP 7b) |
| Plan choice | Free default; upgrade later | Free default; no in-flow plan step | 🟡 optional plan step (GAP 5) |
| Account "sealed" state | none | `active_sealed` milestone | ✅ new concept, keep |
| Recurring check-in | none | none (by design — AC: "no recurring check-in") | ✅ intentional |

**Onboarding actions that fall out of this:**
1. **Add an explicit consent/ToS checkpoint** to the new wizard (legal — coordinate with the §6.3 compliance track). Cheapest at **Welcome** (accept to begin) or **Done** (accept to seal).
2. **Add social sign-in** ahead of the wizard (GAP 7a) — but keep 2FA-before-seal.
3. **Add contact import** to the Contacts step (GAP 6) so people don't hand-type.
4. **Add avatar capture** to the Identity or a light Profile step (GAP 7b) — doubles as the memorial portrait.
5. Consider a **plan step** (GAP 5) if Premium is a launch lever; otherwise keep it out of the emotional flow and upsell later.

---

## 7. Build plan for the mocks

### 7.1 Where they live

- **New `apps/memorial` surface** (or routes in `apps/message`): mocks **1, 2** (public memorial + condolence posting).
- **`apps/app` (registrant):** mocks **3, 4, 5, 6, 7-profile** — new screens under an **Account** section + a moderation view + an import flow.
- **Auth:** mock **7-social** as a `SignIn.tsx` variant.
- **Onboarding:** consent + import + avatar changes fold into `Onboarding.tsx`.

### 7.2 How to build (presentational, no backend)

1. Reuse `@lastlink/ui` (`Logo`, `Icon`, `ImgSlot`, `.ll-btn`, `.serif/.mono`, tokens). Every mock renders from **local fixture data**, mirroring how the arch doc stubs deferred modules.
2. One PR per theme (memorial+condolences; account/billing/lifecycle; import; profile/auth; onboarding edits) so review stays scoped.
3. Each mock shows its **key states** (empty / populated / edge) so product can react to real variety, not a single happy path.
4. Add nothing to the DB or Hasura yet; where a mock implies new columns (memorials, condolences, `visible_on_memorial`, avatar_ref), list them as a **follow-up schema ticket**, not part of the mock.

### 7.3 Priority & sequencing

| Order | Mock(s) | Rationale | Rough effort |
|---|---|---|---|
| 1 | Memorial page + condolences (1, 2) | flagship public surface; biggest visible gap; investor-legible | M |
| 2 | Condolence moderation (3) | completes the memorial loop | S |
| 3 | Plan & billing (5) | unlocks the monetization story; arch already plans entitlements | S–M |
| 4 | Memorial lifecycle & renewal (4) | depends on the memorial page existing | S |
| 5 | Contact import (6) | quality-of-life; feeds onboarding | S |
| 6 | Profile/avatar + social sign-in (7) | rounds out account; avatar feeds memorial portrait | S |
| 7 | Onboarding edits (consent, import, avatar) | small diffs into the existing wizard | S |

### 7.4 Open product/legal decisions (don't block mocking, do block shipping)

- **Post-death moderation authority** for condolences (registrant is gone) — advocate? nominated keeper?
- **Memorial visibility default** — public/SEO vs unlisted. Legacy defaulted public; the new brand leans private.
- **Consent/ToS placement & wording** in onboarding — legal sign-off (arch §6.3 track).
- **Condolence default status** — recommend **pending** (legacy auto-accept was a spam vector).
- **Social login vs 2FA-sealing** interaction — security review (arch §5).
- **Memorial renewal pricing** — reuse Stripe (§12), not PayPal; product to set numbers.

---

*End. Mocks are presentational and additive; none touch the verification/release path or the audit schema. Where a mock implies schema, that's a separate follow-up ticket, not part of the mock work.*
