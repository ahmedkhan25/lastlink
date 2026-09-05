import { useEffect, useState } from "react";
import { NavLink, Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Logo, Icon, type IconName } from "@lastlink/ui";
import { useSession, signOut } from "./lib/auth.js";
import { getMarketingUrl, getAdvocateUrl, getApi, postApi } from "./lib/api.js";
import { AccountContext, type AccountContextValue } from "./lib/account-context.js";
import { clearAdminToken, isAdministrator } from "./lib/administrator.js";
import type { AccountStatus } from "@lastlink/shared";
import { useConfirm } from "./components/ConfirmProvider.js";

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: "/dashboard", label: "Dashboard", icon: "home" },
  { to: "/compose", label: "Messages", icon: "pen" },
  { to: "/contacts", label: "Contacts", icon: "users" },
  { to: "/advocates", label: "Advocates", icon: "shield" },
  { to: "/memorial/settings", label: "Memorial", icon: "candle" },
  { to: "/account/plan", label: "Account", icon: "settings" },
];

export function AppLayout() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const admin = isAdministrator();
  const [account, setAccount] = useState<AccountContextValue | null>(null);
  const [accessError, setAccessError] = useState("");
  const confirm = useConfirm();
  const [resetting, setResetting] = useState(false);
  const demo = import.meta.env.VITE_DEMO === "true";

  // Onboarding gate: keep an un-sealed registrant in the onboarding flow. Until
  // account_state leaves 'onboarding' (the Done step seals the account), every
  // app route redirects to /onboarding — so "add contacts" etc. can't drop the
  // user into the dashboard mid-onboarding. "loading" until we know.
  const [acctState, setAcctState] = useState<string | null | "loading">("loading");
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId && !admin) return;
    let active = true;
    async function refresh() {
      try {
        const d = admin
          ? await getApi<{ account: AccountStatus; administrator: {name: string; role: string} }>("/api/administrator/account")
          : { account: await getApi<AccountStatus>("/api/account/status"), administrator: null };
        if(active) { setAccount({status:d.account,administrator:d.administrator}); setAcctState(d.account.accountState); setAccessError(""); }
      } catch(e) { if(active) { setAccessError(e instanceof Error ? e.message : "Unable to load account"); setAcctState(null); } }
    }
    void refresh();
    const timer=window.setInterval(refresh,15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [userId,admin]);

  async function resetDemo() {
    const ok = await confirm({
      title: "Reset for a fresh demo?",
      message: "This undoes any death confirmation and release for this account — it's as if the passing never happened. Messages and contacts are kept. Use this to demo the flow again.",
      confirmLabel: "Reset demo",
    });
    if (!ok) return;
    setResetting(true);
    try {
      await postApi("/api/demo/reset");
      window.location.assign("/dashboard");
    } catch {
      setResetting(false);
    }
  }

  if (isPending && !admin) {
    return <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--ink-3)" }}>Loading…</div>;
  }
  if (!session && !admin) return <Navigate to="/signin" replace />;
  if (accessError) return <div style={{padding:48}}><h1>Unable to open this account</h1><p>{accessError}</p>{admin ? <a href={getAdvocateUrl()}>Email me a fresh administrator link</a> : <button onClick={()=>window.location.reload()}>Try again</button>}<p><button onClick={()=>{clearAdminToken();window.location.assign("/signin");}}>Return to sign in</button></p></div>;
  if (acctState === "loading") {
    return <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--ink-3)" }}>Loading…</div>;
  }
  if (acctState === "onboarding") return <Navigate to="/onboarding" replace />;
  const locked = admin || acctState === "released" || acctState === "closed";
  if ((locked && location.pathname === "/compose") || (admin && !["/dashboard","/contacts","/memorial/settings","/condolences"].includes(location.pathname) && !location.pathname.startsWith("/messages/"))) return <Navigate to="/dashboard" replace />;

  const displayName = account?.administrator?.name || session?.user.name || session?.user.email || "Administrator";
  const initial = (displayName || "?").charAt(0).toUpperCase();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", height: "100%" }}>
      <aside
        style={{
          borderRight: "1px solid var(--line)",
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
        }}
      >
        <div style={{ padding: "0 8px 24px" }}>
          <a href={getMarketingUrl()} title="Back to lastlink.care" style={{ display: "inline-flex" }}>
            <Logo size={22} />
          </a>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.filter(n => !admin || !["Advocates","Account"].includes(n.label)).map((original) => { const n=original.label==="Messages" && locked ? {...original,to:"/dashboard#messages"} : original; return (
            <NavLink key={n.to} to={n.to} style={{ textDecoration: "none" }}>
              {({ isActive: routeActive }) => { const isActive=routeActive && (n.label==="Messages" && locked ? location.hash==="#messages" : n.label!=="Dashboard" || location.hash!=="#messages"); return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: "var(--r-2)",
                    background: isActive ? "var(--bg)" : "transparent",
                    color: isActive ? "var(--ink)" : "var(--ink-2)",
                    fontSize: 14,
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  <Icon name={n.icon} size={18} color={isActive ? "var(--brand-purple)" : "var(--ink-3)"} />
                  {n.label}
                </div>
              ); }}
            </NavLink>
          ); })}
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            onClick={() => window.alert("Support chat is coming soon. For now, email support@lastlink.care.")}
            className="ll-btn secondary"
            title="Preview of the planned support chat"
            style={{ width: "100%", justifyContent: "center", fontSize: 12 }}
          >
            <Icon name="mail" size={14} /> Support · Coming soon
          </button>
          <div
            style={{
              padding: 14,
              borderRadius: "var(--r-3)",
              background: "var(--bg)",
              border: "1px solid var(--line)",
              fontSize: 12,
              color: "var(--ink-3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-2)", fontWeight: 500 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ok)" }} />
              {acctState === "released" ? "In loving memory" : acctState === "in_verification" ? "Verification in progress" : acctState === "closed" ? "Account closed" : "Active & secure"}
            </div>
            <div style={{ marginTop: 4 }}>{acctState === "released" ? "Messages preserved. Memories live on." : acctState === "in_verification" ? "Check the confirmation status." : "Nothing you need to do today."}</div>
          </div>
          {demo && !admin && (
            <button
              onClick={resetDemo}
              disabled={resetting}
              title="Undo the death confirmation & release so you can demo again"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "9px 12px", borderRadius: "var(--r-2)", cursor: "pointer",
                background: "transparent", border: "1px dashed var(--line)", color: "var(--ink-2)", fontSize: 13,
              }}
            >
              <Icon name="clock" size={14} color="var(--ink-3)" />
              {resetting ? "Resetting…" : "Reset demo"}
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--brand-grad)",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-serif)",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {initial}
            </div>
            <div style={{ fontSize: 12, flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
              <div style={{fontSize:11,color:"var(--brand-purple)"}}>{admin ? "Account administrator" : "Account owner login"}</div>
              <button
                onClick={() => admin ? (clearAdminToken(), window.location.assign("/signin")) : signOut().then(() => navigate("/signin"))}
                style={{ background: "none", border: "none", padding: 0, color: "var(--ink-3)", fontSize: 12 }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ overflow: "auto" }}>
        {admin && <div style={{padding:"12px 32px",background:"var(--brand-grad-soft)",fontSize:13}}><strong>{displayName} · Account administrator</strong><span> — Caring for {account?.status.legalName}'s account. Messages are read-only.</span></div>}
        <AccountContext.Provider value={account}><Outlet /></AccountContext.Provider>
      </main>
    </div>
  );
}
