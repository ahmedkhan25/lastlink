// Tracks the app tables and applies `registrant` role permissions (RLS by
// X-Hasura-User-Id = registrants.id). Idempotent-ish: runs replace_metadata
// so re-running overwrites cleanly. Letter ciphertext columns are NEVER
// exposed to any role (kept law). Run: tsx scripts/hasura-setup.ts
// Reads env from the process (source .env before running: `set -a; . ./.env; set +a`).
const ENDPOINT = (process.env.HASURA_GRAPHQL_ENDPOINT ?? "http://localhost:8080/v1/graphql").replace("/v1/graphql", "");
const SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET ?? "";

const OWN = { registrant_id: { _eq: "X-Hasura-User-Id" } };
const INSERT_SET = { registrant_id: "X-Hasura-User-Id" };

// columns visible to the registrant per table (messages excludes ciphertext)
const COLS = {
  registrants: ["id", "legal_name", "dob", "country", "plan", "account_state", "sealed_at", "created_at"],
  contacts: ["id", "registrant_id", "full_name", "relationship", "location", "email", "phone", "reach_channels", "receives_public", "created_at"],
  messages: ["id", "registrant_id", "audience_type", "type", "title", "status", "media_asset_id", "delivery_settings", "visible_on_memorial", "created_at", "updated_at"],
  advocates: ["id", "registrant_id", "slot", "full_name", "relationship", "email", "phone", "invite_status", "identity_verified", "invited_at", "accepted_at", "last_login_at"],
  media_assets: ["id", "registrant_id", "mux_playback_id", "playback_policy", "status", "duration_seconds", "caption_status", "static_rendition_status", "thumbnail_ref", "created_at"],
  memorials: ["id", "registrant_id", "slug", "status", "visibility", "headline", "location", "birth_year", "death_year", "quote", "story", "service_when", "service_details", "published_at", "created_at", "updated_at"],
  memorial_media: ["id", "memorial_id", "url", "file_key", "caption", "alt_text", "sort_order", "created_at"],
  condolences: ["id", "memorial_id", "author_name", "author_email", "relationship", "body", "image_url", "image_key", "status", "created_at", "reviewed_at"],
};

interface TableMeta {
  table: { schema: string; name: string };
  array_relationships?: unknown[];
  object_relationships?: unknown[];
  select_permissions: unknown[];
  insert_permissions?: unknown[];
  update_permissions?: unknown[];
  delete_permissions?: unknown[];
}

function ownedTable(name: keyof typeof COLS, opts: { writable?: boolean; filter?: unknown } = {}): TableMeta {
  const filter = opts.filter ?? OWN;
  const columns = COLS[name];
  const t: TableMeta = {
    table: { schema: "app", name },
    select_permissions: [{ role: "registrant", permission: { columns, filter } }],
  };
  if (opts.writable) {
    t.insert_permissions = [{ role: "registrant", permission: { check: {}, set: INSERT_SET, columns: columns.filter((c) => c !== "id" && c !== "registrant_id" && c !== "created_at") } }];
    t.update_permissions = [{ role: "registrant", permission: { columns: columns.filter((c) => c !== "id" && c !== "registrant_id"), filter, check: {} } }];
    t.delete_permissions = [{ role: "registrant", permission: { filter } }];
  }
  return t;
}

const messages = ownedTable("messages", { writable: true });
messages.object_relationships = [{ name: "registrant", using: { foreign_key_constraint_on: "registrant_id" } }];
messages.delete_permissions = [{ role: "registrant", permission: { filter: { ...OWN, registrant: { account_state: { _in: ["onboarding", "active_sealed"] } } } } }];
(messages.array_relationships = [{ name: "recipients", using: { foreign_key_constraint_on: { table: { schema: "app", name: "message_recipients" }, column: "message_id" } } }]);
// Message creation and audience assignment are transactional API operations.
// Hasura remains the read/delete path for the registrant dashboard.
delete messages.insert_permissions;
delete messages.update_permissions;

// Advocate creation is validated by POST /api/advocates (including the
// self-advocate check). Keep update/delete for account management, but do not
// expose a direct Hasura insert path that bypasses those checks.
const advocates = ownedTable("advocates", { writable: true });
delete advocates.insert_permissions;

