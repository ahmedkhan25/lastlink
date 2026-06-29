import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "@lastlink/ui";
import { gql } from "../lib/api.js";
import { useConfirm } from "../components/ConfirmProvider.js";

interface Contact {
  id: string;
  full_name: string;
  relationship: string | null;
  location: string | null;
  email: string | null;
  reach_channels: string[];
}

const LIST = `query { app_contacts(order_by: {created_at: asc}) { id full_name relationship location email reach_channels } }`;
const ADD = `mutation Add($full_name: String!, $relationship: String, $email: String) {
  insert_app_contacts_one(object: {full_name: $full_name, relationship: $relationship, email: $email}) { id }
}`;
const REMOVE = `mutation Remove($id: uuid!) { delete_app_contacts_by_pk(id: $id) { id } }`;

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: "", relationship: "", email: "" });
  const confirm = useConfirm();

  async function refresh() {
    const data = await gql<{ app_contacts: Contact[] }>(LIST);
    setContacts(data.app_contacts);
    setLoading(false);
  }
  useEffect(() => {
    let active = true;
    gql<{ app_contacts: Contact[] }>(LIST).then((d) => active && (setContacts(d.app_contacts), setLoading(false)));
    return () => { active = false; };
  }, []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await gql(ADD, { full_name: form.full_name, relationship: form.relationship || null, email: form.email || null });
      setForm({ full_name: "", relationship: "", email: "" });
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not add contact";
      // anonymous role / expired session → bounce to sign in
      if (/not found in type|jwt|unauthor|anonymous/i.test(msg)) {
        setError("Your session expired — please sign in again.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Contact) {
    const ok = await confirm({
      title: `Remove ${c.full_name}?`,
      message: "They'll no longer receive a message from you. You can add them again anytime.",
      confirmLabel: "Remove contact",
      tone: "danger",
    });
    if (!ok) return;
    setContacts((cs) => cs.filter((x) => x.id !== c.id)); // optimistic
    await gql(REMOVE, { id: c.id }).catch(() => {});
    await refresh(); // authoritative reconcile with the DB
  }

  return (
    <div style={{ padding: "56px 64px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 className="serif" style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.01em", margin: 0 }}>Contacts</h1>
      <p style={{ fontSize: 15, color: "var(--ink-3)", margin: "8px 0 28px" }}>
        {loading ? "Loading…" : `${contacts.length} ${contacts.length === 1 ? "person" : "people"}. Each can receive a different message.`}
      </p>

      <form onSubmit={add} style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <input placeholder="Full name (required)" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          style={inputStyle} />
        <input placeholder="Relationship" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}
          style={inputStyle} />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={inputStyle} />
        <button className="ll-btn" type="submit" disabled={busy || !form.full_name.trim()}>
          <Icon name="plus" size={14} color="white" /> {busy ? "Adding…" : "Add contact"}
        </button>
      </form>
      {error && <div style={{ fontSize: 13, color: "var(--err)", marginBottom: 16 }}>{error}</div>}

      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              <th style={th}>Name</th><th style={th}>Relationship</th><th style={th}>Email</th><th style={th}>Reach</th><th style={th} />
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid var(--line-soft)" }}>
                <td style={td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface-2)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 500 }}>{c.full_name.charAt(0)}</div>
                    <span style={{ fontWeight: 500 }}>{c.full_name}</span>
                  </div>
                </td>
                <td style={{ ...td, color: "var(--ink-2)" }}>{c.relationship ?? "—"}</td>
                <td style={{ ...td, color: "var(--ink-3)" }}>{c.email ?? "—"}</td>
                <td style={td}><span className="ll-chip" style={{ fontSize: 11 }}>Email</span></td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button onClick={() => remove(c)} title={`Remove ${c.full_name}`}
                    style={{ background: "none", border: "none", color: "var(--ink-4)", padding: 4, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--err)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-4)")}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {!loading && contacts.length === 0 && (
              <tr><td style={{ ...td, color: "var(--ink-3)" }} colSpan={5}>No contacts yet — add the people you love above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = { padding: "10px 14px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--surface)", fontSize: 14, flex: "1 1 160px" } as const;
const th = { padding: "12px 20px", fontWeight: 500 } as const;
const td = { padding: "14px 20px", fontSize: 14 } as const;
