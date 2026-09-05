# Mobile usability pass

Start after the account-administrator changes and final polish are deployed.

## Priority and acceptance

1. Recipient email links: arrival, open video, playback controls, portrait/landscape sizing, readable letters, long names/content, loading and inactive-link states. No horizontal scrolling or clipped controls at 320, 375, 390, and 430 CSS pixels.
2. Wizard: Welcome → Consent → Identity → Advocates → Message → Contacts → Done. Check visible input borders, numeric birth date, buttons, two-column forms, recording controls, and Back/Continue preserving values. Do not accept new legal terms or send advocate invitations just to inspect layout.
3. Other consumer pages: sign-in, dashboard (owner and administrator), compose/detail/audience editor, contacts, advocates, account, memorial editor/gallery/moderation, public memorial and search. Retest desktop after shared layout changes.

Use the browser viewport controls for responsive layout checks; these are not a substitute for physical iPhone Safari/Android hardware testing. Preserve existing data and media. Layout changes must not alter release timing, recipient scope, authorization, or stored messages.

## Evidence

Record checked widths, issues found, fixes, screenshots, builds/type checks, and live deployment verification below as work proceeds. A page is not marked passed solely from source inspection.

### First responsive patch — local verification

- Replaced the fixed desktop sidebar on narrow screens with top navigation and an expandable Account menu. Sign out and demo controls remain available in that menu.
- Reduced page/card padding, stacked identity and advocate fields and compose panels, adapted contacts to vertical rows, wrapped memorial actions, and set phone input text to 16px.
- All seven wizard step layouts checked in a temporary, non-submitting local fixture at 320/375/390/430px. No off-screen controls. Fixture and exports removed before commit. This is layout coverage, not a new signup or a claim that invitations/consent were submitted.
- Recipient's actual delivered letter opened successfully; reading width at 320px increased from 164px to 246px while retaining 19px text. Actual delivered video opened and playback advanced with seek/mute/fullscreen controls visible; player was 288px wide at a verified 320px viewport.
- Fully loaded administrator dashboard, contacts, memorial form and empty moderation page checked locally. Memorial action-button overflow found and fixed. The user's exact dashboard sizes, 393×852 and 430×932, were verified using actual browser dimensions; content width matched scroll width (383px and 420px respectively, excluding scrollbar).
- Messages navigation now scrolls the main pane to the preserved messages. Browser Back returns to dashboard top. Desktop navigation remains in the sidebar.
- No release, audience, media-asset, stored-message or authorization changes in this patch. Recipient footer no longer claims every release waited an hour, because investor demos can bypass the hold.
- API and all existing SPA type checks passed; both changed application builds passed; 34 unit tests passed. Global formatting still reports pre-existing inconsistencies.

### Remaining audit coverage

- Verify the responsive patch on deployed app and recipient URLs.
- Continue lower-priority owner-only screens, public memorial/search, marketing, advocate entry, long letter content and error states. Do not describe all pages as passed yet.
- Physical iPhone Safari/Android playback, keyboard and camera behavior require a real-device pass; browser viewport tests alone do not establish these.

### Deployed verification and follow-up

- `5ebe91c` deployed: live dashboard checked at actual 393×852 and 430×932. Main-pane content and scroll widths match (383/383 and 420/420); top navigation and Account menu are visible. Recipient responsive bundle also deployed.
- Public search at 393px returned the Austin memorial correctly. Its individual memorial and visitor-memory form loaded. Found a 7px public-header overflow; wrapped the header actions in the follow-up patch.
- Sign-in still had a fixed-width inner card; changed it to width 100% / max-width 420px. Local checks at actual 320/393/430/1280px show no page overflow.
- Follow-up also stacks owner dashboard message actions beneath the title, wraps the audience-editor action and hides the horizontal advocate timeline connector when steps stack vertically.
- No screenshots or test fixtures contain reusable access links in this document. Browser screenshot output is available in the task; mobile capture scaling is imperfect, so actual viewport and DOM dimensions were also checked.

## Previous phase

- Account-administrator implementation: `74f589c`.
- Wording/navigation polish: `c86f7a0`.
- Obi's corrected original emails and the two additional Public message emails to the administrator UAT alias were verified delivered by Resend.
- API and existing SPA checks passed; 34 unit tests passed. Repository-wide formatting checks report existing inconsistencies. Workers and enterprise packages referenced by the old checklist are absent from this checkout.
