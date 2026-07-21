import type { CSSProperties } from "react";

interface LogoProps {
  size?: number;
  color?: string;
  withWordmark?: boolean;
  stacked?: boolean;
}

// The brand mark (SVG, transparent). Two variants ship in each app's
// /public/assets: the colored mark for light grounds and a white "inverse" for
// dark. Which one shows is controlled by CSS (see styles.css .ll-mark-*), NOT
// inline styles — an inline `display` would beat the class toggle.
function Mark({ size }: { size: number }) {
  const base: CSSProperties = { height: size, width: "auto", flexShrink: 0 };
  return (
    <>
      <img className="ll-mark ll-mark-color" src="/assets/lastlink-mark.svg" alt="LastLink" style={base} />
      <img className="ll-mark ll-mark-inverse" src="/assets/lastlink-mark-inverse.svg" alt="LastLink" style={base} />
    </>
  );
}

export function Logo({ size = 28, color, withWordmark = true, stacked = false }: LogoProps) {
  const wordmarkColor = color ?? "var(--ink)";

  if (stacked) {
    return (
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: size * 0.3 }}>
        <Mark size={size * 1.6} />
        {withWordmark && (
          <span className="serif" style={{ fontSize: size * 0.9, fontWeight: 600, letterSpacing: "-0.01em", color: wordmarkColor, lineHeight: 1 }}>
            LastLink
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.34 }}>
      <Mark size={size} />
      {withWordmark && (
        <span className="serif" style={{ fontSize: size * 0.82, letterSpacing: "-0.01em", color: wordmarkColor, fontWeight: 600, lineHeight: 1 }}>
          LastLink
        </span>
      )}
    </div>
  );
}
