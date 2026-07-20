// Shared building blocks for the "preview" screens — presentational stand-ins
// for features that are designed but not yet wired to a backend. They render
// from local fixtures and never call the API. See docs/INVESTOR-DEMO-PLAN.md.
import type { CSSProperties, ReactNode } from "react";

/** A small chip that marks a surface as a not-yet-wired preview. */
export function PreviewChip() {
  return (
    <span
      className="mono"
      title="Presentational preview — designed, not yet wired to a backend"
      style={{
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "4px 10px",
        borderRadius: "var(--r-pill)",
        background: "var(--brand-grad-soft)",
        color: "var(--brand-purple)",
        whiteSpace: "nowrap",
      }}
    >
      Preview
    </span>
  );
}

/** Standard page header used across the preview screens. */
export function PageHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.14em" }}>{eyebrow}</div>
        <h1 className="serif" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.05, margin: "8px 0 0" }}>{title}</h1>
        {sub && <p style={{ color: "var(--ink-3)", fontSize: 15, margin: "10px 0 0", maxWidth: "60ch" }}>{sub}</p>}
      </div>
      <PreviewChip />
    </div>
  );
}

export const page: CSSProperties = { padding: "38px 44px", maxWidth: 940 };
export const card: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "var(--r-3)",
  boxShadow: "var(--shadow-1)",
};

/** A tab strip that links to sibling preview screens (uses <a> — real routes). */
export function SubTabs({ tabs, active }: { tabs: { href: string; label: string }[]; active: string }) {
  return (
    <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--line)", margin: "22px 0 0" }}>
      {tabs.map((t) => {
        const on = t.href === active;
        return (
          <a
            key={t.href}
            href={t.href}
            className="mono"
            style={{
              textDecoration: "none",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: on ? "var(--ink)" : "var(--ink-3)",
              padding: "0 2px 12px",
              borderBottom: `2px solid ${on ? "var(--brand-purple)" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            {t.label}
          </a>
        );
      })}
    </div>
  );
}

/** A note explaining what's a mock vs. what a mock implies for the real build. */
export function Flag({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 9,
        alignItems: "flex-start",
        fontSize: 12.5,
        color: "var(--ink-3)",
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-2)",
        padding: "12px 14px",
        marginTop: 20,
        lineHeight: 1.55,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.6" style={{ marginTop: 1, flexShrink: 0 }}>
        <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

/** Google "G" mark (brand asset, presentational). */
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.06-1.3-.18-1.9H12v3.6h5.4a4.6 4.6 0 01-2 3l3.2 2.5c1.9-1.7 3-4.3 3-7.2z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .95-3.4.95-2.6 0-4.8-1.76-5.6-4.13H3.1v2.6A10 10 0 0012 22z" />
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 010-3.8V7.5H3.1a10 10 0 000 9z" />
      <path fill="#EA4335" d="M12 6.6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 003.1 7.5l3.3 2.6C7.2 8.36 9.4 6.6 12 6.6z" />
    </svg>
  );
}

/** Apple mark (presentational). */
export function AppleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 13c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.2 2-1.4 2.4-.4 6 1 8 .6.9 1.4 2 2.4 1.9.9 0 1.3-.6 2.4-.6s1.4.6 2.4.6c1 0 1.6-.9 2.2-1.8.7-1 1-2 1-2.1-.1 0-2-.8-2-3z" />
      <path d="M14 6c.6-.7.9-1.6.8-2.5-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.4.9.1 1.7-.4 2.3-1.1z" />
    </svg>
  );
}
