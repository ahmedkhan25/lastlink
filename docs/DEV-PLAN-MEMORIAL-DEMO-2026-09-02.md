# LastLink Real Memorial — Investor Demo Development Plan

**Date:** September 2, 2026

**Status:** Implemented, merged, and deployed from `69fb196` on September 2, 2026

**Target:** Investor and limited product demos only
**Not a productionization plan**

## 1. Outcome

Replace the single hard-coded Daniel Rourke memorial with a real, database-backed memorial experience where:

1. Every existing and newly created test registrant has a separate memorial record and stable slug.
2. A signed-in test registrant can edit and manually publish their own memorial.
3. The public memorial app resolves `/:slug` and renders only that registrant's content.
4. Visitors can submit a written memory with one optional image.
5. A signed-in test registrant can approve or hide submissions.
6. Approved submissions appear on the correct public memorial.
7. The memorial includes inviting, realistic remembrance offers such as flowers, donations, and tree planting.
8. The flow is polished enough to demonstrate live to investors without claiming production readiness.

The intended demo is:

```text
Test user edits memorial
        -> uploads portrait/gallery images
        -> manually publishes
        -> investor opens unique public URL
        -> visitor submits a memory + image
        -> test user approves it
        -> approved contribution appears on the memorial
        -> investor opens a flower/donation/tree offer
        -> polished mock partner flow completes without a real charge
```

## 2. Scope decisions locked for this increment

These decisions are deliberate constraints, not future product policy:

- Use fictional/test-user data only.
- Default memorial visibility is `unlisted` and the public app emits `noindex`.
- The signed-in registrant is the only memorial editor/moderator in this increment.
- Publishing is manual and gated by a demo-only backend flag.
- Visitor submissions default to `pending`.
- A visitor may attach at most one image.
- Visitor email is optional and never rendered publicly.
- The `Remember them` cards become data-backed, polished demo advertisements with realistic images, provider names, pricing, and calls to action.
- Offer clicks open a convincing local demo detail/checkout modal; they do not charge a card or submit a real order.
- Public message cards remain metadata-only in this increment; do not add public letter decryption or Mux playback-token issuance.
- Do not connect memorial publishing to the death-verification/release state machine yet.
- Do not build advocate or memorial-keeper permissions yet.
- Do not build real billing, partner fulfillment, expiry, search, ad targeting, notifications, CAPTCHA, malware scanning, content AI, or production moderation tools.

## 3. Current code review

### 3.1 What already exists and should be reused

- `apps/memorial` is already a deployed React/Vite surface with the desired visual design and the `About`, `Condolences`, and `Remember them` tabs.
- `apps/memorial/src/main.tsx` already routes `/:slug`, but the slug is ignored by the component.
- `render.yaml` already deploys `lastlink-memorial`, rewrites all routes to `index.html`, and injects `VITE_API_URL`.
- `apps/app` already exposes `/memorial/settings` and `/condolences` behind Better Auth.
- `apps/app/src/AppLayout.tsx` already includes the Memorial navigation item.
- `apps/app` already has `getApi`, `postApi`, and session-scoped `/graphql` helpers.
- `apps/api` already owns authentication, public token surfaces, direct SQL access, UploadThing, and audit writes.
- `app.registrants.avatar_url` and the working `profilePhoto` UploadThing route can supply the default memorial portrait.
- `app.partners` and `app.offerings` already exist as visual-only demo tables and should power the remembrance advertisements rather than introducing another commerce model.
- The API CORS middleware already supports the separate memorial SPA for non-cookie public GET/POST requests.
- The database schema is maintained as an idempotent `db/schema.sql`; use the same pattern for this increment.

### 3.2 What is currently mocked or absent

- `apps/memorial/src/Memorial.tsx` renders `PERSON`, `CONDOLENCES`, and `OFFERINGS` constants. It makes no backend calls.
- The `/:slug` router renders the same Daniel fixture for every URL, including unknown slugs.
- The visitor form has no state, submit handler, persistence, or image control.
- `apps/app/src/screens/preview/MemorialSettings.tsx` and `Condolences.tsx` are hard-coded previews.
- There are no `memorials`, `memorial_media`, or `condolences` tables.
- There are no memorial API endpoints.
- Hasura tracks no memorial tables or relationships.
- `apps/memorial` has no API helper and no UploadThing React dependency.
- The UploadThing router currently supports only authenticated profile photos.
- The existing offerings schema lacks the image, pricing-label, provider-attribution, and call-to-action fields needed for investor-ready cards.
- `package.json` declares `db:seed: tsx scripts/seed.ts`, but `scripts/seed.ts` does not exist.

