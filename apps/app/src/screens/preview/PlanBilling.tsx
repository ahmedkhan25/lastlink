import { Icon } from "@lastlink/ui";
import { PageHead, SubTabs, Flag, page, card } from "./_shared.js";

const FREE = ["3 video messages", "Up to 100 contacts", "Default groups", "Memorial page (1 year)", "Two advocates"];
const PREMIUM = [
  "Unlimited video messages",
  "Up to 1,000 contacts",
  "Custom contact groups",
  "Permanent memorial page",
  "Private per-group messages",
  "24/7 support",
];

export function PlanBilling() {
  return (
    <div style={page}>
      <PageHead
        eyebrow="Account · plan"
        title="Your plan"
        sub="You're on Free. Premium unlocks unlimited video, custom groups, a permanent memorial page, and priority support."
      />
      <SubTabs active="/account/plan" tabs={[{ href: "/account/plan", label: "Plan" }, { href: "/account/profile", label: "Profile" }]} />

      <div style={{ display: "flex", gap: 18, marginTop: 26, alignItems: "stretch", flexWrap: "wrap" }}>
        <div style={{ ...card, flex: "1 1 250px", padding: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="serif" style={{ fontSize: 26, fontWeight: 500 }}>Free</div>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", padding: "4px 10px", borderRadius: "var(--r-pill)", background: "rgba(47,122,85,0.14)", color: "var(--ok)" }}>Current plan</span>
          </div>
          <div className="serif" style={{ fontSize: 34, fontWeight: 500, margin: "10px 0 16px" }}>$0</div>
          {FREE.map((f) => (
            <div key={f} style={{ display: "flex", gap: 9, padding: "6px 0", color: "var(--ink-2)" }}>
              <Icon name="check" size={18} color="var(--ink-3)" /> <span>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ ...card, flex: "1 1 250px", padding: 26, border: "1.5px solid transparent", background: "linear-gradient(var(--surface),var(--surface)) padding-box, var(--brand-grad) border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="serif" style={{ fontSize: 26, fontWeight: 500 }}>Premium</div>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", padding: "4px 10px", borderRadius: "var(--r-pill)", background: "var(--line-soft)", color: "var(--ink-3)" }}>Recommended</span>
          </div>
          <div className="serif" style={{ fontSize: 34, fontWeight: 500, margin: "10px 0 16px" }}>
            $99.95<span style={{ fontSize: 15, color: "var(--ink-3)" }}> / year</span>
          </div>
          {PREMIUM.map((f) => (
            <div key={f} style={{ display: "flex", gap: 9, padding: "6px 0", color: "var(--ink-2)" }}>
              <Icon name="check" size={18} color="var(--brand-purple)" /> <span>{f}</span>
            </div>
          ))}
          <button className="ll-btn grad" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>Upgrade to Premium</button>
        </div>
      </div>

      <div style={{ ...card, padding: "18px 22px", marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em" }}>Billing history</div>
        <span style={{ color: "var(--ink-3)", fontSize: 13 }}>No charges yet</span>
      </div>

      <Flag>
        Entitlements map to Architecture Epic 5.2. Upgrade routes to <b>Stripe Billing</b> (subscription, not Connect).
        Pricing stays “visual” until product confirms numbers.
      </Flag>
    </div>
  );
}
