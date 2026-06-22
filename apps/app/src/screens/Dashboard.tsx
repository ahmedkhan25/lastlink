import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "@lastlink/ui";
import { gql } from "../lib/api.js";
import { useConfirm } from "../components/ConfirmProvider.js";

interface Data {
  app_registrants: { legal_name: string; account_state: string }[];
  app_advocates: { full_name: string; invite_status: string }[];
  app_messages: { id: string; title: string | null; type: string; status: string }[];
  app_contacts: { id: string }[];
}

const Q = `query {
  app_registrants { legal_name account_state }
  app_advocates(order_by: {slot: asc}) { full_name invite_status }
  app_messages(order_by: {created_at: desc}) { id title type status }
  app_contacts { id }
}`;

const TYPE_ICON: Record<string, IconName> = { video: "video", audio: "mic", letter: "pen" };
const DELETE_MSG = `mutation($id: uuid!) { delete_app_messages_by_pk(id: $id) { id } }`;

export function Dashboard() {
  const navigate = useNavigate();
  const [d, setD] = useState<Data | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    let active = true;
    gql<Data>(Q).then((r) => active && setD(r));
    return () => { active = false; };
  }, []);

  async function removeMessage(id: string, title: string) {
    const ok = await confirm({
      title: "Delete this message?",
      message: `"${title}" will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete message",
      tone: "danger",
    });
    if (!ok) return;
    setD((prev) => (prev ? { ...prev, app_messages: prev.app_messages.filter((m) => m.id !== id) } : prev));
    await gql(DELETE_MSG, { id }).catch(() => {});
    await gql<Data>(Q).then(setD); // authoritative reconcile with the DB
  }

  const reg = d?.app_registrants[0];
  const firstName = reg?.legal_name?.split(" ")[0] ?? "there";
  const sealed = reg?.account_state === "active_sealed";
  const advAccepted = d?.app_advocates.filter((a) => a.invite_status === "accepted").length ?? 0;
  const ready = d?.app_messages.filter((m) => m.status === "ready").length ?? 0;

  return (
    <div style={{ padding: "56px 64px 80px", maxWidth: 1020, margin: "0 auto" }}>
      <header style={{ marginBottom: 48 }}>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.14em" }}>
          {sealed ? "ACTIVE & SEALED" : "SETUP IN PROGRESS"}
        </div>
        <h1 className="serif" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.04, margin: "8px 0 0" }}>
          Good morning, {firstName}.
        </h1>
        <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--ink-2)", lineHeight: 1.4, maxWidth: 620, margin: "12px 0 0", fontWeight: 400 }}>
          {sealed
            ? "Everything is in place. There's nothing you need to do today — unless you want to add a thought."
            : "A few steps left. Finish setting up to seal your account."}
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, padding: "24px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 56 }}>
        <Status icon="check" label="Identity verified" sub={reg ? reg.legal_name : "—"} ok />
        <Status icon="shield" label="Advocates confirmed" sub={`${advAccepted} of ${d?.app_advocates.length ?? 0} accepted`} ok={advAccepted >= 2} />
        <Status icon="lock" label="Messages sealed" sub={`${ready} ready · ${(d?.app_messages.length ?? 0) - ready} drafts`} ok={ready > 0} />
      </section>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em" }}>Your messages</h2>
        <button className="ll-btn ghost" onClick={() => navigate("/compose")}><Icon name="plus" size={14} /> Write a new one</button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 56px" }}>
        {!d && <li style={{ color: "var(--ink-3)", padding: "18px 0" }}>Loading…</li>}
        {d && d.app_messages.length === 0 && (
          <li style={{ color: "var(--ink-3)", padding: "18px 0" }}>No messages yet — write your first one.</li>
        )}
        {d?.app_messages.map((m) => {
          const ok = m.status === "ready";
          return (
            <li key={m.id} onClick={() => navigate("/compose")}
              style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center", padding: "18px 0", borderBottom: "1px solid var(--line-soft)", cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--r-2)", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}>
                <Icon name={TYPE_ICON[m.type] ?? "pen"} size={16} color="var(--brand-purple)" />
              </div>
              <div>
                <div className="serif" style={{ fontSize: 20, fontWeight: 500 }}>{m.title ?? "Untitled message"}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", textTransform: "capitalize" }}>{m.type}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: ok ? "var(--ok)" : "var(--warn)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name={ok ? "check" : "pen"} size={14} color={ok ? "var(--ok)" : "var(--warn)"} />
                  {ok ? "Ready" : "Draft"}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeMessage(m.id, m.title ?? "this message"); }}
                  title="Delete message"
                  style={{ background: "none", border: "none", color: "var(--ink-4)", cursor: "pointer", fontSize: 12 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--err)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-4)")}
                >
                  Delete
                </button>
                <Icon name="chev" size={16} color="var(--ink-4)" />
              </div>
            </li>
          );
        })}
      </ul>

      <div style={{ borderLeft: "2px solid var(--brand-purple)", padding: "0 4px 0 24px", maxWidth: 520 }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em" }}>A QUIET PROMPT</div>
        <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--ink-2)", lineHeight: 1.4, margin: "10px 0 16px" }}>
          Whose name have you been meaning to say out loud, and never quite did?
        </p>
        <button className="ll-btn ghost" onClick={() => navigate("/compose")}>Write to them →</button>
      </div>
    </div>
  );
}

function Status({ icon, label, sub, ok }: { icon: IconName; label: string; sub: string; ok?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <Icon name={icon} size={18} color={ok ? "var(--ok)" : "var(--ink-4)"} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{sub}</div>
      </div>
    </div>
  );
}