### 3.3 Boundaries that must not be crossed

- Do not expose encrypted letter bodies on the public memorial.
- Do not issue Mux playback tokens from an anonymous memorial request.
- Do not alter confirmation, hold, release, recipient-token, or delivery behavior as part of this work.
- Do not replace the existing private recipient-message experience with memorial links.
- Do not turn demo publishing on unless `DEMO_MEMORIAL=true` server-side.

## 4. Data model

Add the following to `db/schema.sql`. Continue using `text` plus `CHECK` constraints rather than Postgres enums.

### 4.1 `app.memorials`

One row per registrant.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, generated |
| `registrant_id` | `uuid` | Unique FK to `app.registrants`, cascade delete |
| `slug` | `text` | Unique, stable public path |
| `status` | `text` | `draft`, `published`, or `hidden`; default `draft` |
| `visibility` | `text` | `unlisted` or `public`; default `unlisted` |
| `headline` | `text` | Short identity line |
| `location` | `text` | Optional display location |
| `birth_year` | `integer` | Presentation field for test data |
| `death_year` | `integer` | Presentation field for test data |
| `quote` | `text` | Pulled quote |
| `story` | `text` | Plain-text biography for this increment |
| `service_when` | `text` | Human-readable demo text |
| `service_details` | `text` | Location/wishes/details |
| `published_at` | `timestamptz` | Null until published |
| `created_at` | `timestamptz` | Default now |
| `updated_at` | `timestamptz` | Updated-at trigger |

The portrait does not need another memorial column in v1. Public reads should use `registrants.avatar_url` as the portrait.

Slug rules:

- Lowercase letters, numbers, and hyphens only.
- Stable after the page has been shown in a demo.
- Unique database constraint.
- Existing registrants are backfilled with `{slugified-name}-{first-6-id-chars}`.
- Curated demo accounts may receive a cleaner slug in the seed script.

### 4.2 `app.memorial_media`

Owner-uploaded gallery images.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `memorial_id` | `uuid` | FK to `app.memorials`, cascade delete |
| `url` | `text` | UploadThing URL |
| `file_key` | `text` | UploadThing key for future cleanup |
| `caption` | `text` | Optional |
| `alt_text` | `text` | Optional in demo; UI should fall back to caption/name |
| `sort_order` | `integer` | Default 0 |
| `created_at` | `timestamptz` | Default now |

### 4.3 `app.condolences`

Visitor contributions and their optional image.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `memorial_id` | `uuid` | FK to `app.memorials`, cascade delete |
| `author_name` | `text` | Required |
| `author_email` | `text` | Optional, owner view only |
| `relationship` | `text` | Optional |
| `body` | `text` | Required |
| `image_url` | `text` | Optional UploadThing URL |
| `image_key` | `text` | Optional UploadThing key |
| `status` | `text` | `pending`, `approved`, or `hidden`; default `pending` |
| `created_at` | `timestamptz` | Default now |
| `reviewed_at` | `timestamptz` | Set on approve/hide |

Add indexes on:

- `memorials.slug`
- `memorial_media(memorial_id, sort_order)`
- `condolences(memorial_id, status, created_at desc)`

### 4.4 Public-message marker

Add `visible_on_memorial boolean not null default false` to `app.messages`.

For this increment the public API returns only:

- `id`
- `type`
- `title`
- `duration_seconds`
- optional thumbnail reference

Do not return letter ciphertext/body or public playback credentials. Tiles may be displayed as curated memorial artifacts without an Open/Play action.

### 4.5 Backfill behavior

`db/schema.sql` must create a blank memorial for every existing registrant with `ON CONFLICT (registrant_id) DO NOTHING`.

Update the Better Auth `user.create.after` hook so every new registrant receives a blank memorial after its registrant row is created. Extract slug generation into a small helper rather than duplicating it.

### 4.6 Demo remembrance offers and advertisements

Reuse `app.partners` and `app.offerings`. Add these nullable/demo columns to `app.offerings`:

