import type { Request, Response } from "express";
import { pool, query } from "./db.js";
import { requireRegistrant } from "./auth.js";
import { logEvent } from "./audit.js";

// Contact import from a connected Google account.
//
// DEMO ONLY (gated by DEMO_CONTACT_IMPORT=true). There is no real OAuth here:
// the "connect" step is simulated and the people below are a fixed directory of
// test users on lastlink.care, so an import can be demoed end-to-end without
// touching anyone's real address book. The SHAPE is the real one though —
// preview (dedupe against what you already have) then commit (what you ticked) —
// so swapping in the Google People API means replacing `DIRECTORY` with a fetch,
// not rewriting the flow. That API returns names and emails under the
// contacts.readonly scope, which is exactly the shape modelled here.
//
// `Provider` stays a union of one so adding a second source later is a directory
// entry plus a card, not a refactor.

type Provider = "google";

interface DirectoryEntry {
  external_id: string;
  full_name: string;
  email: string;
  relationship: string;
  group: string;
}

interface Directory {
  label: string;
  account: string;
  contacts: DirectoryEntry[];
}

// A real address book is mixed, so this one is too: family, friends and work in
// one list, which is what makes the group assignment on import worth watching.
const DIRECTORY: Record<Provider, Directory> = {
  google: {
    label: "Google Contacts",
    account: "daniel.rourke@lastlink.care",
    contacts: [
      { external_id: "g-101", full_name: "Marcus Ellery", email: "marcus.ellery@lastlink.care", relationship: "Brother", group: "Family" },
      { external_id: "g-102", full_name: "Grace Abernathy", email: "grace.abernathy@lastlink.care", relationship: "Aunt", group: "Family" },
      { external_id: "g-103", full_name: "Ruth Calloway", email: "ruth.calloway@lastlink.care", relationship: "Godmother", group: "Family" },
      { external_id: "g-104", full_name: "Amara Diallo", email: "amara.diallo@lastlink.care", relationship: "Cousin", group: "Family" },
      { external_id: "g-105", full_name: "Nadia Okonkwo", email: "nadia.okonkwo@lastlink.care", relationship: "College roommate", group: "Close friends" },
      { external_id: "g-106", full_name: "Daniel Osei", email: "daniel.osei@lastlink.care", relationship: "Neighbour", group: "Close friends" },
      { external_id: "g-107", full_name: "Jonah Beckett", email: "jonah.beckett@lastlink.care", relationship: "School friend", group: "Close friends" },
      { external_id: "g-108", full_name: "Felix Moreau", email: "felix.moreau@lastlink.care", relationship: "Cycling club", group: "Close friends" },
      { external_id: "g-109", full_name: "Rosa Puente", email: "rosa.puente@lastlink.care", relationship: "Book club", group: "Close friends" },
      { external_id: "g-110", full_name: "Priya Raman", email: "priya.raman@lastlink.care", relationship: "Business partner", group: "Business" },
      { external_id: "g-111", full_name: "Theo Lindqvist", email: "theo.lindqvist@lastlink.care", relationship: "Accountant", group: "Business" },
      { external_id: "g-112", full_name: "Sam Whitfield", email: "sam.whitfield@lastlink.care", relationship: "Client", group: "Business" },
    ],
  },
};

function readProvider(req: Request): Provider | null {
  const p = String(req.params.provider ?? "").toLowerCase();
  return p === "google" ? p : null;
}

/** Shared gate: demo flag + a signed-in registrant. Returns null once it has responded. */
async function gate(req: Request, res: Response): Promise<{ registrantId: string; userId: string; provider: Provider } | null> {
  if (process.env.DEMO_CONTACT_IMPORT !== "true") {
    res.status(404).json({ error: "not found" });
    return null;
  }
  const provider = readProvider(req);
  if (!provider) {
    res.status(400).json({ error: "unknown provider" });
    return null;
  }
  const who = await requireRegistrant(req.headers);
  if (!who) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return { registrantId: who.registrantId, userId: who.userId, provider };
}

