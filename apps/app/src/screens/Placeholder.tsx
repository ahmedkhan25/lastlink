import type { ReactNode } from "react";

export function Placeholder({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div style={{ padding: "56px 64px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 className="serif" style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.01em", margin: 0 }}>{title}</h1>
      <p style={{ fontSize: 15, color: "var(--ink-3)", margin: "8px 0 28px", maxWidth: 600 }}>{subtitle}</p>
      <div style={{ padding: 28, border: "1px dashed var(--line)", borderRadius: "var(--r-3)", background: "var(--surface)", color: "var(--ink-3)", fontSize: 14 }}>
        {children ?? "Full interface lands in M1 — wired to the Neon backend."}
      </div>
    </div>
  );
}