| Column | Type | Notes |
| --- | --- | --- |
| `image_url` | `text` | Warm lifestyle image shown on the card |
| `price_label` | `text` | For example `From $49` or `Any amount` |
| `cta_label` | `text` | For example `Send flowers` |
| `cta_url` | `text` | Optional future partner URL; unused by the local demo modal |
| `sponsor_label` | `text` | Optional subtle provider attribution |
| `sort_order` | `integer` | Controls display order |

Seed three active offers:

1. **Send flowers** — `Willow & Rose Florals`, tasteful sympathy arrangement, `From $49`.
2. **Donate in their memory** — `Community Hospice Fund`, family-selected cause, `Any amount`.
3. **Plant a memorial tree** — `Legacy Grove`, native tree dedication, `From $35`.

These should read as considerate remembrance options, not loud banner ads. Use language such as `A few thoughtful ways to remember them` and `There is no pressure, ever.` A small `Remembrance partner` or `Sponsored` label is sufficient disclosure.

Use locally committed or generated demo imagery under `apps/memorial/public/assets/offerings/` so the pitch does not depend on third-party hotlinks. Use fictional provider names unless LastLink has permission to display a real partner's brand.

## 5. Hasura metadata and permissions

Update `scripts/hasura-setup.ts` to track:

- `app.memorials`
- `app.memorial_media`
- `app.condolences`

Add relationships:

- registrant -> memorial
- memorial -> registrant
- memorial -> media
- memorial -> condolences
- condolence -> memorial
- message -> media asset (if useful for the settings list)

Registrant permissions:

- `memorials`: select/update only where `registrant_id = X-Hasura-User-Id`.
- `memorial_media`: select/insert/update/delete only through a memorial owned by the registrant.
- `condolences`: select only through an owned memorial; update only `status` and `reviewed_at`.
- `messages`: expose and allow updating `visible_on_memorial` for the registrant's own rows.

Do not give the Hasura `anonymous` role direct insert/update access. Anonymous memorial reads and visitor submissions go through narrow Express routes.

## 6. API implementation

Create `apps/api/src/memorial.ts` and mount its routes from `apps/api/src/index.ts`.

### 6.1 Public read

`GET /public/memorial/:slug`

Behavior:

1. Resolve exactly one `status='published'` memorial by slug.
2. Join its registrant for display name and portrait.
3. Return gallery media ordered by `sort_order, created_at`.
4. Return only `status='approved'` condolences, newest first.
5. Return only messages owned by the same registrant where `visible_on_memorial=true`.
6. Return active remembrance offerings with their partner/provider names, ordered by `sort_order`.
7. Return 404 for unknown, draft, or hidden memorials.
8. Never return `author_email`, encrypted message columns, internal user IDs, or provider keys.

Response shape:

```ts
interface PublicMemorialPayload {
  memorial: {
    slug: string;
    displayName: string;
    portraitUrl: string | null;
    headline: string | null;
    location: string | null;
    birthYear: number | null;
    deathYear: number | null;
    quote: string | null;
    story: string | null;
    serviceWhen: string | null;
    serviceDetails: string | null;
  };
  gallery: Array<{ id: string; url: string; caption: string | null; altText: string | null }>;
  condolences: Array<{
    id: string;
    authorName: string;
    relationship: string | null;
    body: string;
    imageUrl: string | null;
    createdAt: string;
  }>;
  publicMessages: Array<{
    id: string;
    type: "video" | "audio" | "letter";
    title: string | null;
    durationSeconds: number | null;
    thumbnailUrl: string | null;
  }>;
  offerings: Array<{
    id: string;
    kind: "flowers" | "donation" | "memorial";
    title: string;
    description: string | null;
    providerName: string | null;
    imageUrl: string | null;
    priceLabel: string | null;
    ctaLabel: string;
    sponsorLabel: string | null;
  }>;
}
```

### 6.2 Visitor submission

`POST /public/memorial/:slug/condolences`

Body:

```ts
interface CreateCondolenceInput {
  authorName: string;
  authorEmail?: string;
  relationship?: string;
  body: string;
  imageUrl?: string;
  imageKey?: string;
}
```

Demo-level validation only:

- Published memorial must exist.
- Trim all strings.
- Name: 1-80 characters.
- Relationship: at most 80 characters.
- Body: 1-1,500 characters.
- Email: optional; basic valid-email check.
- Image URL/key: accept only values returned by the configured UploadThing flow.
- Insert with `status='pending'` regardless of client input.
- Return `{ ok: true, status: "pending" }`.

