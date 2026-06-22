import { useEffect, useState } from "react";
import { Icon } from "@lastlink/ui";
import { gql, getApiUrl } from "../lib/api.js";
import { VideoComposer } from "./VideoComposer.js";

interface Group { id: string; name: string }
type Tab = "video" | "audio" | "letter";

const GROUPS = `query { app_contact_groups(order_by: {created_at: asc}) { id name } }`;
const CREATE = `mutation($title: String, $group_id: uuid) {
  insert_app_messages_one(object: {type: "letter", title: $title, group_id: $group_id, status: "draft"}) { id }
}`;

export function Compose() {
  const [tab, setTab] = useState<Tab>("letter");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [title, setTitle] = useState("A message before goodbye");
  const [body, setBody] = useState("My loves,\n\n");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    gql<{ app_contact_groups: Group[] }>(GROUPS).then((d) => {
      if (!active) return;
      setGroups(d.app_contact_groups);
      if (d.app_contact_groups[0]) setGroupId(d.app_contact_groups[0].id);
    });
    return () => { active = false; };
  }, []);

  async function save() {
    setStatus("saving");
    setErr(null);
    try {
      const created = await gql<{ insert_app_messages_one: { id: string } }>(CREATE, {
        title,
        group_id: groupId || null,
      });
      const id = created.insert_app_messages_one.id;
      const res = await fetch(`${getApiUrl()}/api/messages/${id}/letter`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "save failed");
      setStatus("saved");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "save failed");
      setStatus("error");
    }
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div style={{ padding: "32px 40px 60px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
            {status === "saved" ? "SAVED · READY" : status === "saving" ? "SAVING…" : "DRAFT"}
          </div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.01em", margin: "4px 0 0" }}>
            Compose a message
          </h1>
        </div>
        {tab === "letter" && (
          <button className="ll-btn grad" onClick={save} disabled={status === "saving" || !body.trim()}>
            {status === "saved" ? "Saved ✓" : "Save message"}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
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
                <span>{status === "saved" ? "Encrypted & sealed" : "Stored encrypted on save"}</span>
              </div>
              {err && <div style={{ fontSize: 13, color: "var(--err)", marginTop: 8 }}>{err}</div>}
            </>
          )}
          {tab === "video" && <VideoComposer title={title} groupId={groupId} />}
          {tab === "audio" && (
            <div style={{ padding: 40, border: "1px dashed var(--line)", borderRadius: "var(--r-3)", textAlign: "center", color: "var(--ink-3)" }}>
              Audio recording is post-MVP.
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", padding: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 12 }}>AUDIENCE</div>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--bg)", fontSize: 14 }}>
              <option value="">Everyone (no group)</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
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
