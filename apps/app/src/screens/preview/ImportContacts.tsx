import { useNavigate } from "react-router-dom";
import { Icon } from "@lastlink/ui";
import { PageHead, Flag, GoogleMark, page, card } from "./_shared.js";

const ROWS = [
  { name: "Sarah Chen", email: "sarah.chen@example.com", group: "Close friends", reach: "email · sms", dup: false },
  { name: "Michael Rivera", email: "m.rivera@example.com", group: "Family", reach: "email", dup: false },
  { name: "Priya Anand", email: "priya@example.com", group: "Business", reach: "email", dup: false },
  { name: "Tom Whitfield", email: "tom.w@example.com", group: "—", reach: "email", dup: true },
];

export function ImportContacts() {
  const navigate = useNavigate();
  return (
    <div style={page}>
      <PageHead eyebrow="Contacts · import" title="Import contacts" sub="Bring people in from Google or a CSV instead of typing each one. Review and tag them before anything is saved." />

      <div style={{ display: "flex", gap: 16, margin: "24px 0 8px", flexWrap: "wrap" }}>
        <div style={{ ...card, flex: "1 1 230px", padding: 22, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--r-2)", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}><GoogleMark size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 500 }}>Connect Google</div>
            <div style={{ color: "var(--ink-3)", fontSize: 13 }}>Import your Google Contacts</div>
          </div>
          <button className="ll-btn grad" style={{ padding: "6px 13px", fontSize: 13 }}>Connect</button>
        </div>
        <div style={{ ...card, flex: "1 1 230px", padding: 22, display: "flex", gap: 14, alignItems: "center", borderStyle: "dashed" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--r-2)", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}><Icon name="file" size={20} color="var(--brand-purple)" /></div>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 500 }}>Upload a CSV</div>
            <div style={{ color: "var(--ink-3)", fontSize: 13 }}>Drop a file or browse</div>
          </div>
          <button className="ll-btn secondary" style={{ padding: "6px 13px", fontSize: 13 }}>Browse</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "26px 0 8px" }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em" }}>Review · 12 new · 3 already in your contacts</div>
        <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 13, color: "var(--ink-3)" }}><input type="checkbox" defaultChecked /> Select all new</label>
      </div>

      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "34px 1.2fr 1.4fr 1fr 0.8fr", padding: "0 14px" }} className="mono">
          {["", "Name", "Email", "Group", "Reach"].map((h, i) => (
            <div key={i} style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", padding: "12px 0 10px" }}>{h}</div>
          ))}
        </div>
        {ROWS.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "34px 1.2fr 1.4fr 1fr 0.8fr", padding: "12px 14px", borderTop: "1px solid var(--line)", alignItems: "center", opacity: r.dup ? 0.55 : 1 }}>
            <input type="checkbox" defaultChecked={!r.dup} />
            <div className="serif" style={{ fontSize: 15, fontWeight: 500 }}>{r.name}</div>
            <div style={{ color: "var(--ink-3)", fontSize: 14 }}>{r.email}</div>
            <div>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.08em", padding: "3px 9px", borderRadius: "var(--r-pill)", background: "var(--line-soft)", color: "var(--ink-3)" }}>{r.dup ? "ALREADY ADDED" : r.group.toUpperCase()}</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{r.reach}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
        <button className="ll-btn secondary" onClick={() => navigate("/contacts")}>Cancel</button>
        <button className="ll-btn grad" onClick={() => navigate("/contacts")}>Add 12 contacts</button>
      </div>

      <Flag>
        Dedupes by email against existing contacts (the “already added” rows). Imported people get a suggested
        <b> group</b> and <b>reach channel</b> before saving — mirrors the onboarding Contacts step.
      </Flag>
    </div>
  );
}
