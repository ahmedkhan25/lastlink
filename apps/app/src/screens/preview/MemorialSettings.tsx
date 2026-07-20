import { Icon } from "@lastlink/ui";
import { PageHead, SubTabs, Flag, page, card } from "./_shared.js";

const VIS = [
  ["Public", "Anyone with the link; may appear in search", true],
  ["Unlisted", "Only people with the link", false],
  ["Private", "Only you, until release", false],
] as const;

export function MemorialSettings() {
  return (
    <div style={page}>
      <PageHead eyebrow="Memorial · settings" title="Memorial settings" sub="Control the public memorial page — its address, who can see it, and how long it stays up." />
      <SubTabs active="/memorial/settings" tabs={[{ href: "/memorial/settings", label: "Settings" }, { href: "/condolences", label: "Condolences" }]} />

      <div style={{ ...card, padding: 22, marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em" }}>Public address</div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 500, marginTop: 3 }}>memorial.lastlink.com/aditya-sodhani</div>
        </div>
        <button className="ll-btn secondary">Copy link</button>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ ...card, flex: "1 1 260px", padding: 22 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em", marginBottom: 12 }}>Visibility</div>
          {VIS.map(([t, d, on]) => (
            <label key={t} style={{ display: "flex", gap: 11, padding: "9px 0", alignItems: "flex-start", cursor: "pointer" }}>
              <input type="radio" name="vis" defaultChecked={on} style={{ marginTop: 4 }} />
              <span>
                <span style={{ fontWeight: 500 }}>{t}</span>
                <br />
                <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{d}</span>
              </span>
            </label>
          ))}
        </div>

        <div style={{ ...card, flex: "1 1 260px", padding: 22, display: "flex", flexDirection: "column" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em", marginBottom: 12 }}>Page lifecycle</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Status</span>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", padding: "4px 10px", borderRadius: "var(--r-pill)", background: "rgba(192,120,42,0.14)", color: "var(--warn)" }}>Expires 14 Aug 2026</span>
          </div>
          <p style={{ color: "var(--ink-3)", fontSize: 13, margin: "12px 0 16px" }}>Free memorials stay up for a year. Premium keeps it up permanently.</p>
          <button className="ll-btn grad" style={{ marginTop: "auto", justifyContent: "center" }}>
            Extend / make permanent <Icon name="arrow" size={15} color="white" />
          </button>
        </div>
      </div>

      <Flag>
        “Extend” routes to <b>Stripe Checkout</b> (reusing Architecture §12 plumbing — not PayPal). Post-death, the same
        card is shown to the memorial keeper. Legacy prices were $49.95/yr · $99.95 permanent.
      </Flag>
    </div>
  );
}
