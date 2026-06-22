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
  contacts: ["id", "registrant_id", "full_name", "relationship", "location", "email", "phone", "reach_channels", "created_at"],
  contact_groups: ["id", "registrant_id", "name", "is_default", "created_at"],
  messages: ["id", "registrant_id", "group_id", "type", "title", "status", "media_asset_id", "delivery_settings", "created_at", "updated_at"],
  advocates: ["id", "registrant_id", "slot", "full_name", "relationship", "email", "phone", "invite_status", "identity_verified", "invited_at", "accepted_at", "last_login_at"],
  media_assets: ["id", "registrant_id", "mux_playback_id", "playback_policy", "status", "duration_seconds", "caption_status", "static_rendition_status", "thumbnail_ref", "created_at"],
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
(messages.object_relationships = [{ name: "group", using: { foreign_key_constraint_on: "group_id" } }]);

const groups = ownedTable("contact_groups", { writable: true });
groups.array_relationships = [{ name: "members", using: { foreign_key_constraint_on: { table: { schema: "app", name: "contact_group_members" }, column: "group_id" } } }];

// registrants: row created by the auth hook; registrant may read/seal their own.
const registrants: TableMeta = {
  table: { schema: "app", name: "registrants" },
  object_relationships: [],
  select_permissions: [{ role: "registrant", permission: { columns: COLS.registrants, filter: { id: { _eq: "X-Hasura-User-Id" } } } }],
  update_permissions: [{ role: "registrant", permission: { columns: ["legal_name", "dob", "country", "account_state"], filter: { id: { _eq: "X-Hasura-User-Id" } }, check: {} } }],
};

const members: TableMeta = {
  table: { schema: "app", name: "contact_group_members" },
  object_relationships: [
    { name: "contact", using: { foreign_key_constraint_on: "contact_id" } },
    { name: "group", using: { foreign_key_constraint_on: "group_id" } },
  ],
  select_permissions: [{ role: "registrant", permission: { columns: ["group_id", "contact_id"], filter: { group: OWN } } }],
  insert_permissions: [{ role: "registrant", permission: { check: { group: OWN }, columns: ["group_id", "contact_id"] } }],
  delete_permissions: [{ role: "registrant", permission: { filter: { group: OWN } } }],
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
        ownedTable("contacts", { writable: true }),
        groups,
        members,
        messages,
        ownedTable("advocates", { writable: true }),
        ownedTable("media_assets"),
      ],
    },
  ],
};

const res = await fetch(`${ENDPOINT}/v1/metadata`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-hasura-admin-secret": SECRET },
  body: JSON.stringify({ type: "replace_metadata", args: metadata }),
});
const body = await res.text();
console.log(res.ok ? "✓ metadata applied" : "✗ failed", res.status);
console.log(body.slice(0, 800));
