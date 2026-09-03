import type { CSSProperties, ReactNode } from "react";
import { NavLink } from "react-router-dom";

export const page: CSSProperties = { padding: "38px 44px", maxWidth: 1040 };
export const card: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "var(--r-3)",
  boxShadow: "var(--shadow-1)",
};
export const field: CSSProperties = {
  width: "100%", padding: "11px 13px", border: "1px solid var(--line)",
  borderRadius: "var(--r-2)", background: "var(--bg)", color: "var(--ink)", font: "inherit",
};
export const label: CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 10, letterSpacing: "0.12em",
  textTransform: "uppercase", color: "var(--ink-3)",
};
const MEMORIAL_TABS = [["/memorial/settings", "Page & gallery"], ["/condolences", "Visitor memories"]] as const;

export function MemorialHead({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.14em" }}>MEMORIAL</div>
        <h1 className="serif" style={{ fontSize: 44, fontWeight: 500, margin: "8px 0 0" }}>{title}</h1>
        <p style={{ color: "var(--ink-3)", fontSize: 15, margin: "10px 0 0", maxWidth: "60ch" }}>{sub}</p>
      </div>
      {action}
    </div>
  );
}

export function MemorialTabs() {
  return (
    <nav style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--line)", margin: "22px 0 0" }}>
      {MEMORIAL_TABS.map(([to, text]) => (
        <NavLink key={to} to={to} className="mono" style={({ isActive }) => ({
          textDecoration: "none", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
          color: isActive ? "var(--ink)" : "var(--ink-3)", padding: "0 2px 12px",
          borderBottom: `2px solid ${isActive ? "var(--brand-purple)" : "transparent"}`, marginBottom: -1,
        })}>{text}</NavLink>
      ))}
    </nav>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mono" style={label}>{children}</span>;
}
