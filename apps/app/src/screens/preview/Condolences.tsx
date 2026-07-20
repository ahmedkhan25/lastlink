import { Icon } from "@lastlink/ui";
import { PageHead, SubTabs, Flag, page, card } from "./_shared.js";

const PENDING = [
  { name: "Aunt Peggy", rel: "Family", msg: "From a boy who couldn't sit still to a man who held everyone together. Rest easy, Danny.", spam: false },
  { name: "J. Whitfield", rel: "Old friend", msg: "We lost touch but never forgot. The world's quieter now.", spam: false },
  { name: "unknown", rel: "—", msg: "Buy cheap watches at discount-deals dot biz →", spam: true },
];

export function Condolences() {
  return (
    <div style={page}>
      <PageHead eyebrow="Memorial · condolences" title="Condolences" sub="Keep the memorial page gentle for the family. New notes wait here until someone approves them." />
      <SubTabs active="/condolences" tabs={[{ href: "/memorial/settings", label: "Settings" }, { href: "/condolences", label: "Condolences" }]} />

      <div style={{ display: "flex", gap: 10, margin: "22px 0 16px" }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", padding: "5px 11px", borderRadius: "var(--r-pill)", background: "rgba(192,120,42,0.14)", color: "var(--warn)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="eye" size={12} color="var(--warn)" /> 3 awaiting review
        </span>
        <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", padding: "5px 11px", borderRadius: "var(--r-pill)", background: "rgba(47,122,85,0.14)", color: "var(--ok)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="check" size={12} color="var(--ok)" /> 12 published
        </span>
      </div>

      <div style={{ ...card, overflow: "hidden" }}>
        {PENDING.map((c, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, padding: "16px 20px", borderTop: i ? "1px solid var(--line)" : "none", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <span className="serif" style={{ fontSize: 17, fontWeight: 500 }}>{c.name}</span>
                <span style={{ color: "var(--ink-3)", fontSize: 12 }}>{c.rel}</span>
                {c.spam && <span className="mono" style={{ fontSize: 9, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: "var(--r-pill)", background: "var(--line-soft)", color: "var(--ink-3)" }}>LIKELY SPAM</span>}
              </div>
              <div style={{ color: "var(--ink-2)", fontSize: 14, marginTop: 4, maxWidth: "52ch" }}>{c.msg}</div>
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button className="ll-btn grad" style={{ padding: "6px 13px", fontSize: 13 }}>Approve</button>
              <button className="ll-btn secondary" style={{ padding: "6px 13px", fontSize: 13 }}>Hide</button>
            </div>
          </div>
        ))}
      </div>

      <Flag>
        <b>Product decision:</b> after death the registrant is gone — moderation delegates to an <b>advocate</b> or a
        nominated “memorial keeper.” This preview assumes an advocate-delegated moderator. New table: <code>app.condolences</code> (default <code>pending</code>).
      </Flag>
    </div>
  );
}
