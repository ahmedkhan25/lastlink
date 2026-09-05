# Post-passing account administration

Scope: show factual verification/release status on the owner dashboard and give
each accepted, confirming advocate access to the SAME dashboard and memorial/contact screens, visibly identified as Account administrator.

- Show reported passing date separately from confirmation and release timestamps.
- Use actual case confirmations, not advocate invitation acceptances.
- Show per-recipient email status; provider acceptance is not inbox delivery.
- Email each advocate after release; allow fresh links from the advocate login.
- Administrator links are purpose-scoped, expire after one hour, and are stored
  only as hashes. Validate current advocate membership, both confirmations, the
  released case, and current account state on every request.
- Administrators can review release/delivery records, manage the memorial/gallery,
  approve/hide condolences, and add/archive contacts. Adding a contact explicitly
  offers to send the PUBLIC messages snapshotted in the existing release. Never
  send private messages or subsequently processed/created messages. Archive keeps
  existing delivery records and recipient links intact. They cannot impersonate
  the owner, author/edit/delete messages, change private recipients or advocates,
  reset the demo, or access private message content.
- Existing owner login remains explicitly labelled as owner login; it never
  silently becomes an advocate session.
- No changes to release timing, audience selection, existing message assets, or
  the investor-demo bypass. Existing released accounts can request new links.

UI direction: remembrance-first name/date/photo treatment, followed by practical
memorial and visitor-memory actions. Verification timestamps and email delivery
are quieter operational details. This follows common memorial content conventions
([Ever Loved feature guide](https://support.everloved.com/article/104-what-features-are-available-on-memorial-websites)).

Additional delivery recovery: a database outbox is persisted in the administrator
action transaction. Startup resumes queued work within the provider idempotency
window; the dashboard exposes a scoped retry action for pending/failed sends.
Already accepted/delivered mail is never deliberately resent. Older uncertain
sends require provider reconciliation, not blind retry.

Verification: purpose/expiry/revocation and cross-account denial tests, moderation
idempotency, truthful state rendering, API/SPA builds, live email/provider checks,
and browser screenshots. The repository requires verification/security review.
