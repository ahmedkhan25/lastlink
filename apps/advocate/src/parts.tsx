import { Logo, Icon, type IconName } from "@lastlink/ui";
import { getMarketingUrl } from "./lib/api.js";

// Shared header — the logo links back to the marketing site.
export function Header() {
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid var(--line-soft)" }}>
      <a href={getMarketingUrl()} title="Back to lastlink.com" style={{ display: "inline-flex" }}>
        <Logo size={22} />
      </a>
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.12em" }}>ADVOCATE</span>
    </header>
  );
}

// Clear, calm instructions for the advocate — what happens when a passing occurs.
export function ProcessSteps({ registrantName }: { registrantName: string }) {
  const name = registrantName || "the person who named you";
  const steps: { icon: IconName; t: string; d: string }[] = [
    { icon: "fingerprint", t: "You begin the confirmation", d: `If ${name} has passed, come back to this page and start. You'll confirm the details.` },
    { icon: "shield", t: "The other advocate confirms too", d: "Separately and independently. Neither of you can ever act alone." },
    { icon: "clock", t: "A 24-hour safety hold", d: "A full day where either advocate can stop everything, for any reason." },
    { icon: "mail", t: `${name}'s messages are delivered`, d: "Only if the hold passes with no cancel — their words reach the people they chose." },
  ];
  return (
    <div style={{ textAlign: "left", border: "1px solid var(--line-soft)", borderRadius: 16, padding: "8px 22px", background: "var(--surface)" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 14, padding: "16px 0", borderTop: i > 0 ? "1px solid var(--line-soft)" : "none" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name={s.icon} size={17} color="var(--brand-purple)" />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>{s.t}</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{s.d}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
