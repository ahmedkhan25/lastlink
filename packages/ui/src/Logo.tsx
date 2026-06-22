import type { CSSProperties } from "react";

interface LogoProps {
  size?: number;
  color?: string;
  withWordmark?: boolean;
  stacked?: boolean;
}

// Brand assets are served from each app's /public/assets (see scripts/copy-assets).
export function Logo({ size = 28, color, withWordmark = true, stacked = false }: LogoProps) {
  if (stacked) {
    return (
      <img
        src="/assets/lastlink-logo.png"
        alt="LastLink"
        style={{ height: size * 2.4, width: "auto", display: "block" }}
      />
    );
  }
  const wordmark: CSSProperties = {
    fontSize: size * 0.82,
    letterSpacing: "-0.01em",
    color: color ?? "var(--ink)",
    fontWeight: 600,
    lineHeight: 1,
  };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.32 }}>
      <img
        src="/assets/lastlink-mark.png"
        alt="LastLink"
        style={{ height: size, width: "auto", display: "block", flexShrink: 0 }}
      />
      {withWordmark && <span className="serif" style={wordmark}>LastLink</span>}
    </div>
  );
}
