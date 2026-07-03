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
  { t: "Advocate A confirms", d: "Identity + death details, independently.", icon: "fingerprint" },
  { t: "Advocate B confirms", d: "The second, separately. Neither acts alone.", icon: "shield" },
  { t: "24-hour hold", d: "A full day to pause. Either advocate can stop it.", icon: "clock" },
  { t: "Release authorized", d: "Only if the day passes with no cancel.", icon: "check" },
  { t: "Dignified delivery", d: "Within 48 hours, gently, by email.", icon: "mail" },
] as const;

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
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 28px" }}>The patent-pending workflow — a 24-hour hold, fully cancellable, before any release.</p>
        <ReleaseTimeline />
      </div>
    </div>
  );
}

// Animated process timeline: each stage lights up in sequence and the connector
// line fills, then it loops — confirm → confirm → 24h hold → release → deliver.
function ReleaseTimeline() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % (TIMELINE.length + 1)), 1500);
    return () => clearInterval(t);
  }, []);
  const last = TIMELINE.length - 1;
  const fill = (Math.min(active, last) / last) * 100;
  return (
    <div style={{ position: "relative", paddingTop: 4 }}>
      {/* connector track spanning between the first and last node centers (10%–90%) */}
      <div style={{ position: "absolute", top: 26, left: "10%", right: "10%", height: 2, background: "var(--line)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${fill}%`, background: "var(--brand-grad)", transition: "width 700ms cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${TIMELINE.length}, 1fr)`, gap: 12, position: "relative" }}>
        {TIMELINE.map((s, i) => {
          const on = i <= active;
          const current = i === active;
          return (
            <div key={s.t} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: on ? "var(--brand-grad)" : "var(--surface)",
                border: on ? "none" : "1px solid var(--line)",
                display: "grid", placeItems: "center", marginBottom: 14,
                transform: current ? "scale(1.14)" : "scale(1)",
                boxShadow: current ? "var(--shadow-2)" : "none",
                transition: "background 500ms ease, transform 450ms ease, box-shadow 450ms ease",
              }}>
                <Icon name={s.icon} size={19} color={on ? "white" : "var(--ink-3)"} stroke={1.8} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: on ? "var(--ink)" : "var(--ink-3)", marginBottom: 4, transition: "color 400ms ease" }}>{s.t}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.45, maxWidth: 150 }}>{s.d}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const addInput = { padding: "11px 14px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--surface)", fontSize: 14, flex: "1 1 200px" } as const;
