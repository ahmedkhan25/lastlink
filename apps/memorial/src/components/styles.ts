import type { CSSProperties } from "react";

export const wrap: CSSProperties = { maxWidth: 1040, margin: "0 auto", paddingLeft: 24, paddingRight: 24 };
export const card: CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--line)",
  borderRadius: "var(--r-3)", boxShadow: "var(--shadow-1)",
};
export const input: CSSProperties = {
  width: "100%", font: "inherit", color: "var(--ink)", background: "var(--surface-2)",
  border: "1px solid var(--line)", borderRadius: "var(--r-2)", padding: "10px 12px",
};
export const fieldLabel: CSSProperties = {
  fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
  color: "var(--ink-3)", display: "block", marginBottom: 6,
};