Do not send email or run automated moderation.

### 6.3 Demo publish control

`POST /api/memorial/publish-demo`

- Requires the signed-in registrant session.
- Returns 404 unless `DEMO_MEMORIAL=true`.
- Changes only the caller's memorial from `draft`/`hidden` to `published`.
- Sets `published_at` if absent.
- Writes `memorial.demo_published` to `audit.event_log`.

`POST /api/memorial/hide-demo`

- Same guards.
- Changes only the caller's memorial to `hidden`.
- Writes `memorial.demo_hidden` to the audit log.

Add to `apps/api/src/env.ts`:

- `DEMO_MEMORIAL`
- `MEMORIAL_BASE_URL`, defaulting locally to `http://localhost:5276`

### 6.4 UploadThing routes

Extend `apps/api/src/uploadthing.ts`:

1. `memorialGalleryPhoto`
   - Requires `requireRegistrant`.
   - Image only, 8 MB maximum, up to six selected per interaction.
   - Return `{ url, key }`; the authenticated app creates the media row through `/graphql`.

2. `condolencePhoto`
   - Demo-public route; no session requirement.
   - Image only, 4 MB maximum, one file.
   - Return `{ url, key }`; the memorial app includes both in the subsequent condolence POST.

This public upload route is acceptable only because the deployment is a controlled demo using test data. Its production replacement requires abuse, content, and file-safety controls and is explicitly outside this plan.

## 7. Registrant app implementation

Replace the preview screens with real screens:

- Move `apps/app/src/screens/preview/MemorialSettings.tsx` to `apps/app/src/screens/MemorialSettings.tsx`.
- Move `apps/app/src/screens/preview/Condolences.tsx` to `apps/app/src/screens/Condolences.tsx`.
- Update imports in `apps/app/src/main.tsx`; remove the preview comments for these two routes.

### 7.1 Memorial settings screen

The screen loads the caller's memorial and displays:

- Public URL and Copy link.
- Draft/published/hidden badge.
- Preview link.
- Headline.
- Location.
- Birth/death year.
- Quote.
- Story.
- Service date/time text.
- Service details.
- Existing profile portrait with link to the profile photo control.
- Gallery uploader, captions, ordering, and remove action.
- Ready messages with a `Show on memorial` toggle.
- `Publish demo memorial` / `Hide memorial` action.

Use Hasura through the existing `/graphql` proxy for ordinary field/media/message CRUD. Use the Express demo endpoints for publish/hide.

### 7.2 Condolence moderation screen

Replace the fixed list with two real sections:

- Awaiting review.
- Published.

Each row shows:

- Author name.
- Optional relationship.
- Private email only in the owner view.
- Message.
- Optional image thumbnail.
- Created timestamp.
- Approve or Hide action.

Hasura updates must be limited to the registrant's own memorial and only change `status`/`reviewed_at`.

After an action, reconcile from the database rather than relying only on optimistic local state.

### 7.3 App configuration

Add `getMemorialUrl()` to `apps/app/src/lib/api.ts`, backed by `VITE_MEMORIAL_URL` with local fallback `http://localhost:5276`.

Add `VITE_MEMORIAL_URL=https://lastlink-memorial.onrender.com` to the `lastlink-web` service in `render.yaml`.

## 8. Public memorial app implementation

Keep the current visual language, but split the 180-line fixture component into focused files:

```text
apps/memorial/src/
  MemorialPage.tsx
  types.ts
  lib/api.ts
  components/MemorialHeader.tsx
  components/AboutTab.tsx
  components/CondolencesTab.tsx
  components/ContributionForm.tsx
  components/RememberTab.tsx
```

### 8.1 Route behavior

- Read `slug` using `useParams()`.
- Fetch `GET {VITE_API_URL}/public/memorial/:slug`.
- Render loading, not-found, error, and loaded states.
- Unknown slugs must not fall back to Daniel.
- Update the page title to `In memory of {displayName} — LastLink`.
- Add `robots` metadata with `noindex,nofollow` for the demo deployment.

### 8.2 About tab

Bind every visible field to the public payload:

- Portrait.
- Name, years, headline, and location.
- Quote and story.
- Service information.
- Gallery.
- Public message metadata cards.

Empty optional sections should be omitted cleanly rather than showing placeholder text.

### 8.3 Condolences tab

