# LastLink Issues Tracking Sheet — Review (2026-08-10)

Source: `~/Downloads/LastLink Issues Tracking Sheet.xlsx` (12 tabs, 13 annotated screenshots).
This list captures every agreed text change and simple code change the sheet requests, plus the
larger items and open questions for completeness.

---

## 1. Agreed copy/text changes (simple, low-risk)

### Landing page — hero video (tab "Screen 1")
- [ ] **Replace the logo in the video poster/end-frame.** The plain `LASTLINK` wordmark placeholder
  (video opening frame) and the butterfly logo end-frame are both circled: use the **correct
  LastLink logo** in both spots. Issue row: "Logo on Video - update".

### Landing page — navigation (tab "Screen 1")
- [ ] **"Pricing" → "Plans"** in the top nav.
- [ ] **"For organizations" → "For Partners"** in the top nav.
- [ ] **"Sign in" → "Linker Sign-in"** (add "Linker" to the sign-in link).

### Landing page — problem section (tab "Screen 2")
- [ ] **"No verified standard" → "Currently No Trusted Solution"** (the circled tab item in the
  "…won't be." accordion section).

### Landing page — three-step section (tab "Screen 3")
- [ ] **"Leave your message" → "Link your message"** (step 03 heading; circled in the step detail
  panel — likely both the list item and the detail heading).

### Landing page — advocates section (tab "Screen 4")
- [ ] **"Trusted advocates, independently identified" → "…independently verified"** — change
  "identified" to "verified".
- [ ] (Also circled on this screen, minor: the word "always" in "You are always in control" under
  "Cancellable at any moment" — ties into the "less absolute language" request below.)

### Trust & Security section (tab "Screen 5")
- [ ] **Soften the "every …" language** in "Verifiable audit log": "Every advocate action, every
  login, every release is recorded and verifiable" — the three "every"s are struck out. Reword to
  something less absolute (e.g. "Advocate actions, logins, and releases are recorded and
  verifiable").

### Messages private/public section (tab "Screen 6")
- [ ] **Private card:** replace "A message addressed to the groups you select…" with
  **"Private – Create personalized messages for specific individuals"**.
- [ ] **Public card:** replace "One message, delivered to all of your designated recipients…" with
  **"Public – Send one message to your entire contacts list"**.

### Onboarding — "Who should be told?" / contact imports (tab "Screen Contact Imports")
- [ ] **Add more import options alongside "Import from Google or CSV": Hotmail, AOL, Facebook,
  Apple** — explicitly OK for them to be non-functional placeholders for now. (Duplicated on the
  tracking tab as an "Open" item.)

### Completion screen (tab "Screen LastLink Completed")
- [ ] **"You're protected." → "You're Linked"**.
- [ ] **Remove the struck-out body copy** ("…and sealed. Come back anytime to add a message, refine
  your audience, or update an advocate. We won't bother you.") — keep roughly "Your LastLink is
  active."
- [ ] **Add: "Come back anytime to make necessary changes"** (also an "Open" item on the tracking
  tab).

### Dashboard (tab "Dashboard")
- [ ] **Remove the "ACTIVE & SEALED" label** (crossed out above "Good morning, Allison.").
- [ ] **Add a profile photo** where the hand-drawn "Pic" box is; question asked: *how hard is it to
  activate photo upload?* (Needs a quick estimate — upload + storage + display.)

### Global copy sweep
- [ ] **Change all "24 hour" references to "1 hour"** (safety-hold copy, e.g. the "(DEMO ONLY —
  SHORTENED; THE REAL SAFETY HOLD IS 24 HOURS)" note and anywhere else "24 hours" appears).

---

## 2. Simple/medium code changes requested

- [ ] **Contact import placeholder buttons** (Hotmail, AOL, Facebook, Apple) — UI-only, can mirror
  the existing Google mock flow.
- [ ] **Dashboard photo upload** — estimate requested, then activate if cheap.
- [ ] **Email letter format: no "open" button.** Evidence screenshot (tab "Sheet1"): the delivered
  letter-format email from "Benny Goldie" rendered with **no button/link to open the message**.
  Needs a fix in the email template; sender will retest. (Related tracking row: video message not
  delivered in last test with Christie — everything worked but video delivery.)
- [ ] **ToS replacement** — updated Terms of Service (aligned with the terminology dictionary) was
  uploaded to the LastLink Google Workspace; swap it in at `/terms`.

---

## 3. Larger items / needs design or discussion (from the tracking tab)

| Item | Status |
|---|---|
| Advocate access rights — make more granular | Assigned Ahmed |
| Sign-up emails ("you've been chosen…") + a "turn off" notifications feature | Assigned Ahmed |
| After passing, advocate becomes admin of the deceased's account — how does that work with 2 advocates? How is the admin chosen and communicated? | Ahmed / Discussion |
| Video message not delivered on last live test (Christie) — everything else worked | Ahmed |
| Build out the B2B / partners screen — they want to hit that audience first | Discussion |
| Memorial Page — advocates manage it; should the feed link be sent with the deceased's messages to limit total emails/texts to Connections? | Discussion |
| Memorial Feed — build out the page for updates/posts from advocates (with advocate review/approval of posts) | Discussion |
| Ad banners — where displayed? Memorial feed? | Discussion |
| Landing-page "Search" for a deceased person by name (public profiles only; private hidden) — feasibility question | Discussion |
| Tier-1 sponsor demo banner ("Holly Hall" / "Holy Hall") for partner demos | Discussion |
| Advocates hold screen: do **both** advocates see the "Both advocates have confirmed" screen, or only one? (tab "Advocates") | Question for Ahmed |

---

## 4. Non-code items on the tracking tab (FYI)

- Provide Ahmed access to the LastLink Google Workspace (Allison) — "Ahmed please confirm".
- Contact Jim Leatherby (SCI) — LinkedIn outreach, no response yet.
- Contact Christie Fewlass (Northstar Memorial) — Dawn & Allie met her 3 hours, feedback collected.
- Investor-prep notes (sponsor LOI as credibility lever, present conservative case first, prepared
  answer to "the Facebook question").

---

## Notes

- Tracking-tab dates are Excel serials: 46232 = Jul 29 2026, 46237 = Aug 3, 46240 = Aug 6,
  46243 = Aug 9 2026.
- The "24 hour → 1 hour" change conflicts with the current demo copy that says the real hold is
  24 hours — confirm whether the *product* hold is becoming 1 hour or just the copy.
