import { useEffect, useState } from "react";
import { gql, postIdempotent } from "../lib/api.js";
import { useAccountContext } from "../lib/account-context.js";
interface Props {
  id: string;
  audience: "public" | "private";
  onSaved: (audience: "public" | "private") => void;
}
interface Contact {
  id: string;
  full_name: string;
  email: string | null;
}
export function MessageAudienceEditor({ id, audience, onSaved }: Props) {
  const context = useAccountContext();
  const [editing, setEditing] = useState(false),
    [choice, setChoice] = useState(audience);
  const [contacts, setContacts] = useState<Contact[]>([]),
    [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!editing) return;
    let active = true;
    setLoading(true);
    setNote("");
    setChoice(audience);
    gql<{ app_contacts: Contact[]; app_message_recipients: { contact_id: string }[] }>(
      `query Audience($id:uuid!){app_contacts{ id full_name email } app_message_recipients(where:{message_id:{_eq:$id}}){contact_id}}`,
      { id },
    )
      .then((d) => {
        if (active) {
          setContacts(d.app_contacts);
          setSelected(d.app_message_recipients.map((r) => r.contact_id));
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setNote("Could not load recipients. Close and try again.");
      });
    return () => {
      active = false;
    };
  }, [editing, id, audience]);
  if (
    !context ||
    context.administrator ||
    !["active_sealed", "onboarding"].includes(context.status.accountState)
  )
    return (
      <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
        Audience is read-only during verification and after passing.
      </p>
    );
  async function save() {
    setBusy(true);
    setNote("");
    try {
      await postIdempotent(`/api/messages/${id}/audience`, {
        audienceType: choice,
        contactIds: selected,
      });
      onSaved(choice);
      setEditing(false);
      setNote("Audience updated.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      style={{
        margin: "20px 0",
        padding: 20,
        border: "1px solid var(--line)",
        background: "var(--surface)",
        borderRadius: 14,
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}
      >
        <div>
          <strong>Message audience</strong>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "5px 0" }}>
            {audience === "public"
              ? "Public — contacts on your Public list"
              : "Private — selected recipients only"}
          </p>
        </div>
        <button className="ll-btn secondary" disabled={busy} onClick={() => setEditing(!editing)}>
          {editing ? "Cancel" : "Change Public / Private"}
        </button>
      </div>
      {editing && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 20 }}>
            {(["public", "private"] as const).map((v) => (
              <label key={v}>
                <input
                  type="radio"
                  checked={choice === v}
                  disabled={busy}
                  onChange={() => setChoice(v)}
                />{" "}
                {v === "public" ? "Public" : "Private"}
              </label>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {choice === "public"
              ? "Available to everyone on your Public contact list when released. This does not automatically publish it on your memorial."
              : "Only the people selected below receive this message. Switching to Private also removes it from the public memorial."}
          </p>
          {loading && <p>Loading recipients…</p>}
          {choice === "private" &&
            !loading &&
            contacts
              .filter((c) => c.email)
              .map((c) => (
                <label key={c.id} style={{ display: "block", padding: "6px 0" }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    disabled={busy}
                    onChange={(e) =>
                      setSelected((ids) =>
                        e.target.checked ? [...ids, c.id] : ids.filter((x) => x !== c.id),
                      )
                    }
                  />{" "}
                  {c.full_name}{" "}
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.email}</span>
                </label>
              ))}
          {choice === "private" && !loading && !contacts.some((c) => c.email) && (
            <p>Add a contact with an email address first.</p>
          )}
          <button
            className="ll-btn grad"
            style={{ marginTop: 14 }}
            disabled={busy || loading || (choice === "private" && !selected.length)}
            onClick={save}
          >
            {busy ? "Saving…" : "Save audience"}
          </button>
        </div>
      )}
      {note && (
        <p role="status" style={{ fontSize: 13 }}>
          {note}
        </p>
      )}
    </section>
  );
}
