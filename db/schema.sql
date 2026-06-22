-- ============================================================================
-- LastLink — database schema (investor-demo increment)
-- Single Neon Postgres, schemas: app / audit / enterprise.
-- Per SKILL.md: text + CHECK constraints (NOT Postgres enums) in non-default
-- schemas; TS unions mirror these in @lastlink/shared.
-- Demo posture: plain audit.event_log (no hash-chain/triggers); letter crypto
-- is local-AES (body_ciphertext/body_iv/enc_*), KMS deferred.
-- Idempotent: safe to re-run.
-- ============================================================================

create schema if not exists app;
create schema if not exists audit;
create schema if not exists enterprise;

-- Generic updated_at trigger ------------------------------------------------
create or replace function app.set_updated_at() returns trigger
  language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============================================================================
-- app — registrant core
-- ============================================================================

create table if not exists app.registrants (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null unique,                 -- Better Auth user.id (FK added post-auth-migration)
  legal_name    text not null,
  dob           date,
  country       text,
  plan          text not null default 'free'   check (plan in ('free','premium')),
  account_state text not null default 'onboarding'
                check (account_state in ('onboarding','active_sealed','in_verification','released','closed')),
  sealed_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists app.identity_verifications (
  id            uuid primary key default gen_random_uuid(),
  registrant_id uuid not null references app.registrants(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  vendor        text,
  vendor_ref    text,
  gov_id_ref    text,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists app.contact_groups (
  id            uuid primary key default gen_random_uuid(),
  registrant_id uuid not null references app.registrants(id) on delete cascade,
  name          text not null,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists app.contacts (
  id             uuid primary key default gen_random_uuid(),
  registrant_id  uuid not null references app.registrants(id) on delete cascade,
  full_name      text not null,
  relationship   text,
  location       text,
  email          text,
  phone          text,
  reach_channels text[] not null default '{email}',   -- subset of {email,sms}; demo uses email
  created_at     timestamptz not null default now()
);

create table if not exists app.contact_group_members (
  group_id   uuid not null references app.contact_groups(id) on delete cascade,
  contact_id uuid not null references app.contacts(id) on delete cascade,
  primary key (group_id, contact_id)
);

create table if not exists app.media_assets (
  id                      uuid primary key default gen_random_uuid(),
  registrant_id           uuid not null references app.registrants(id) on delete cascade,
  mux_upload_id           text,
  mux_asset_id            text,
  mux_playback_id         text,                        -- signed policy
  playback_policy         text not null default 'signed',
  status                  text not null default 'waiting'
                          check (status in ('waiting','processing','ready','errored')),
  duration_seconds        integer,
  caption_status          text default 'pending' check (caption_status in ('pending','ready','errored')),
  static_rendition_status text default 'pending' check (static_rendition_status in ('pending','ready','errored')),
  thumbnail_ref           text,
  errored_reason          text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists media_assets_asset_idx  on app.media_assets (mux_asset_id);
create index if not exists media_assets_upload_idx on app.media_assets (mux_upload_id);

create table if not exists app.messages (
  id                uuid primary key default gen_random_uuid(),
  registrant_id     uuid not null references app.registrants(id) on delete cascade,
  group_id          uuid references app.contact_groups(id) on delete set null,
  type              text not null check (type in ('video','audio','letter')),
  title             text,
  status            text not null default 'draft' check (status in ('draft','ready','released')),
  media_asset_id    uuid references app.media_assets(id),
  body_ciphertext   bytea,                             -- letters: AES-256-GCM ciphertext (local key)
  body_iv           bytea,
  enc_alg           text,                              -- e.g. 'aes-256-gcm'
  enc_key_id        text,                              -- local key version ref (KMS wrap deferred)
  delivery_settings jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================================
-- app — advocates, verification, release, delivery
-- ============================================================================

create table if not exists app.advocates (
  id                uuid primary key default gen_random_uuid(),
  registrant_id     uuid not null references app.registrants(id) on delete cascade,
  slot              text not null check (slot in ('A','B')),
  full_name         text not null,
  relationship      text,
  email             text not null,
  phone             text,
  invite_status     text not null default 'pending' check (invite_status in ('pending','accepted','declined')),
  identity_verified boolean not null default false,
  invited_at        timestamptz not null default now(),
  accepted_at       timestamptz,
  last_login_at     timestamptz,
  unique (registrant_id, slot)
);

create table if not exists app.verification_cases (
  id                    uuid primary key default gen_random_uuid(),
  registrant_id         uuid not null references app.registrants(id) on delete cascade,
  state                 text not null default 'initiated'
                        check (state in ('initiated','awaiting_second','both_confirmed','safety_hold',
                                         'release_authorized','releasing','released','cancelled','disputed')),
  initiated_by          uuid references app.advocates(id),
  reported_dod          date,
  death_certificate_ref text,
  hold_started_at       timestamptz,
  hold_expires_at       timestamptz,
  release_authorized_at timestamptz,
  released_at           timestamptz,
  cancelled_at          timestamptz,
  cancel_reason         text,
  pgboss_release_job_id text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
-- only one active (non-terminal) case per registrant
create unique index if not exists one_active_case
  on app.verification_cases (registrant_id)
  where state not in ('released','cancelled');

create table if not exists app.advocate_confirmations (
  id                uuid primary key default gen_random_uuid(),
  case_id           uuid not null references app.verification_cases(id) on delete cascade,
  advocate_id       uuid not null references app.advocates(id),
  identity_check    jsonb not null default '{}',
  confirmed_details jsonb not null default '{}',
  decision          text not null check (decision in ('confirm','dispute','decline')),
  ip                inet,
  user_agent        text,
  created_at        timestamptz not null default now(),
  unique (case_id, advocate_id)
);

create table if not exists app.releases (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references app.verification_cases(id) on delete cascade,
  registrant_id uuid not null references app.registrants(id) on delete cascade,
  status        text not null default 'in_progress' check (status in ('in_progress','complete')),
  started_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create table if not exists app.deliveries (
  id                 uuid primary key default gen_random_uuid(),
  release_id         uuid not null references app.releases(id) on delete cascade,
  message_id         uuid not null references app.messages(id),
  contact_id         uuid not null references app.contacts(id),
  channel            text not null check (channel in ('email','sms')),
  recipient_token_id uuid,                             -- FK added after recipient_tokens
  status             text not null default 'queued'
                     check (status in ('queued','sent','delivered','bounced','failed')),
  provider_message_id text,
  bounce_reason      text,
  sent_at            timestamptz,
  delivered_at       timestamptz,
  created_at         timestamptz not null default now(),
  unique (release_id, message_id, contact_id, channel) -- idempotent fan-out
);

create table if not exists app.recipient_tokens (
  id                uuid primary key default gen_random_uuid(),
  delivery_id       uuid not null references app.deliveries(id) on delete cascade,
  contact_id        uuid not null references app.contacts(id),
  message_id        uuid not null references app.messages(id),
  token_hash        text not null,                     -- store hash, never raw
  expires_at        timestamptz not null,
  revoked           boolean not null default false,
  last_validated_at timestamptz,
  created_at        timestamptz not null default now()
);
do $$ begin
  alter table app.deliveries
    add constraint deliveries_recipient_token_fk
    foreign key (recipient_token_id) references app.recipient_tokens(id);
exception when duplicate_object then null; end $$;

-- ============================================================================
-- app — offerings (visual-only at demo; no Stripe)
-- ============================================================================

create table if not exists app.partners (
  id                          uuid primary key default gen_random_uuid(),
  name                        text not null,
  type                        text not null check (type in ('florist','charity','memorial')),
  stripe_connected_account_id text,
  created_at                  timestamptz not null default now()
);

create table if not exists app.offerings (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid references app.partners(id),
  kind        text not null check (kind in ('flowers','donation','memorial')),
  title       text not null,
  description text,
  active      boolean not null default true
);

-- ============================================================================
-- enterprise
-- ============================================================================

create table if not exists enterprise.organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  employee_count integer,
  sso_config     jsonb,
  created_at     timestamptz not null default now()
);

create table if not exists enterprise.org_admins (
  id      uuid primary key default gen_random_uuid(),
  org_id  uuid not null references enterprise.organizations(id) on delete cascade,
  user_id text not null,
  role    text not null default 'case_handler' check (role in ('super_admin','case_handler'))
);

create table if not exists enterprise.employees (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references enterprise.organizations(id) on delete cascade,
  full_name  text not null,
  department text,
  created_at timestamptz not null default now()
);

create table if not exists enterprise.enterprise_cases (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references enterprise.organizations(id) on delete cascade,
  employee_id           uuid not null references enterprise.employees(id),
  case_ref              text,                          -- e.g. LL-2026-0418
  reported_by           text,
  stage                 text not null default 'identity_verification'
                        check (stage in ('identity_verification','advocate_review','verified_delivering','resolved')),
  reach_count           integer default 0,
  first_notification_at timestamptz,
  started_at            timestamptz not null default now(),
  timeline              jsonb not null default '[]'
);

-- ============================================================================
-- audit — plain event log (hash-chain + append-only triggers DEFERRED)
-- ============================================================================

create table if not exists audit.event_log (
  id          bigserial primary key,
  occurred_at timestamptz not null default now(),
  actor_type  text not null,                           -- registrant|advocate|recipient|org_admin|system
  actor_id    text,
  action      text not null,                           -- e.g. advocate.confirmed, case.released
  entity_type text,
  entity_id   text,
  data        jsonb,
  request_id  text,
  ip          inet,
  user_agent  text
);
create index if not exists event_log_entity_idx on audit.event_log (entity_type, entity_id);
create index if not exists event_log_action_idx on audit.event_log (action);

-- updated_at triggers --------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['app.registrants','app.media_assets','app.messages','app.verification_cases']
  loop
    execute format('drop trigger if exists set_updated_at on %s', t);
    execute format('create trigger set_updated_at before update on %s for each row execute function app.set_updated_at()', t);
  end loop;
end $$;