/** Emails this registrant already has, lowercased, for dedupe. */
async function existingEmails(registrantId: string): Promise<Set<string>> {
  const rows = await query<{ email: string | null }>(
    "select email from app.contacts where registrant_id = $1 and email is not null",
    [registrantId],
  );
  return new Set(rows.rows.map((r) => r.email!.trim().toLowerCase()));
}

// GET /api/contacts/import/:provider — what the connected account holds, with
// anyone already in the address book flagged so the UI can pre-deselect them.
export async function previewImport(req: Request, res: Response): Promise<void> {
  const ctx = await gate(req, res);
  if (!ctx) return;

  const dir = DIRECTORY[ctx.provider];
  // A real OAuth round-trip takes a beat; without one the "Connecting…" state
  // flashes past and the demo looks like it read from a local fixture.
  await new Promise((r) => setTimeout(r, 700));
  const have = await existingEmails(ctx.registrantId);
  const contacts = dir.contacts.map((c) => ({ ...c, already: have.has(c.email.toLowerCase()) }));

  res.json({
    provider: ctx.provider,
    label: dir.label,
    account: dir.account,
    contacts,
    newCount: contacts.filter((c) => !c.already).length,
    alreadyCount: contacts.filter((c) => c.already).length,
  });
}

// POST /api/contacts/import/:provider  { externalIds: string[] }
// Writes the chosen people in one transaction: the contact row, the group it
// belongs to (created on first use — nothing else in the app seeds groups), and
// the membership join. Re-importing someone is a no-op rather than a duplicate.
export async function commitImport(req: Request, res: Response): Promise<void> {
  const ctx = await gate(req, res);
  if (!ctx) return;

  const wanted = new Set(
    Array.isArray(req.body?.externalIds) ? (req.body.externalIds as unknown[]).map(String) : [],
  );
  const picked = DIRECTORY[ctx.provider].contacts.filter((c) => wanted.has(c.external_id));
  if (picked.length === 0) {
    res.status(400).json({ error: "no contacts selected" });
    return;
  }

  const have = await existingEmails(ctx.registrantId);
  const fresh = picked.filter((c) => !have.has(c.email.toLowerCase()));

  const client = await pool.connect();
  const groupIds = new Map<string, string>();
  let imported = 0;
  try {
    await client.query("begin");

    for (const c of fresh) {
      const contact = await client.query<{ id: string }>(
        `insert into app.contacts (registrant_id, full_name, relationship, email, reach_channels)
         values ($1, $2, $3, $4, '{email}') returning id`,
        [ctx.registrantId, c.full_name, c.relationship, c.email],
      );

      let groupId = groupIds.get(c.group);
      if (!groupId) {
        // Look before inserting: the registrant may already have this group from
        // an earlier import, and there's no unique constraint to upsert against.
        const found = await client.query<{ id: string }>(
          "select id from app.contact_groups where registrant_id = $1 and name = $2 limit 1",
          [ctx.registrantId, c.group],
        );
        groupId =
          found.rows[0]?.id ??
          (
            await client.query<{ id: string }>(
              "insert into app.contact_groups (registrant_id, name) values ($1, $2) returning id",
              [ctx.registrantId, c.group],
            )
          ).rows[0]!.id;
        groupIds.set(c.group, groupId);
      }

      await client.query(
        `insert into app.contact_group_members (group_id, contact_id)
         values ($1, $2) on conflict do nothing`,
        [groupId, contact.rows[0]!.id],
      );
      imported++;
    }

    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  await logEvent({
    actorType: "registrant",
    actorId: ctx.userId,
    action: "contacts.imported",
    entityType: "registrant",
    entityId: ctx.registrantId,
    data: { provider: ctx.provider, imported, skipped: picked.length - fresh.length },
  });

  res.json({
    ok: true,
    imported,
    skipped: picked.length - fresh.length,
    groups: [...groupIds.keys()],
  });
}
