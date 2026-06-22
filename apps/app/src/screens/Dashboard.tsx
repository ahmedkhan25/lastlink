import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "@lastlink/ui";

interface Msg {
  title: string;
  summary: string;
  icon: IconName;
  status: "Ready" | "Draft";
}

const MESSAGES: Msg[] = [
  { title: "For my family", summary: "12 people · Catherine, Emily, Jonah, and 9 more · Video · 9 min 11 sec", icon: "video", status: "Ready" },
  { title: "For my closest friends", summary: "48 people · Audio · 4 min 22 sec", icon: "mic", status: "Ready" },
  { title: "For my colleagues", summary: "91 people · Letter · 320 words", icon: "pen", status: "Draft" },
];

const STATUS = [
  { icon: "check" as IconName, label: "Identity verified", sub: "Apr 2025" },
  { icon: "shield" as IconName, label: "Two advocates confirmed", sub: "Sarah · Michael" },
  { icon: "lock" as IconName, label: "Messages sealed", sub: "3 ready · 0 drafts pending" },
];

const RECENT = [
  { icon: "check" as IconName, text: "Sarah accepted being your advocate", date: "Apr 18, 2025" },
  { icon: "check" as IconName, text: "Michael accepted being your advocate", date: "Apr 17, 2025" },
  { icon: "plus" as IconName, text: "You added 3 contacts to Family", date: "Apr 12, 2025" },
  { icon: "pen" as IconName, text: "You recorded the message for your family", date: "Apr 10, 2025" },
];

export function Dashboard() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: "56px 64px 80px", maxWidth: 1020, margin: "0 auto" }}>
      <header style={{ marginBottom: 48 }}>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.14em" }}>
          WEDNESDAY · MAY 13, 2026
        </div>
        <h1 className="serif" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.04, margin: "8px 0 0" }}>
          Good morning, Daniel.
        </h1>
        <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--ink-2)", lineHeight: 1.4, maxWidth: 620, margin: "12px 0 0", fontWeight: 400 }}>
          Everything is in place. There's nothing you need to do today — unless you want to add a thought.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, padding: "24px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 56 }}>
        {STATUS.map((s) => (
          <div key={s.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Icon name={s.icon} size={18} color="var(--ok)" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </section>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em" }}>Your messages</h2>
        <button className="ll-btn ghost" onClick={() => navigate("/compose")}>
          <Icon name="plus" size={14} /> Write a new one
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 56px" }}>
        {MESSAGES.map((m) => {
          const ok = m.status === "Ready";
          return (
            <li
              key={m.title}
              onClick={() => navigate("/compose")}
              style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center", padding: "18px 0", borderBottom: "1px solid var(--line-soft)", cursor: "pointer" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "var(--r-2)", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}>
                <Icon name={m.icon} size={16} color="var(--brand-purple)" />
              </div>
              <div>
                <div className="serif" style={{ fontSize: 20, fontWeight: 500 }}>{m.title}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{m.summary}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: ok ? "var(--ok)" : "var(--warn)" }}>
                <Icon name={ok ? "check" : "pen"} size={14} color={ok ? "var(--ok)" : "var(--warn)"} />
                {m.status}
                <Icon name="chev" size={16} color="var(--ink-4)" />
              </div>
            </li>
          );
        })}
      </ul>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        <div>
          <h3 className="serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 16 }}>Recently</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {RECENT.map((r) => (
              <div key={r.text} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13 }}>
                <Icon name={r.icon} size={15} color="var(--ink-3)" />
                <div>
                  {r.text}
                  <div style={{ fontSize: 12, color: "var(--ink-4)" }}>{r.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderLeft: "2px solid var(--brand-purple)", padding: "0 4px 0 24px" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em" }}>A QUIET PROMPT</div>
          <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--ink-2)", lineHeight: 1.4, margin: "10px 0 16px" }}>
            Whose name have you been meaning to say out loud, and never quite did?
          </p>
          <button className="ll-btn ghost" onClick={() => navigate("/compose")}>Write to them →</button>
        </div>
      </div>
    </div>
  );
}
