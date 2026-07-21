import { useState } from "react";
import { NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { Logo, Icon, type IconName } from "@lastlink/ui";
import { useSession, signOut } from "./lib/auth.js";
import { getMarketingUrl, postApi } from "./lib/api.js";
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
  const confirm = useConfirm();
  const [resetting, setResetting] = useState(false);
  const demo = import.meta.env.VITE_DEMO === "true";

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

  if (isPending) {
    return <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--ink-3)" }}>Loading…</div>;
  }
  if (!session) return <Navigate to="/signin" replace />;

  const displayName = session.user.name || session.user.email;
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
          <a href={getMarketingUrl()} title="Back to lastlink.com" style={{ display: "inline-flex" }}>
            <Logo size={22} />
          </a>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} style={{ textDecoration: "none" }}>
              {({ isActive }) => (
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
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
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
              Active &amp; sealed
            </div>
            <div style={{ marginTop: 4 }}>Nothing you need to do today.</div>
          </div>
          {demo && (
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
              <button
                onClick={() => signOut().then(() => navigate("/signin"))}
                style={{ background: "none", border: "none", padding: 0, color: "var(--ink-3)", fontSize: 12 }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
