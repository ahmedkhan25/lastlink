import { NavLink, Outlet } from "react-router-dom";
import { Logo, Icon, type IconName } from "@lastlink/ui";

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: "/dashboard", label: "Dashboard", icon: "home" },
  { to: "/compose", label: "Messages", icon: "pen" },
  { to: "/contacts", label: "Contacts", icon: "users" },
  { to: "/advocates", label: "Advocates", icon: "shield" },
];

export function AppLayout() {
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
          <Logo size={22} />
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
              D
            </div>
            <div style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 500 }}>Daniel R.</div>
              <div style={{ color: "var(--ink-3)" }}>Premium · Verified</div>
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
