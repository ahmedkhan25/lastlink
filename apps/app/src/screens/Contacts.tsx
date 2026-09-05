import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@lastlink/ui";
import { gql, manageAccount } from "../lib/api.js";
import { isAdministrator } from "../lib/administrator.js";
import { useAccountContext } from "../lib/account-context.js";
import { useConfirm } from "../components/ConfirmProvider.js";

interface Contact {
  id: string;
  full_name: string;
  relationship: string | null;
  location: string | null;
  email: string | null;
  reach_channels: string[];
  receives_public: boolean;
}

const LIST = `query { app_contacts(order_by: {created_at: asc}) { id full_name relationship location email reach_channels receives_public } }`;
const ADD = `mutation Add($full_name: String!, $relationship: String, $email: String) {
  insert_app_contacts_one(object: {full_name: $full_name, relationship: $relationship, email: $email}) { id }
}`;
const REMOVE = `mutation Remove($id: uuid!) { delete_app_contacts_by_pk(id: $id) { id } }`;
const SET_PUBLIC = `mutation SetPublic($id: uuid!, $enabled: Boolean!) {
  update_app_contacts_by_pk(pk_columns: {id: $id}, _set: {receives_public: $enabled}) { id receives_public }
}`;

export function Contacts() {
  const admin=isAdministrator();
  const account=useAccountContext();
  const [notifyPublic,setNotifyPublic]=useState(true);
  const [sentNote,setSentNote]=useState("");
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
      if(admin) {const result=await manageAccount({action:"contact-add",name:form.full_name,relationship:form.relationship,email:form.email,notifyPublic});setSentNote(result.emails.failed ? `Contact added. ${result.emails.failed} email(s) could not be sent; check delivery status.` : `Contact added. ${result.emails.accepted} public message email(s) sent.`);}
      else await gql(ADD, { full_name: form.full_name, relationship: form.relationship || null, email: form.email || null });
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
      message: admin ? "Remove this person from the active contact list? Previously released messages and delivery records will be preserved." : "They'll no longer receive a message from you. You can add them again anytime.",
      confirmLabel: "Remove contact",
      tone: "danger",
    });
    if (!ok) return;
    setContacts((cs) => cs.filter((x) => x.id !== c.id)); // optimistic
    try { if(admin) await manageAccount({action:"contact-remove",id:c.id}); else await gql(REMOVE, { id: c.id }); }
    catch(e) { setError(e instanceof Error ? e.message : "Could not remove contact"); }
    await refresh(); // authoritative reconcile with the DB
  }

  async function setPublic(c: Contact, enabled: boolean) {
    setContacts((items) => items.map((item) => item.id === c.id ? { ...item, receives_public: enabled } : item));
    try {
      await gql(SET_PUBLIC, { id: c.id, enabled });
    } catch {
      setContacts((items) => items.map((item) => item.id === c.id ? { ...item, receives_public: !enabled } : item));
      setError(`Could not update ${c.full_name}'s Public setting.`);
    }
  }

  return (
    <div style={{ padding: "56px 64px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <h1 className="serif" style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.01em", margin: 0 }}>Contacts</h1>
        {!admin && <Link to="/contacts/import" className="ll-btn secondary" style={{ textDecoration: "none" }}>
          <Icon name="users" size={15} color="var(--ink)" /> Import
        </Link>}
      </div>
      <p style={{ fontSize: 15, color: "var(--ink-3)", margin: "8px 0 28px" }}>
        {loading ? "Loading…" : admin ? `${contacts.length} contacts. Add someone who was missed and send them the released Public messages. Private messages keep their original recipients.` : `${contacts.length} ${contacts.length === 1 ? "person" : "people"}. Public is selected by default; turn it off for anyone who should receive only private messages.`}
      </p>

      <form onSubmit={add} style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <input placeholder="Full name (required)" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          style={inputStyle} />
        <input placeholder="Relationship" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}
          style={inputStyle} />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={inputStyle} />
        <button className="ll-btn" type="submit" disabled={busy || !form.full_name.trim()}>
          <Icon name="plus" size={14} color="white" /> {busy ? "Adding…" : admin && notifyPublic ? "Add contact & send public messages" : "Add contact"}
        </button>
      </form>
      {admin && <label style={{display:"block",fontSize:13,marginBottom:16}}><input type="checkbox" checked={notifyPublic} disabled={busy} onChange={e=>setNotifyPublic(e.target.checked)} /> Send already released Public messages to this contact. No private messages will be sent.</label>}
      {admin && notifyPublic && <p style={{fontSize:13,color:"var(--ink-3)"}}>Messages to send ({account?.status.publicMessages.length ?? 0}): {account?.status.publicMessages.map(m=>`${m.title || "Untitled"} (${m.type})`).join("; ") || "No public messages in this release."}</p>}
      {sentNote && <p role="status">{sentNote}</p>}
      {error && <div style={{ fontSize: 13, color: "var(--err)", marginBottom: 16 }}>{error}</div>}

      <div className="max-md:[&_thead]:hidden max-md:[&_table]:block max-md:[&_tbody]:block max-md:[&_tr]:grid max-md:[&_tr]:grid-cols-1 max-md:[&_td]:block max-md:[&_td]:!px-4 max-md:[&_td]:!py-2" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              <th style={th}>Name</th><th style={th}>Relationship</th><th style={th}>Email</th><th style={th}>Public</th><th style={th} />
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
                <td style={td}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox" disabled={admin} checked={c.receives_public} onChange={(e) => void setPublic(c, e.target.checked)} />
                    {c.receives_public ? "Included" : "Private only"}
                  </label>
                </td>
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