// registrants: row created by the auth hook; registrant may read/seal their own.
const registrants: TableMeta = {
  table: { schema: "app", name: "registrants" },
  object_relationships: [{ name: "memorial", using: { manual_configuration: { remote_table: { schema: "app", name: "memorials" }, column_mapping: { id: "registrant_id" } } } }],
  select_permissions: [{ role: "registrant", permission: { columns: COLS.registrants, filter: { id: { _eq: "X-Hasura-User-Id" } } } }],
  update_permissions: [{ role: "registrant", permission: { columns: ["legal_name", "dob", "country"], filter: { id: { _eq: "X-Hasura-User-Id" } }, check: {} } }],
};

const memorials: TableMeta = {
  table: { schema: "app", name: "memorials" },
  object_relationships: [{ name: "registrant", using: { foreign_key_constraint_on: "registrant_id" } }],
  array_relationships: [
    { name: "media", using: { foreign_key_constraint_on: { table: { schema: "app", name: "memorial_media" }, column: "memorial_id" } } },
    { name: "condolences", using: { foreign_key_constraint_on: { table: { schema: "app", name: "condolences" }, column: "memorial_id" } } },
  ],
  select_permissions: [{ role: "registrant", permission: { columns: COLS.memorials, filter: OWN } }],
  update_permissions: [{
    role: "registrant",
    permission: {
      columns: ["visibility", "headline", "location", "birth_year", "death_year", "quote", "story", "service_when", "service_details"],
      filter: OWN,
      check: OWN,
    },
  }],
};

const memorialMedia: TableMeta = {
  table: { schema: "app", name: "memorial_media" },
  object_relationships: [{ name: "memorial", using: { foreign_key_constraint_on: "memorial_id" } }],
  select_permissions: [{ role: "registrant", permission: { columns: COLS.memorial_media, filter: { memorial: OWN } } }],
  insert_permissions: [{ role: "registrant", permission: { columns: ["memorial_id", "url", "file_key", "caption", "alt_text", "sort_order"], check: { memorial: OWN } } }],
  update_permissions: [{ role: "registrant", permission: { columns: ["caption", "alt_text", "sort_order"], filter: { memorial: OWN }, check: { memorial: OWN } } }],
  delete_permissions: [{ role: "registrant", permission: { filter: { memorial: OWN } } }],
};

const condolences: TableMeta = {
  table: { schema: "app", name: "condolences" },
  object_relationships: [{ name: "memorial", using: { foreign_key_constraint_on: "memorial_id" } }],
  select_permissions: [{ role: "registrant", permission: { columns: COLS.condolences, filter: { memorial: OWN } } }],
  update_permissions: [{ role: "registrant", permission: { columns: ["status", "reviewed_at"], filter: { memorial: OWN }, check: { memorial: OWN } } }],
};

const messageRecipients: TableMeta = {
  table: { schema: "app", name: "message_recipients" },
  object_relationships: [
    { name: "contact", using: { foreign_key_constraint_on: "contact_id" } },
    { name: "message", using: { foreign_key_constraint_on: "message_id" } },
  ],
  select_permissions: [{ role: "registrant", permission: { columns: ["message_id", "contact_id", "created_at"], filter: { message: OWN } } }],
};

const metadata = {
  version: 3,
  sources: [
    {
      name: "default",
      kind: "postgres",
      configuration: { connection_info: { database_url: { from_env: "HASURA_GRAPHQL_DATABASE_URL" }, isolation_level: "read-committed", use_prepared_statements: true } },
      tables: [
        registrants,
        ownedTable("contacts", { writable: true, filter: { ...OWN, archived_at: { _is_null: true } } }),
        messages,
        messageRecipients,
        advocates,
        ownedTable("media_assets"),
        memorials,
        memorialMedia,
        condolences,
      ],
    },
  ],
};

// Same screens, different capabilities: administrators only read through
// Hasura. Scoped Express actions handle memorial and contact management.
for (const table of metadata.sources[0]!.tables) {
  for (const entry of [...table.select_permissions] as { role: string; permission: unknown }[]) {
    if (entry.role === "registrant") table.select_permissions.push({ role: "advocate", permission: entry.permission });
  }
}

const res = await fetch(`${ENDPOINT}/v1/metadata`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-hasura-admin-secret": SECRET },
  body: JSON.stringify({ type: "replace_metadata", args: metadata }),
});
const body = await res.text();
console.log(res.ok ? "✓ metadata applied" : "✗ failed", res.status);
console.log(body.slice(0, 800));
