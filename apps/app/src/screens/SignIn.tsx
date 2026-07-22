import { useState, type FormEvent } from "react";
import { Logo, Icon } from "@lastlink/ui";
import { signIn, signUp } from "../lib/auth.js";
import { getMarketingUrl, getAdvocateUrl } from "../lib/api.js";
import { GoogleMark, AppleMark, FacebookMark } from "./preview/_shared.js";

export function SignIn() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [socialNote, setSocialNote] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res =
      mode === "signup"
        ? await signUp.email({ email, password, name })
        : await signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? "Something went wrong");
      return;
    }
    // Full-page navigation (not client-side navigate): the session cookie is
    // freshly set, and a hard load makes AppLayout's useSession read it from
    // scratch. A client-side navigate can race the stale (logged-out) session
    // and bounce back to /signin. Onboarding gate then routes new users to
    // /onboarding by account_state, so /dashboard is always a safe target.
    window.location.assign(mode === "signup" ? "/onboarding" : "/dashboard");
  }

  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", padding: 40 }}>
      <div style={{ width: 420, maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <a href={getMarketingUrl()} title="Back to lastlink.com" style={{ display: "inline-flex" }}>
            <Logo size={30} />
          </a>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-4)", padding: 32, boxShadow: "var(--shadow-2)" }}>
          <h1 className="serif" style={{ fontSize: 30, fontWeight: 500, margin: "0 0 6px" }}>
            {mode === "signup" ? "Begin your LastLink" : "Welcome back"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-3)", margin: "0 0 24px" }}>
            {mode === "signup" ? "A verified last word, for the people you love." : "Sign in to your account."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
            <button type="button" onClick={() => setSocialNote(true)} className="ll-btn secondary" style={{ width: "100%", justifyContent: "center" }}>
              <GoogleMark size={18} /> Continue with Google
            </button>
            <button type="button" onClick={() => setSocialNote(true)} className="ll-btn secondary" style={{ width: "100%", justifyContent: "center" }}>
              <AppleMark size={18} /> Continue with Apple
            </button>
            <button type="button" onClick={() => setSocialNote(true)} className="ll-btn secondary" style={{ width: "100%", justifyContent: "center" }}>
              <FacebookMark size={18} /> Continue with Facebook
            </button>
            {socialNote && (
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", textAlign: "center" }}>
                Preview — coming soon.
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 18px", color: "var(--ink-4)" }}>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.14em" }}>OR</span>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && <Input label="Full name" value={name} onChange={setName} />}
            <Input label="Email" type="email" value={email} onChange={setEmail} />
            <Input label="Password" type="password" value={password} onChange={setPassword} />
            {error && <div style={{ fontSize: 13, color: "var(--err)" }}>{error}</div>}
            <button className="ll-btn grad" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
              <Icon name="arrow" size={16} color="white" />
            </button>
          </form>
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-3)", marginTop: 18 }}>
          {mode === "signup" ? "Already have an account?" : "New to LastLink?"}{" "}
          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} style={{ background: "none", border: "none", color: "var(--brand-purple)", fontWeight: 500, padding: 0 }}>
            {mode === "signup" ? "Sign in" : "Begin your LastLink"}
          </button>
        </p>
        <div style={{ textAlign: "center", marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <a href={getAdvocateUrl()} className="ll-btn secondary" style={{ textDecoration: "none" }}>
            <Icon name="shield" size={15} color="var(--ink)" /> I'm an advocate
          </a>
          <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 10 }}>Named as someone's advocate? Enter here — no account needed.</p>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        required
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--bg)", fontSize: 14 }}
      />
    </label>
  );
}
