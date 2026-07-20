import { Icon } from "@lastlink/ui";
import { PageHead, SubTabs, Flag, page, card } from "./_shared.js";

const field = { width: "100%", padding: "11px 13px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--bg)", fontSize: 14 } as const;
const label = { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6, display: "block" } as const;

export function Profile() {
  return (
    <div style={page}>
      <PageHead eyebrow="Account · profile" title="Your account" sub="Your details, and a photo that also becomes your memorial portrait." />
      <SubTabs active="/account/profile" tabs={[{ href: "/account/plan", label: "Plan" }, { href: "/account/profile", label: "Profile" }]} />

      <div style={{ ...card, padding: 26, marginTop: 24, maxWidth: 560 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 22 }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}>
            <Icon name="user" size={40} color="var(--brand-purple)" />
          </div>
          <div>
            <button className="ll-btn secondary">Change photo</button>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>JPG or PNG · also used on your memorial page</div>
          </div>
        </div>

        <label style={{ display: "block", marginBottom: 14 }}>
          <span className="mono" style={label}>Legal name</span>
          <input style={field} defaultValue="Aditya Sodhani" />
        </label>
        <div style={{ display: "flex", gap: 14 }}>
          <label style={{ flex: 1 }}>
            <span className="mono" style={label}>Date of birth</span>
            <input style={field} defaultValue="1990-04-03" />
          </label>
          <label style={{ flex: 1 }}>
            <span className="mono" style={label}>Country</span>
            <input style={field} defaultValue="United States" />
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button className="ll-btn grad">Save changes</button>
        </div>
      </div>

      <Flag>
        Adds an <b>avatar</b> (absent from <code>app.registrants</code> today) that feeds the memorial portrait.
        Follow-up schema: <code>registrants.portrait_ref</code>.
      </Flag>
    </div>
  );
}
