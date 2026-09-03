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

-- Profile photo (UploadThing URL for now; S3 later). Additive so `db:apply`
-- upgrades existing databases in place.
alter table app.registrants add column if not exists avatar_url text;

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

create table if not exists app.contacts (
  id             uuid primary key default gen_random_uuid(),
  registrant_id  uuid not null references app.registrants(id) on delete cascade,
  full_name      text not null,
  relationship   text,
  location       text,
  email          text,
  phone          text,
  reach_channels text[] not null default '{email}',   -- subset of {email,sms}; demo uses email
  receives_public boolean not null default true,      -- included in Public messages unless deselected
  created_at     timestamptz not null default now()
);

alter table app.contacts add column if not exists receives_public boolean not null default true;

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
  audience_type     text not null default 'public' check (audience_type in ('public','private')),
  type              text not null check (type in ('video','audio','letter')),
  title             text,
  status            text not null default 'draft' check (status in ('draft','ready','failed','released')),
  media_asset_id    uuid references app.media_assets(id),
  body_ciphertext   bytea,                             -- letters: AES-256-GCM ciphertext (local key)
  body_iv           bytea,
  enc_alg           text,                              -- e.g. 'aes-256-gcm'
  enc_key_id        text,                              -- local key version ref (KMS wrap deferred)
  delivery_settings jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table app.messages add column if not exists audience_type text not null default 'public';
do $$ begin
  alter table app.messages drop constraint if exists messages_audience_type_check;
  alter table app.messages add constraint messages_audience_type_check
    check (audience_type in ('public','private'));
end $$;

-- Private messages name their recipients directly. Public messages fan out to
-- contacts whose receives_public flag is on.
create table if not exists app.message_recipients (
  message_id uuid not null references app.messages(id) on delete cascade,
  contact_id uuid not null references app.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, contact_id)
);

-- Preserve existing group-targeted messages when upgrading, then retire the
-- old group model completely. The conditional block is a no-op on fresh DBs.
do $$ begin
  if exists (
    select 1 from information_schema.columns
     where table_schema='app' and table_name='messages' and column_name='group_id'
  ) and to_regclass('app.contact_group_members') is not null then
    insert into app.message_recipients (message_id, contact_id)
    select m.id, gm.contact_id
      from app.messages m
      join app.contact_group_members gm on gm.group_id = m.group_id
    on conflict do nothing;
    update app.messages set audience_type = 'private' where group_id is not null;
  end if;
end $$;
alter table app.messages drop column if exists group_id;
drop table if exists app.contact_group_members;
drop table if exists app.contact_groups;

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
create unique index if not exists advocates_registrant_email_unique
  on app.advocates (registrant_id, lower(email));

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
                     check (status in ('queued','sent','delayed','delivered','bounced','complained','failed')),
  provider_message_id text,
  bounce_reason      text,
  provider_event_type text,
  provider_error      text,
  last_provider_event_at timestamptz,
  sent_at            timestamptz,
  delivered_at       timestamptz,
  opened_at          timestamptz,
  created_at         timestamptz not null default now(),
  unique (release_id, message_id, contact_id, channel) -- idempotent fan-out
);

-- `create table if not exists` does not update checks/columns on an existing
-- installation, so keep these upgrades idempotent for db:apply.
do $$ begin
  alter table app.messages drop constraint if exists messages_status_check;
  alter table app.messages add constraint messages_status_check
    check (status in ('draft','ready','failed','released'));
end $$;

alter table app.deliveries add column if not exists provider_event_type text;
alter table app.deliveries add column if not exists provider_error text;
alter table app.deliveries add column if not exists last_provider_event_at timestamptz;
alter table app.deliveries add column if not exists opened_at timestamptz;
do $$ begin
  alter table app.deliveries drop constraint if exists deliveries_status_check;
  alter table app.deliveries add constraint deliveries_status_check
    check (status in ('queued','sent','delayed','delivered','bounced','complained','failed'));
end $$;

-- Resend retries and can deliver events out of order. Persisting the Svix event
-- id makes webhook processing idempotent; the event timestamp prevents an old
-- `sent` event from regressing a later `delivered`/failure state.
create table if not exists app.provider_webhook_events (
  event_id            text primary key,
  provider            text not null,
  event_type          text not null,
  provider_message_id text,
  provider_event_at   timestamptz not null,
  received_at         timestamptz not null default now()
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

-- FK delete behavior --------------------------------------------------------
-- Make a registrant deletable in one cascade (powers account-delete / test
-- resets). Several child FKs defaulted to NO ACTION, which blocked the cascade.
do $$ begin
  -- confirmations belong to the case; remove with the advocate too
  alter table app.advocate_confirmations drop constraint if exists advocate_confirmations_advocate_id_fkey;
  alter table app.advocate_confirmations add  constraint advocate_confirmations_advocate_id_fkey
    foreign key (advocate_id) references app.advocates(id) on delete cascade;
  -- the initiating advocate is just a reference; keep the case, null the pointer
  alter table app.verification_cases drop constraint if exists verification_cases_initiated_by_fkey;
  alter table app.verification_cases add  constraint verification_cases_initiated_by_fkey
    foreign key (initiated_by) references app.advocates(id) on delete set null;
  -- deliveries are derived; remove with their message/contact
  alter table app.deliveries drop constraint if exists deliveries_message_id_fkey;
  alter table app.deliveries add  constraint deliveries_message_id_fkey
    foreign key (message_id) references app.messages(id) on delete cascade;
  alter table app.deliveries drop constraint if exists deliveries_contact_id_fkey;
  alter table app.deliveries add  constraint deliveries_contact_id_fkey
    foreign key (contact_id) references app.contacts(id) on delete cascade;
  -- break the deliveries<->recipient_tokens cycle on delete
  alter table app.deliveries drop constraint if exists deliveries_recipient_token_fk;
  alter table app.deliveries add  constraint deliveries_recipient_token_fk
    foreign key (recipient_token_id) references app.recipient_tokens(id) on delete set null;
  alter table app.recipient_tokens drop constraint if exists recipient_tokens_contact_id_fkey;
  alter table app.recipient_tokens add  constraint recipient_tokens_contact_id_fkey
    foreign key (contact_id) references app.contacts(id) on delete cascade;
  alter table app.recipient_tokens drop constraint if exists recipient_tokens_message_id_fkey;
  alter table app.recipient_tokens add  constraint recipient_tokens_message_id_fkey
    foreign key (message_id) references app.messages(id) on delete cascade;
end $$;