- Render only approved contributions returned by the public endpoint.
- Display the optional visitor image under its contribution.
- Show an empty state when there are no approved contributions.
- Add a controlled contribution form.
- If an image is selected, upload it first through `condolencePhoto`, then POST the returned URL/key with the form.
- On success, clear the form and show: `Thank you. Your memory is waiting for approval.`
- Do not append the pending submission to the public feed.

Add `@uploadthing/react` and `uploadthing` to `apps/memorial/package.json`, matching the versions already used by `apps/app`.

### 8.4 Remember tab

Replace the hard-coded offering cards with the active `offerings` returned by the public memorial API.

Presentation requirements:

- Use high-quality, warm imagery for flowers, charitable giving, and tree planting.
- Show provider attribution, short empathetic copy, and a clear price label.
- Use action-oriented CTAs such as `Send flowers`, `Donate`, and `Plant a tree`.
- Include a restrained `Sponsored` or `Remembrance partner` label.
- Do not use flashing banners, countdowns, urgency, discount language, or aggressive upsells.
- Show a compact remembrance-offer strip near the bottom of the About tab and the full cards in the `Remember them` tab.

CTA behavior:

- Clicking an offer opens a polished modal or drawer inside the memorial app.
- The modal shows the offer image, provider, description, price, and a short mock order/donation summary.
- The primary action may say `Continue with this remembrance`.
- Completing the interaction shows a demo confirmation state such as `This remembrance option is ready for partner checkout.`
- No Stripe call, external redirect, order row, card capture, or fulfillment request is made.
- The UI must not imply that money was charged or an order was actually placed.

Store these components separately so real checkout can replace the modal later:

```text
components/OfferingCard.tsx
components/OfferingDetailModal.tsx
components/RememberTab.tsx
```

## 9. Demo data

Create `scripts/seed-memorial-demo.ts` and add:

```json
"db:seed:memorial": "tsx scripts/seed-memorial-demo.ts"
```

The script must be idempotent and must not delete existing registrant data.

It should:

1. Ensure every registrant has a memorial.
2. Populate curated memorial content for at least three selected test registrants.
3. Insert distinct galleries and condolences for each.
4. Mark a small number of ready messages visible on each memorial where available.
5. Seed the three remembrance partners/offers with realistic imagery and copy.
6. Publish the curated three memorials.
7. Print their final URLs without printing emails or other private fields.

Also fix or remove the existing broken `db:seed` script reference to the absent `scripts/seed.ts`. Prefer keeping the memorial seed as an explicit separate command so it cannot overwrite unrelated demo state by surprise.

## 10. Render and environment changes

Update `.env.example` and `render.yaml`:

API / registrant service:

- `DEMO_MEMORIAL=true`
- `MEMORIAL_BASE_URL=https://lastlink-memorial.onrender.com`
- `VITE_MEMORIAL_URL=https://lastlink-memorial.onrender.com`

Memorial static service:

- Keep existing `VITE_API_URL=https://lastlink-web.onrender.com`.
- Keep the existing `/* -> /index.html` rewrite.

No new Render service is required.

## 11. Validation and acceptance

### 11.1 Build/type validation

Run from the repository root:

```bash
pnpm exec tsc --noEmit -p apps/api/tsconfig.json
pnpm exec tsc -b apps/app/tsconfig.json apps/memorial/tsconfig.json
pnpm -F @lastlink/app build
pnpm -F @lastlink/memorial build
```

The repository documentation mentions `vp check`/`vp test`, but the current root `package.json` does not define `check` or `test`. Do not claim those validations ran unless the scripts are added or Vite+ provides them in the executing environment.

### 11.2 Database/API checks

- Re-running `db/schema.sql` succeeds without duplicating memorials.
- Every registrant has exactly one memorial.
- Every slug is unique.
- Public GET returns 404 for draft, hidden, and unknown pages.
- Public GET never returns pending/hidden condolences or `author_email`.
- Visitor POST always creates `pending`, even if the client sends another status.
- Public GET returns the seeded active offerings in the configured order.
- Offer interactions stay entirely client-side and create no payment/order record.
- User A cannot read or update User B's memorial/condolences through `/graphql`.
- Publish/hide endpoints affect only the authenticated registrant.
- Publish/hide endpoints return 404 when `DEMO_MEMORIAL` is disabled.

### 11.3 Investor-demo acceptance script

Use at least Test User A and Test User B:

