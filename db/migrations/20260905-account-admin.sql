-- Additive, untracked by Hasura: administrator access is Express-only.
alter table app.contacts add column if not exists archived_at timestamptz;
alter table app.deliveries add column if not exists recipient_email text;
update app.deliveries d set recipient_email=c.email from app.contacts c where c.id=d.contact_id and d.recipient_email is null;
create table if not exists app.release_messages (
  release_id uuid not null references app.releases(id) on delete cascade,
  message_id uuid not null references app.messages(id) on delete cascade,
  audience_type text not null check(audience_type in ('public','private')),
  primary key(release_id,message_id)
);
-- Historical releases: only messages demonstrably included in that release.
insert into app.release_messages(release_id,message_id,audience_type)
select distinct d.release_id,d.message_id,m.audience_type from app.deliveries d
join app.messages m on m.id=d.message_id on conflict do nothing;
create table if not exists app.administrator_links (
  id uuid primary key,
  advocate_id uuid not null references app.advocates(id) on delete cascade,
  case_id uuid not null references app.verification_cases(id) on delete cascade,
  token_hash text not null unique,
  request_key text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (advocate_id, request_key)
);
create table if not exists app.administrator_actions (
  link_id uuid not null references app.administrator_links(id) on delete cascade,
  request_key text not null,
  body_hash text not null,
  delivery_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (link_id, request_key)
);
