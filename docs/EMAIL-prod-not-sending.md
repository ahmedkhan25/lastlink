# Production email is not sending — diagnosis & fix

**Date:** 2026-07-20 · **Severity:** high (advocate invites & recipient notifications never arrive) · **Type:** configuration, not code

## Symptom

Emails to real advocates/recipients never arrive in production. The app doesn't crash — sends fail silently and are logged.

## Root cause (confirmed in Render logs)

`lastlink-web` (which hosts the Express API) logs, repeatedly:

```
[notifications] resend error → Mhgoldie1@icloud.com: You can only send testing emails to
your own email address (ahmedkhan25@gmail.com). To send emails to other recipients, please
verify a domain at resend.com/domains, and change the `from` address to an email using this domain.
```

Two facts combine:

1. **`RESEND_API_KEY` is set** (the code is calling Resend, not the log-sink fallback) — but the key's Resend account **has no verified sending domain**.
2. **`RESEND_FROM` is not set.** `render.yaml` declares only `RESEND_API_KEY` (line ~138); it never declares `RESEND_FROM`. So the API falls back to the default in `apps/api/src/env.ts:40`:
   ```
   RESEND_FROM: process.env.RESEND_FROM ?? "LastLink <onboarding@resend.dev>"
   ```
   `onboarding@resend.dev` is Resend's shared test sender.

With an unverified domain, **Resend only allows delivery to the account owner's own address** (`ahmedkhan25@gmail.com`) and **rejects every other recipient with a 403**. Real people (`Mhgoldie1@icloud.com`, `allietexascutie@gmail.com`, test users) were all silently blocked. The code handles the error gracefully (`packages/notifications/src/index.ts` logs and returns `{error}`), so nothing surfaces to the user.

This is exactly the caveat `docs/PRODUCT-STATUS.md` flagged ("dev-tier Resend key, no verified domain — real emails only land in one test inbox"), now actively blocking every real send.

## Fix (three steps — needs Resend + DNS access)

1. **Verify a sending domain on Resend** — `resend.com/domains`. Architecture §11.2 wants `notify.lastlink.com` (transactional). Add the SPF / DKIM / DMARC DNS records Resend generates at the registrar. If `lastlink.com` isn't provisioned yet, verify any domain you already control (a subdomain is fine) to unblock immediately.
2. **Set `RESEND_FROM`** on the `lastlink-web` service to an address on that verified domain, e.g. `LastLink <notify@notify.lastlink.com>`. Also add it to `render.yaml` so it's not lost on the next blueprint sync:
   ```yaml
   - key: RESEND_FROM
     value: LastLink <notify@notify.lastlink.com>
   ```
3. **Redeploy** `lastlink-web` so the new env is picked up, then send one live test to a non-owner address and confirm a `200`/message-id in the logs instead of the 403.

## Notes

- No code change is required. The `env.ts` default (`onboarding@resend.dev`) is fine for local/demo but should never be the production sender — consider making the app **refuse to boot in production** if `RESEND_FROM` is unset or points at `resend.dev`, so this can't silently regress.
- SMS is unaffected (Twilio is out of scope for this increment — `packages/notifications/src/index.ts` is email-only today).
- Ties into the standing infra dependency (arch §4.3): custom domains are needed for auth cookies *and* email deliverability. Verifying `notify.lastlink.com` serves both.
