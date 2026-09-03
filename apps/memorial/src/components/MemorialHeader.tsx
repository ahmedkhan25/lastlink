import { Logo } from "@lastlink/ui";
import type { PublicMemorialPayload } from "@lastlink/shared";
import { wrap } from "./styles.js";

export function MemorialHeader({ memorial }: { memorial: PublicMemorialPayload["memorial"] }) {
  const dates = [memorial.birthYear, memorial.deathYear].filter(Boolean).join(" — ");
  return <>
    <header style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 22, paddingBottom: 22 }}>
      <Logo size={22} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <a href="/search" className="ll-btn ghost" style={{ padding: "7px 12px" }}>Find a memorial</a>
        <button className="ll-btn secondary" style={{ padding: "7px 14px" }} onClick={() => navigator.clipboard.writeText(window.location.href)}>Share this memorial</button>
      </div>
    </header>
    <section className="memorial-identity" style={{ ...wrap, display: "flex", gap: 28, paddingTop: 24, paddingBottom: 12, alignItems: "center" }}>
      <div style={{ width: 164, height: 190, borderRadius: "var(--r-4)", overflow: "hidden", background: "var(--brand-grad-soft)", flexShrink: 0, boxShadow: "var(--shadow-2)" }}>
        {memorial.portraitUrl ? <img src={memorial.portraitUrl} alt={`Portrait of ${memorial.displayName}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="serif" style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 62, color: "var(--brand-purple)" }}>{memorial.displayName.charAt(0)}</div>}
      </div>
      <div>
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>A life remembered</div>
        <h1 className="serif memorial-name" style={{ fontSize: 58, lineHeight: 1, fontWeight: 500, margin: "8px 0 5px" }}>{memorial.displayName}</h1>
        {dates && <div className="serif" style={{ fontStyle: "italic", fontSize: 22, color: "var(--ink-3)" }}>{dates}</div>}
        {memorial.headline && <p style={{ color: "var(--ink-2)", maxWidth: "56ch", fontSize: 16, margin: "14px 0 0" }}>{memorial.headline}</p>}
        {memorial.location && <div style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 7 }}>{memorial.location}</div>}
      </div>
    </section>
  </>;
}
