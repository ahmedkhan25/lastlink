import { useState } from "react";
import { Logo, Icon } from "@lastlink/ui";
import { getApiUrl } from "./lib/api.js";

// The advocate re-entry point. A year after being named, an advocate won't have
// the original email — they come here, enter their address, and we send a fresh
// secure link to begin the confirmation.
export function Landing() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    if (!email.includes("@")) { setState("error"); return; }
    setState("sending");
    try {
      const r = await fetch(`${getApiUrl()}/advocate/request-link`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }),
      });
      setState(r.ok ? "sent" : "error");
    } catch { setState("error"); }
  }

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100%" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid var(--line-soft)" }}>
        <Logo size={22} />
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.12em" }}>ADVOCATE</span>
      </header>

      <div style={{ display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
            <Icon name="shield" size={28} color="var(--brand-purple)" />
          </div>

          {state !== "sent" && (
            <>
              <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.12, margin: "0 0 16px" }}>
                Are you someone's advocate?
              </h1>
              <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 28px" }}>
                If someone named you as their LastLink advocate and the time has come, enter the
                email they used for you. We'll send a secure link to begin — you don't need the
                original message.
              </p>

              <div style={{ display: "flex", gap: 10, maxWidth: 440, margin: "0 auto", flexWrap: "wrap" }}>
                <input
                  type="email" value={email} placeholder="you@example.com"
                  onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  style={{ flex: "1 1 220px", padding: "13px 15px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 15, background: "white" }}
                />
                <button className="ll-btn grad" onClick={submit} disabled={state === "sending"} style={{ padding: "13px 24px", fontSize: 15 }}>
                  {state === "sending" ? "Sending…" : "Email me my link"} <Icon name="arrow" size={15} color="white" />
                </button>
              </div>
              {state === "error" && <p style={{ color: "var(--danger, #b3261e)", fontSize: 14, marginTop: 14 }}>Please enter a valid email and try again.</p>}
              <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 24, lineHeight: 1.6 }}>
                For everyone's safety, nothing here confirms a passing on its own. Both advocates
                confirm independently, and there's a 24-hour hold either of you can stop.
              </p>
            </>
          )}

          {state === "sent" && (
            <>
              <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: "0 0 16px" }}>Check your email.</h1>
              <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.65 }}>
                If <strong>{email}</strong> was named as an advocate, a secure link is on its way.
                Open it to continue. If nothing arrives in a few minutes, check spam — or confirm the
                address is the one used for you.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
