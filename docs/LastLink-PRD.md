# LastLink — Product Requirements Document (MVP)

**Version:** 1.0 · **Date:** June 2026 · **Status:** Build-ready
**Companion docs:** `LastLink-Architecture.md` (how it's built), `LastLink-Spec.md` (research & vendor groundwork)

> This PRD defines *what* the LastLink MVP must do and *how we'll know it's done*. The MVP must work for real — usable by investors and early/test users end-to-end. Engineering detail lives in the Architecture doc; this document owns scope, behavior, and acceptance criteria. Items needing a product or legal decision are flagged ⚠️.

---

## 1. Product summary

LastLink is a verified digital death-notification and legacy-messaging platform. A **registrant** records messages (video, audio, or letter) for the people they love. When the registrant dies, **two designated advocates** independently confirm the death; after a mandatory safety hold, LastLink delivers each message to its intended **recipients**, in the registrant's own words, at the same moment — never secondhand. An **enterprise HR console** brings the same verified notification to workplaces at scale.

### Product principles (these shape every decision)
1. **One-time setup, then peace of mind.** There is **no recurring check-in, heartbeat, or weekly nag.** Once set up, the account is "active & sealed." LastLink only contacts the registrant if something changes (e.g., a verification is initiated). Reflect this everywhere.
2. **A false alert is unthinkable, so we make it nearly impossible.** Dual-advocate confirmation + a cancellable safety hold + an immutable audit trail.
3. **Quietly hopeful, never clinical.** Warm, plainspoken, no SaaS metric-tiles, no jargon. Monetization is gentle and inherits the *deceased's* authority (things they chose), never the platform's pressure.
4. **Honesty over hype.** Security and compliance claims must be true today or clearly labeled as roadmap. See [§9](#9-compliance--honest-claims).

---

## 2. Goals & non-goals (MVP)

### Goals
- A registrant can verify identity, build contacts/groups, record a **video** (and audio/letter) message, and designate two advocates — in roughly 10 minutes.
- Two advocates can independently confirm a death through a compassionate, tokenized flow.
- After a **24-hour cancellable hold**, messages are delivered to recipients via **email + SMS**, and recipients can open them (video playback, letter) through a private, expiring link — while the message itself persists.
- Gentle **offerings** (flowers, donation, memory site) are purchasable with partner revenue share.
- An **enterprise HR console** demonstrates verified workplace death notification with a real "time to first notification" metric.

### Non-goals (explicitly out of scope for MVP)
- True zero-knowledge end-to-end encryption with beneficiary-held keys (MVP uses provider-assisted envelope encryption — see Architecture §10).
- Reply-to-deceased messaging and the full memorial/memory-site product (stub the UI; no backend).
- Live HRIS sync (Workday/ADP/BambooHR) — model the boundary, implement manual + CSV case creation.
- Backup/tertiary advocate automation — MVP assumes exactly two advocates with a support-escalation path.
- AI-generated message suggestions beyond optional gentle writing prompts.
- Native mobile apps (responsive web only; design is desktop-first, mobile is a fast-follow).

---

## 3. User roles

| Role | Definition | Key capabilities | Auth |
|---|---|---|---|
| **Registrant** | Creates the account, authors messages | Verify identity, manage contacts/groups, record/write messages, designate two advocates, manage account | Full account (email/password + 2FA) |
| **Advocate** | One of two people who confirm the registrant's death | Receive request, verify own identity, confirm/dispute death details, cancel a release | Tokenized link + identity check |
| **Recipient** | A contact who receives a message after verified release | Open message (video/audio/letter), access aftercare, engage gentle offerings | Tokenized link + light verification |
| **HR / Enterprise Admin** | Workplace admin managing employee death notifications | Open/track cases, monitor verification, manage enrollment, export audit | Account (SSO; MVP may use email/password) |
| **Prospect** | Unauthenticated visitor | Browse marketing, begin signup, contact enterprise sales | None |

⚠️ **To define:** what happens if an advocate predeceases the registrant, is unreachable, or declines; admin role tiers (super-admin vs case-handler) within enterprise.

---

## 4. The canonical verification timeline (product behavior)

> The original designs conflicted (advocate.html showed a 24-hr hold; app.html showed a 24-hr hold *plus* a 48-hr window). **This is the single source of truth. Both surfaces must match it.**

1. **An advocate opens their tokenized link and begins.** They verify their own identity (email, phone, photo-ID match, liveness ⚠️ vendor TBD).
2. **Each advocate independently confirms the death details** (name, DOB, date of passing, location, cause) — confirming or disputing each, with a clear "are you certain?" gate.
3. **When both advocates have confirmed, a mandatory 24-hour safety hold begins.** During this hold LastLink makes direct contact attempts to the registrant (phone, email, secondary contact). **Anyone on the case — either advocate, the registrant if alive, or support — can cancel instantly**, returning the account to "active & sealed."
4. **If 24 hours pass with no cancellation and no dispute, the release is authorized** and delivery begins.
5. **All messages are delivered within 48 hours of release authorization** — the 48-hour figure is a *delivery SLA*, not a second waiting period.

**Plain-language summary for users:** *"After both your advocates confirm, there is a full day during which the process can still be stopped. Only after that day passes are your messages delivered."*

---

## 5. Surface-by-surface requirements

### 5.1 Marketing website (`index.html`) — public

Long-scroll public site; the only indexed surface. Conversion target: **"Begin your LastLink" → app**.

**Must include (in order):** nav (How it works / Trust & security / Who it's for / Pricing / For organizations / Sign in / Begin); hero ("Your final message, delivered with certainty" + reassurance row + a message-preview card 🎥); problem strip; interactive "How it works" 5-step (Register → Write → Designate advocates → Verified trigger → Delivery); verification block (dual-advocate diagram + assurances); trust & security section; tabbed scenarios (Father / Founder / Grandmother); pricing (Free vs Premium); final CTA (+ "For organizations & HR" → enterprise); footer.

**AC:**
- *Given* a prospect on the hero, *when* they click "Begin your LastLink," *then* they land in onboarding.
- All security/compliance copy reflects [§9](#9-compliance--honest-claims) (no overstated claims). ⚠️ Legal sign-off before launch.
- The "How it works" and verification copy match the [canonical timeline](#4-the-canonical-verification-timeline-product-behavior).
- Marketing is pre-rendered for SEO; advocate/message/enterprise surfaces are `noindex`.

### 5.2 Consumer account app (`app.html`) — registrant

Hash-routed: `#onboarding`, `#dashboard`, `#compose`, `#contacts`, `#advocates`, plus account/settings. New users land on onboarding.

#### 5.2.1 Onboarding (6 steps)
| Step | Screen | Requirement |
|---|---|---|
| 0 | Welcome | Sets expectation: ~10 min, 5 tasks |
| 1 | Identity | Legal name, DOB, country; gov-ID upload; "encrypted, human review < 5 min" ⚠️ vendor + SLA TBD |
| 2 | Contacts | Seed Family / Close friends / Business; import from Google/Outlook/CSV (CSV required for MVP; OAuth imports nice-to-have) |
| 3 | Message | Record first message — **Video / Audio / Letter** tabs; "no time limit"; encouraging copy |
| 4 | Advocates | Invite two advocates (name, relationship, email, phone); "both must confirm" explained |
| 5 | Done | "You're protected" — account **sealed**; explicit promise of no nagging / no weekly check-ins |

**AC:** completing step 5 sets the account to **active & sealed**; **no recurring check-in job is scheduled**; the registrant is told the system will only reach out if something changes.

#### 5.2.2 Dashboard
Warm greeting + date + reassuring subhead ("Everything is in place… nothing you need to do today"). A **status strip** (not metric tiles): *Identity verified · Two advocates confirmed · Messages sealed*. A quiet **messages list** (per-group title, recipient summary, type + length 🎥, status Ready/Draft). A **"Recently"** one-time-setup history with dates. A **reflective prompt** linking to Compose.

**AC:** the dashboard reflects real account state; tone matches principle 1 (peace of mind, nothing to do).

#### 5.2.3 Contacts
Left rail: groups (Family / Close friends / Business) with counts + "New group." Main: contact table (name, relationship, location, reach channel Email+SMS, linked message). Actions: add contact, import CSV, search. "Why groups?" helper.

**AC:** a registrant manages contacts and groups; each group can map to a different message; a registrant can never see another registrant's data.

#### 5.2.4 Compose 🎥 (the core authoring surface — video is central)
Mode tabs **Video / Audio / Letter**:
- **Video:** in-browser record control, elapsed time, re-record, preview, gentle prompts ("Tell each person one thing… by name"). Captions auto-generated. ⚠️ Max length per plan, retake limits TBD (engineering defaults in Architecture §9).
- **Audio:** large record button, waveform, pause/resume.
- **Letter:** title + long-form rich text, word count, est. read time, autosave.

Right rail: **Audience** (which group receives this), **Delivery** (channel Email+SMS, reading order, aftercare attachment, visibility = private to recipient), **Gentle prompts**. Header: draft state, autosave, "Preview as recipient," "Save message."

**AC:**
- *Given* a registrant records a video, *when* processing completes, *then* the message shows "Ready" with correct duration and a working "Preview as recipient."
- A letter's body is stored encrypted; it is never exposed except to its verified recipient after release.
- A video plays back only through a private, post-release token (a tokenless request fails).

#### 5.2.5 Advocates
Two advocate cards (name, relationship, email, phone, identity-verified, last login, confirmed state). Actions: invite, message, replace. A **"What happens when the time comes"** visual showing the [canonical timeline](#4-the-canonical-verification-timeline-product-behavior).

**AC:** the registrant can invite/replace two advocates; invite status is visible; the timeline shown matches the canonical one (24-hr hold, 48-hr delivery SLA).

#### 5.2.6 Account / Settings ⚠️ (not in the original design — required for MVP)
Plan management/billing, password/2FA, notification preferences, data export, account deletion, and "what if I cancel" handling.

**AC:** a registrant can change password/2FA, manage plan, export their data, and delete their account.

### 5.3 Advocate confirmation flow (`advocate.html`) — tokenized, `noindex`

Accessed via a unique, single-use tokenized email/SMS link. 4 steps:
1. **Landing** — compassionate framing; case metadata (registrant, reported date of death, other advocate's state, death certificate if present, # of contacts affected); "take your time, no clock"; options: Begin / talk to counselor / decline.
2. **Identity** — confirm advocate identity: email ✓, phone ✓, photo-ID match, liveness ⚠️ vendor TBD.
3. **Details** — independently confirm full name, DOB, date of passing, location, cause; Confirm/Dispute each; strong "are you certain" gate.
4. **Hold** — once both confirmed, the 24-hr safety hold view: progress + timeline of direct-contact attempts to the registrant; **option to stop the release**; talk to counselor.

**AC:**
- *Given* both advocates confirm, *then* the case enters the 24-hr hold and the second-advocate state is visible to the first.
- *Given* an advocate clicks "stop the release" during the hold, *then* the case is cancelled and **no delivery occurs**.
- Tokens are single-use and expire ⚠️ (expiry window TBD); every advocate action is recorded in the audit log.
- ⚠️ Dispute and decline paths need product/legal definition (see [§10](#10-open-questions--decisions-needed)).

### 5.4 Recipient message experience (`message.html`) 🎥 — tokenized, `noindex`

The emotional core. Two states: **arrival** and **opened**.

**Arrival:** "For [Recipient]", "[Name] left this for you," compassionate intro; a message preview card (thumbnail, "A message from your father," **type · duration · recorded date**, Open button); three trust badges (verified by two advocates, private to you / link expires but message stays, grief support available).

**Opened:** a large 16:9 **video player** with play/scrubber/timecode 🎥; a **companion letter** (serif excerpt); a quiet **aftercare strip** (Grief support · Estate guide · Reply to the deceased — *reply is stubbed for MVP*); **gentle offerings** framed "A few small ways you can honor [Name], in your own time" (Send flowers / Make a donation / A memory site), with footer "There is no pressure, ever."; an **audit footer** naming the two advocates who confirmed.

**AC:**
- *Given* a valid recipient link, *when* the recipient opens it, *then* the video plays (with captions) and the letter renders.
- *Given* the access link has expired, *when* the recipient revisits, *then* after a light re-verification a fresh link is issued and the message still plays ("the link expires; the message stays").
- Offerings inherit the deceased's choices (the charity/florist the registrant selected ⚠️ requires registrant consent UI) and never pressure the recipient.
- ⚠️ Reply-to-deceased destination/readership and the memory-site are post-MVP.

### 5.5 Enterprise HR console (`enterprise.html`) — SSO-gated, `noindex`

B2B admin app. Left nav: Cases, Employees, Workflows, Compliance, Reports + org switcher. A stat strip (active cases, resolved this year, **median time to first notification**, employees enrolled %). Tabs: Active / Pending review / Resolved / All. A cases table (Case ID, employee, department, reported-by, stage, reach, started) and a case-detail timeline. A "For HR" value block (integrates with Workday/ADP/BambooHR — *stubbed for MVP*).

**AC:**
- An HR admin can create a case (manually or via CSV import), and it progresses through stages (identity verification → advocate review → verified·delivering → resolved).
- The "median time to first notification" is computed from **real case timestamps** and labeled as a measured target, not a guarantee.
- ⚠️ Whether an employee needs a personal LastLink account (the enterprise↔consumer bridge) is an open decision — MVP treats HR-initiated cases as standalone.

---

## 6. Plans & entitlements

| | **Free ($0)** | **Premium ($60/yr)** |
|---|---|---|
| Messages | 1 | Unlimited 🎥 |
| Groups | 1 | All defaults + custom |
| Advocates | 2 | 2 |
| Contacts | 50 | 1,000 |
| Encryption | ✅ (envelope, at rest) | ✅ |
| Memorial page | — | ✅ (post-MVP module; entitlement flag at MVP) |
| Advocate support | standard | 24/7 |

**AC:** Free limits are enforced (e.g., a Free user cannot create a second message/group); upgrading unlocks Premium entitlements immediately. Premium billing via Stripe (subscription; not Connect).

---

## 7. Notifications matrix

All channels are **Email (Resend) + SMS (Twilio)** per the recipient/advocate's reach preferences. Every send is idempotent (no duplicate posthumous messages).

| Trigger | To | Channels |
|---|---|---|
| Advocate invited (during setup) | Advocate | email + sms |
| Verification case initiated | Advocate(s) | email + sms |
| First advocate confirmed → second needed | Second advocate | email + sms |
| During 24-hr hold ("are you there?") | Registrant + secondary contact | email + sms |
| Case cancelled | Advocate(s) | email + sms |
| Release: message ready | Recipient | email + sms |
| Access link reissued | Recipient | email |
| Offering purchased | Buyer | email |

**AC:** under provider retries or duplicate webhooks, a recipient never receives a duplicate "message ready" notification.

---

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| **Security** | AES-256 encryption at rest; release of message keys gated by verified death + KMS IAM; immutable, tamper-evident audit log; no third-party data sale. (See Architecture §10; honesty caveats in §9.) |
| **Privacy** | Message content is private to its intended recipient; advocate/recipient/enterprise surfaces are `noindex`; gov-ID and PII encrypted; data export + deletion available. |
| **Reliability / SLA** | Delivery dispatched within **48 hours** of release authorization; durable holds survive restarts/deploys; internal target 99.9% app availability, leaning on provider SLAs (Mux, Neon Scale 99.95%, Resend) for dependencies. Enterprise "median time to first notification" is **measured and reported**, presented as a target until production data exists — not a contractual guarantee at MVP. |
| **Accessibility** | Captions on **all** video (auto-generated); screen-reader support; reduced-motion; keyboard navigation. Desktop-first; mobile responsive is a fast-follow. ⚠️ |
| **Localization** | Contacts span countries (IE, JP, IN in the design). MVP supports English UI; SMS/email internationalization and per-jurisdiction legal variance are flagged. ⚠️ |
| **Performance** | Video ready-to-play shortly after upload (Mux); recipient page interactive quickly; marketing pre-rendered. |
| **Brand/tone** | Quietly hopeful, plainspoken, no metric-tile SaaS feel; gentle monetization only; warm bone palette, DM Sans + Cormorant Garamond, butterfly mark. |

---

## 9. Compliance & honest claims

The design copy makes claims that must be **reframed for investor and user honesty**. Engineering can build the substance; marketing must not overstate certification status.

| Claim in design | Honest MVP framing |
|---|---|
| AES-256 encryption | ✅ True and buildable — claim it. |
| Immutable audit log | ✅ True (append-only + hash-chained) — claim it. |
| No data sale | ✅ Policy commitment — put it in the privacy policy, back it with access controls. |
| "Keys you alone hold until release" | ⚠️ **Soften.** MVP is provider-assisted envelope encryption (LastLink can technically decrypt, but only under dual-advocate verification + KMS IAM + audit). Either change the copy or schedule true client-held-key E2E as roadmap. |
| SOC 2 Type II | ⚠️ **"In progress."** Realistic first-time timeline 6–12 months. Do not claim "compliant" at MVP. |
| HIPAA-aligned | ⚠️ "HIPAA-aligned practices" is a defensible posture; "HIPAA compliant/certified" is not (no such certification exists). **Applicability to LastLink's death/medical data is genuinely unclear — needs counsel.** |
| Patent-protected | ⚠️ Verify patent status/number before any public claim. |

**Action:** all security/patent/compliance marketing copy, the HIPAA applicability determination, and the legal sufficiency of the dual-advocate process (vs. requiring an official death certificate) require **legal + security professional review before launch.**

---

## 10. Open questions & decisions needed

These don't block engineering (the Architecture doc scaffolds around them) but must be answered before the relevant feature ships:

1. **Death verification source of truth** — is a death certificate required, or is dual-advocate attestation alone sufficient to trigger release? Varies by jurisdiction. ⚠️ legal
2. **Dispute path** — what happens when an advocate disputes a detail? (MVP routes to support review.) ⚠️
3. **Decline path** — what happens to the case if an advocate declines? (Cancel? Require backup?) ⚠️
4. **Backup/tertiary advocates** — failure modes when an advocate is unreachable, deceased, or declines. (Post-MVP automation; MVP uses support escalation.) ⚠️
5. **Video personalization** — one message per group, or per-named-recipient cuts? (The sample script addresses a recipient by name.) MVP: one message per group. ⚠️
6. **Permanence** — storage duration, inheritance, and the long-term fate of the deceased's account/archive. ⚠️
7. **Enterprise ↔ consumer bridge** — can HR open a case for an employee with no personal account? MVP: yes, standalone. ⚠️
8. **Offerings governance** — registrant consent for which offerings appear, partner vetting, revenue-share, keeping "no pressure" true. ⚠️
9. **Reply-to-deceased** — destination, readership, preservation. Post-MVP. ⚠️
10. **Identity/liveness vendor + SLA** for both registrant onboarding and advocate verification. ⚠️
11. **Token expiry windows** — advocate link single-use lifetime; recipient access-link lifetime. ⚠️

---

## 11. MVP definition of done

The MVP is "done" when a single uninterrupted path works on production infrastructure with real providers:

1. A test registrant signs up, verifies identity (stub OK), adds contacts/groups, **records a video message**, writes a letter, and designates two advocates — then sees "active & sealed" with **no recurring check-ins scheduled.**
2. Two test advocates each open their tokenized links, verify identity, and confirm the death details.
3. The case enters a **24-hour hold** (time-warpable in test); a **cancel during the hold provably prevents release** (the critical safety test).
4. With no cancel, the release authorizes and **messages are delivered via email + SMS** within the 48-hour SLA.
5. A test recipient opens the private link and **plays the video (with captions) and reads the letter**; revisiting an expired link reissues access while the message persists.
6. The recipient can purchase a **gentle offering** (revenue share to a connected partner).
7. The **enterprise console** shows a case progressing through stages with a real notification-time metric.
8. Every step above writes to the **immutable, hash-chained audit log**, and that chain verifies.

⚠️ Plus: legal review of all compliance/patent copy completed, and the SOC 2 program initiated, before public launch.

---

*End of PRD. ⚠️ marks decisions for product/legal; engineering specifics are in `LastLink-Architecture.md`.*
