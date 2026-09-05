import { useEffect, useState } from "react";
import { Icon } from "@lastlink/ui";
import { gql, getApiUrl } from "../lib/api.js";
import { VideoComposer } from "./VideoComposer.js";

interface Contact { id: string; full_name: string; email: string | null; receives_public: boolean }
type AudienceType = "public" | "private";
type Tab = "video" | "audio" | "letter";

const CONTACTS = `query { app_contacts(order_by: {created_at: asc}) { id full_name email receives_public } }`;

export function Compose() {
  const [tab, setTab] = useState<Tab>("letter");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [audienceType, setAudienceType] = useState<AudienceType>("public");
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [title, setTitle] = useState("A message before goodbye");
  const [body, setBody] = useState("My loves,\n\n");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    gql<{ app_contacts: Contact[] }>(CONTACTS).then((d) => {
      if (!active) return;
      setContacts(d.app_contacts);
    });
    return () => { active = false; };
  }, []);

  async function save() {
    setStatus("saving");
    setErr(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/messages/letter`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body, audienceType, contactIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "save failed");
      setStatus("saved");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "save failed");
      setStatus("error");
    }
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const audienceReady = audienceType === "public" || contactIds.length > 0;

  return (
    <div style={{ padding: "32px 40px 60px", maxWidth: 1100, margin: "0 auto" }}>
      <div className="flex-wrap gap-4" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
            {status === "saved" ? "SAVED · READY" : status === "saving" ? "SAVING…" : "DRAFT"}
          </div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.01em", margin: "4px 0 0" }}>
            Compose a message
          </h1>
        </div>
        {tab === "letter" && (
          <button className="ll-btn grad" onClick={save} disabled={status === "saving" || !body.trim() || !audienceReady}>
            {status === "saved" ? "Saved ✓" : "Save message"}
          </button>
        )}
      </div>

      <div className="max-lg:!grid-cols-1" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", padding: 24 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["video", "audio", "letter"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`ll-btn ${tab === t ? "" : "secondary"}`} style={{ fontSize: 13, padding: "8px 14px", textTransform: "capitalize" }}>
                <Icon name={t === "video" ? "video" : t === "audio" ? "mic" : "pen"} size={14} color={tab === t ? "white" : "var(--ink)"} /> {t}
              </button>
            ))}
          </div>

          {tab === "letter" && (
            <>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
                className="serif" style={{ width: "100%", fontSize: 22, fontWeight: 500, border: "none", borderBottom: "1px solid var(--line)", background: "transparent", padding: "6px 0 10px", marginBottom: 16 }} />
              <textarea value={body} onChange={(e) => setBody(e.target.value)}
                style={{ width: "100%", height: 320, padding: 20, border: "1px solid var(--line)", borderRadius: "var(--r-3)", background: "var(--bg)", fontFamily: "var(--font-serif)", fontSize: 17, lineHeight: 1.65, resize: "vertical" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>
                <span>{words} words</span>
                <span>{status === "saved" ? "Encrypted & secure" : "Stored encrypted on save"}</span>
              </div>
              {err && <div style={{ fontSize: 13, color: "var(--err)", marginTop: 8 }}>{err}</div>}
            </>
          )}
          {tab === "video" && (audienceReady
            ? <VideoComposer title={title} audienceType={audienceType} contactIds={contactIds} />
            : <div style={{ padding: 32, border: "1px dashed var(--line)", borderRadius: "var(--r-3)", textAlign: "center", color: "var(--ink-3)" }}>Choose at least one private recipient before recording.</div>)}
          {tab === "audio" && (
            <div style={{ padding: 40, border: "1px dashed var(--line)", borderRadius: "var(--r-3)", textAlign: "center", color: "var(--ink-3)" }}>
              Audio recording is post-MVP.
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", padding: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 12 }}>AUDIENCE</div>
            <div style={{ display: "grid", gap: 10 }}>
              <AudienceChoice checked={audienceType === "public"} onChange={() => setAudienceType("public")} title="Public" detail={`One message to your Public list (${contacts.filter((c) => c.receives_public && c.email).length} reachable).`} />
              <AudienceChoice checked={audienceType === "private"} onChange={() => setAudienceType("private")} title="Private" detail="A personalized message for specific people." />
            </div>
            {audienceType === "private" && (
              <div style={{ borderTop: "1px solid var(--line-soft)", marginTop: 14, paddingTop: 12, display: "grid", gap: 8 }}>
                {contacts.map((contact) => (
                  <label key={contact.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: contact.email ? "pointer" : "default", opacity: contact.email ? 1 : 0.55 }}>
                    <input type="checkbox" disabled={!contact.email} checked={contactIds.includes(contact.id)} onChange={(e) => setContactIds((ids) => e.target.checked ? [...ids, contact.id] : ids.filter((id) => id !== contact.id))} />
                    <span>{contact.full_name}</span>
                    {!contact.email && <span style={{ color: "var(--ink-4)" }}>(email needed)</span>}
                  </label>
                ))}
                {contacts.length === 0 && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Add contacts before creating a private message.</span>}
              </div>
            )}
          </div>
          <div style={{ background: "var(--brand-grad-soft)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", padding: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--brand-purple)", marginBottom: 12 }}>GENTLE PROMPTS</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7 }}>
              · One thing I'm grateful for, from each of you<br />· The first memory that comes to mind<br />· Something I never managed to say in person
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AudienceChoice({ checked, onChange, title, detail }: { checked: boolean; onChange: () => void; title: string; detail: string }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }}>
      <input type="radio" name="audience" checked={checked} onChange={onChange} style={{ marginTop: 3 }} />
      <span><strong style={{ display: "block", fontSize: 14 }}>{title}</strong><span style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.4 }}>{detail}</span></span>
    </label>
  );
}
