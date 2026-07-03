import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Logo, Icon } from "@lastlink/ui";
import { getApiUrl } from "./lib/api.js";

interface Invite {
  advocate: { name: string; relationship: string | null; status: string };
  registrantName: string;
}
type View = "loading" | "invalid" | "ready" | "accepting" | "accepted";

export function Accept() {
  const { token } = useParams();
  const [view, setView] = useState<View>("loading");
  const [invite, setInvite] = useState<Invite | null>(null);

  useEffect(() => {
    if (!token) { setView("invalid"); return; }
    fetch(`${getApiUrl()}/advocate/invite/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Invite) => {
        setInvite(d);
        setView(d.advocate.status === "accepted" ? "accepted" : "ready");
      })
      .catch(() => setView("invalid"));
  }, [token]);

  async function accept() {
    setView("accepting");
    const r = await fetch(`${getApiUrl()}/advocate/invite/${token}/accept`, { method: "POST" });
    setView(r.ok ? "accepted" : "invalid");
  }

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100%" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid var(--line-soft)" }}>
        <Logo size={22} />
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.12em" }}>ADVOCATE</span>
      </header>

      <div style={{ display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
          {view === "loading" && <p style={{ color: "var(--ink-3)" }}>One moment…</p>}

          {view === "invalid" && (
            <>
              <h1 className="serif" style={{ fontSize: 34, fontWeight: 500, margin: "0 0 12px" }}>This invite isn't valid.</h1>
              <p style={{ fontSize: 15, color: "var(--ink-2)" }}>The link may have expired or already been used. Ask the person who invited you to resend it.</p>
            </>
          )}

          {(view === "ready" || view === "accepting") && invite && (
            <>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
                <Icon name="shield" size={28} color="var(--brand-purple)" />
              </div>
              <h1 className="serif" style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.1, margin: "0 0 16px" }}>
                {invite.advocate.name}, {invite.registrantName} has entrusted you.
              </h1>
              <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 8px" }}>
                You've been designated as one of <strong>{invite.registrantName}</strong>'s two LastLink advocates.
              </p>
              <p style={{ fontSize: 15, color: "var(--ink-3)", lineHeight: 1.6, margin: "0 0 32px" }}>
                Together with one other person, you would one day confirm their passing — never alone, and only after a 24-hour safety hold. There is nothing to do today. Accepting simply lets them know you're willing.
              </p>
              <button className="ll-btn grad" onClick={accept} disabled={view === "accepting"} style={{ padding: "14px 28px", fontSize: 15 }}>
                {view === "accepting" ? "One moment…" : "Accept this role"}
                <Icon name="arrow" size={16} color="white" />
              </button>
            </>
          )}

          {view === "accepted" && invite && (
            <>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--brand-grad)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
                <Icon name="check" size={38} color="white" stroke={2} />
              </div>
              <h1 className="serif" style={{ fontSize: 38, fontWeight: 500, margin: "0 0 16px" }}>Thank you.</h1>
              <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.6 }}>
                {invite.registrantName} will be told you've accepted. We won't bother you unless the day ever comes — and even then, gently.
              </p>
              <div style={{ marginTop: 40, padding: "24px 26px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--line-soft)", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Icon name="shield" size={18} color="var(--brand-purple)" />
                  <span style={{ fontWeight: 600, fontSize: 15 }}>If the day ever comes</span>
                </div>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.65, margin: "0 0 18px" }}>
                  Come back to this page and begin the confirmation. You'll confirm {invite.registrantName}'s
                  passing — and so will the other advocate, independently. Nothing is released until <strong>both</strong> of
                  you confirm, and even then only after a <strong>24-hour hold</strong> that either of you can stop at any time.
                </p>
                <a href={`/confirm/${token}`} className="ll-btn grad" style={{ padding: "13px 26px", fontSize: 14 }}>
                  Begin the confirmation
                  <Icon name="arrow" size={15} color="white" />
                </a>
                <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "16px 0 0" }}>
                  Tip: bookmark this page — it's your private advocate link, and the only way in.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