1. Sign in as A and change the story.
2. Upload a gallery image for A.
3. Toggle a ready message as visible.
4. Publish A and copy the URL.
5. Open A's public page and confirm A's content appears.
6. Submit a visitor memory with an image.
7. Confirm it is not public before approval.
8. Return to A's moderation screen and approve it.
9. Refresh A's public page and confirm the memory/image appears.
10. Open `Remember them`, inspect all three realistic offer cards, and open the flower detail modal.
11. Complete the mock flower interaction and confirm no payment/order is created.
12. Open B's public page and confirm none of A's profile, gallery, messages, or condolences appear.
13. Open an unknown slug and confirm a gentle not-found state.
14. Repeat after a Render redeploy to prove persistence.

## 12. File-level implementation checklist

### Database and metadata

- [ ] `db/schema.sql` — new tables, message marker, indexes, triggers, backfill
- [ ] `db/schema.sql` — extend existing offerings with demo presentation fields
- [ ] `scripts/hasura-setup.ts` — tables, relationships, scoped permissions
- [ ] `scripts/seed-memorial-demo.ts` — idempotent test-user content
- [ ] `package.json` — seed command cleanup/addition

### API

- [ ] `apps/api/src/memorial.ts` — public read, visitor submit, demo publish/hide
- [ ] `apps/api/src/index.ts` — mount routes
- [ ] `apps/api/src/env.ts` — demo flag and memorial URL
- [ ] `apps/api/src/uploadthing.ts` — gallery and visitor upload routes
- [ ] `apps/api/src/auth.ts` — create a memorial for new registrants
- [ ] `packages/shared/src/` — request/response interfaces and validation constants

### Registrant app

- [ ] Replace preview `MemorialSettings` with database-backed screen
- [ ] Replace preview `Condolences` with database-backed moderation
- [ ] Update `apps/app/src/main.tsx` imports
- [ ] Add gallery upload helper usage
- [ ] Add `getMemorialUrl()` configuration helper

### Public memorial app

- [ ] Add API helper and payload types
- [ ] Replace fixture lookup with slug-backed fetch
- [ ] Bind About content and gallery
- [ ] Bind approved condolences
- [ ] Add real contribution form and optional image upload
- [ ] Bind remembrance offers from the API
- [ ] Add inviting offer cards and mock detail/checkout modal
- [ ] Add reliable local offer imagery under `apps/memorial/public/assets/offerings/`
- [ ] Add loading/not-found/error/success states
- [ ] Verify offer completion never creates a payment or real order
- [ ] Add demo `noindex`

### Deployment/docs

- [ ] `.env.example` — new demo environment variables
- [ ] `render.yaml` — demo memorial flag and base URLs
- [ ] `README.md` / `docs/PRODUCT-STATUS.md` — mark memorial as real demo functionality, not productionized

## 13. Explicitly deferred

Do not include these in estimates or block the investor demo on them:

- Real memorial keeper and advocate moderation authority
- Automatic publishing after verified death/release
- Public video playback and public letter decryption
- Search and SEO indexing
- Real billing, expiry, renewal, partner checkout, order creation, and fulfillment
- Offer targeting, revenue-share accounting, sponsor analytics, and conversion tracking
- Email notifications for new contributions
- CAPTCHA, spam scoring, profanity systems, reporting queues, and appeals
- Virus scanning, EXIF stripping, image transformations, and storage migration
- Contributor accounts or email verification
- Granular audit/compliance controls
- High availability, queues, CDN strategy, deletion/export workflows, and legal policy work
- Production accessibility certification and cross-browser matrix

These belong in the future productionization plan after funding and product validation.

## 14. Suggested delivery sequence

1. **Foundation:** schema, Hasura metadata, blank memorial backfill, public read endpoint.
2. **Per-user public page:** slug fetch, real profile/about/gallery rendering, not-found state.
3. **Owner tools:** real settings, gallery upload, message visibility, manual publish/hide.
4. **Visitor loop:** contribution form, optional image, pending insert, moderation, approved feed.
5. **Remembrance offers:** seeded partners, real-looking cards, respectful placement, mock detail/checkout interaction.
6. **Demo readiness:** three test users, persistence/isolation checks, responsive polish, Render deployment.

For one developer familiar with the repository, this is approximately a **5-7 focused development-day demo increment**, excluding unrelated delivery/video/email defects and excluding production hardening.
