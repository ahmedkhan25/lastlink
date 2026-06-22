import type { CSSProperties } from "react";

interface ImgSlotProps {
  label?: string;
  w?: number | string;
  h?: number | string;
  style?: CSSProperties;
  dark?: boolean;
  tone?: "sand" | "blue";
  src?: string;
  alt?: string;
}

export function ImgSlot({ label, w, h, style, dark = false, tone = "sand", src, alt }: ImgSlotProps) {
  if (src) {
    return (
      <div
        style={{
          width: w ?? "100%",
          height: h ?? "100%",
          borderRadius: "var(--r-3)",
          overflow: "hidden",
          background: "var(--surface-2)",
          ...style,
        }}
      >
        <img
          src={src}
          alt={alt ?? label ?? ""}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: "saturate(0.85) brightness(0.98)",
          }}
        />
      </div>
    );
  }
  const bg = dark
    ? "repeating-linear-gradient(135deg, rgba(241,232,216,0.05) 0 1px, transparent 1px 14px), #241D17"
    : tone === "sand"
      ? "repeating-linear-gradient(135deg, rgba(42,31,24,0.05) 0 1px, transparent 1px 14px), var(--surface-2)"
      : "repeating-linear-gradient(135deg, rgba(46,115,220,0.07) 0 1px, transparent 1px 14px), rgba(46,115,220,0.04)";
  return (
    <div className="ll-img" style={{ width: w ?? "100%", height: h ?? "100%", background: bg, ...style }}>
      {label && <div className="ll-img-label">{label}</div>}
    </div>
  );
}

// Curated Unsplash photos from the prototype — quiet, no faces.
export const LLPhotos = {
  letterHands: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&q=80&auto=format&fit=crop",
  envelope: "https://images.unsplash.com/photo-1579532582937-16c108930bf4?w=900&q=80&auto=format&fit=crop",
  fogHorizon: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=80&auto=format&fit=crop",
  oldHands: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=900&q=80&auto=format&fit=crop",
  candle: "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=900&q=80&auto=format&fit=crop",
  bookLetter: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=900&q=80&auto=format&fit=crop",
  windowLight: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80&auto=format&fit=crop",
  recordingMic: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=900&q=80&auto=format&fit=crop",
} as const;
