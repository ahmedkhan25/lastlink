import { useEffect, useState } from "react";
import { Icon } from "@lastlink/ui";
import { gql, postApi } from "../lib/api.js";
import { useConfirm } from "../components/ConfirmProvider.js";

interface Advocate {
  id: string;
  slot: string;
  full_name: string;
  relationship: string | null;
  email: string;
  invite_status: string;
  identity_verified: boolean;
}

const LIST = `query { app_advocates(order_by: {slot: asc}) { id slot full_name relationship email invite_status identity_verified } }`;
const REMOVE = `mutation($id: uuid!) { delete_app_advocates_by_pk(id: $id) { id } }`;
const ADD = `mutation($slot: String!, $name: String!, $email: String!) {
  insert_app_advocates_one(object: {slot: $slot, full_name: $name, email: $email, invite_status: "pending"}) { id }
}`;

const TIMELINE = [
  { n: "01", t: "Advocate A confirms", d: "Identity + death details, independently." },
  { n: "02", t: "Advocate B confirms", d: "The second, separately. Neither acts alone." },
  { n: "03", t: "24-hour hold", d: "We try to reach you directly. Anyone can stop it." },
  { n: "04", t: "Release authorized", d: "Only if the full day passes with no cancel." },
  { n: "05", t: "Dignified delivery", d: "Within 48 hours, by email." },
];

export function Advocates() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  function load() {
    return gql<{ app_advocates: Advocate[] }>(LIST).then((d) => { setAdvocates(d.app_advocates); setLoading(false); });
  }
  useEffect(() => { let a = true; gql<{ app_advocates: Advocate[] }>(LIST).then((d) => a && (setAdvocates(d.app_advocates), setLoading(false))); return () => { a = false; }; }, []);

  const [form, setForm] = useState({ name: "", email: "" });
  const [adding, setAdding] = useState(false);
  async function add() {
    const used = advocates.map((x) => x.slot);
    const slot = ["A", "B"].find((s) => !used.includes(s));
    if (!slot || !form.name.trim() || !form.email.trim()) return;
    setAdding(true);
    const r = await gql<{ insert_app_advocates_one: { id: string } }>(ADD, { slot, name: form.name, email: form.email });
    await postApi(`/api/advocates/${r.insert_app_advocates_one.id}/invite`).catch(() => {});
    setForm({ name: "", email: "" });
    setAdding(false);
    await load();
  }

  const [sent, setSent] = useState<Record<string, boolean>>({});
  async function invite(a: Advocate) {
    await postApi(`/api/advocates/${a.id}/invite`).catch(() => {});
    setSent((s) => ({ ...s, [a.id]: true }));
    setAdvocates((xs) => xs.map((x) => (x.id === a.id ? { ...x, invite_status: "pending" } : x)));
  }

  async function remove(a: Advocate) {
    const ok = await confirm({
      title: `Remove ${a.full_name}?`,
      message: "An advocate confirms your passing before any message is released. You'll want to designate a replacement.",
      confirmLabel: "Remove advocate",
      tone: "danger",
    });
    if (!ok) return;
    setAdvocates((xs) => xs.filter((x) => x.id !== a.id));
    await gql(REMOVE, { id: a.id }).catch(() => {});
    await load(); // authoritative reconcile with the DB
  }

  return (
    <div style={{ padding: "56px 64px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 className="serif" style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.01em", margin: 0 }}>Your advocates</h1>
      <p style={{ fontSize: 15, color: "var(--ink-3)", margin: "8px 0 28px", maxWidth: 620 }}>
        Two people who can confirm your passing. Both must agree, independently, before anything is released.
      </p>

      {!loading && advocates.length < 2 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Advocate's full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={addInput} />
          <input placeholder="Advocate's email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={addInput} />
          <button className="ll-btn" onClick={add} disabled={adding || !form.name.trim() || !form.email.trim()}>
            <Icon name="plus" size={14} color="white" /> {adding ? "Inviting…" : "Add & invite advocate"}
          </button>
          <span style={{ fontSize: 12, color: "var(--ink-3)", width: "100%" }}>You can designate up to two. We'll email each an invitation to accept.</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {loading && <div style={{ color: "var(--ink-3)" }}>Loading…</div>}
        {advocates.map((a) => {
          const accepted = a.invite_status === "accepted";
          return (
            <div key={a.id} style={{ padding: 28, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center", fontFamily: "var(--font-serif)", color: "var(--brand-purple)", fontWeight: 600, fontSize: 20 }}>{a.full_name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 500 }}>{a.full_name}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{a.relationship ?? "Advocate"} · Slot {a.slot}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: accepted ? "var(--ok)" : "var(--warn)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: accepted ? "var(--ok)" : "var(--warn)" }} />
                  {accepted ? "Confirmed" : "Pending"}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", display: "flex", flexDirection: "column", gap: 6 }}>
                <div><span style={{ color: "var(--ink-3)" }}>Email · </span>{a.email}</div>
                <div><span style={{ color: "var(--ink-3)" }}>Identity · </span>{a.identity_verified ? "Verified" : "Not yet"}</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                {a.invite_status !== "accepted" && (
                  <button className="ll-btn secondary" onClick={() => invite(a)} disabled={sent[a.id]}>
                    {sent[a.id] ? "Invite sent ✓" : a.invite_status === "pending" ? "Resend invite" : "Send invite"}
                  </button>
                )}
                <button className="ll-btn ghost" onClick={() => remove(a)}>Remove</button>
              </div>
            </div>
          );
        })}
        {!loading && advocates.length === 0 && (
          <div style={{ color: "var(--ink-3)", gridColumn: "1 / -1" }}>No advocates yet — add your first one above.</div>
        )}
      </div>

      <div style={{ padding: 28, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)" }}>
        <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>What happens when the time comes</h2>
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 20px" }}>The patent-protected workflow — a 24-hour hold, fully cancellable, before any release.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {TIMELINE.map((s) => (
            <div key={s.n} style={{ padding: 16, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--r-2)" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{s.n}</div>
              <div style={{ fontSize: 14, fontWeight: 500, margin: "6px 0 4px" }}>{s.t}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.45 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const addInput = { padding: "11px 14px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--surface)", fontSize: 14, flex: "1 1 200px" } as const;
