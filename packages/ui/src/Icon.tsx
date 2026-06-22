import type { ReactElement } from "react";

export type IconName =
  | "check" | "plus" | "arrow" | "arrowLeft" | "user" | "users" | "briefcase"
  | "shield" | "lock" | "mail" | "video" | "mic" | "pen" | "sparkle" | "heart"
  | "bell" | "clock" | "eye" | "settings" | "play" | "file" | "chev" | "chevDown"
  | "grid" | "home" | "leaf" | "fingerprint" | "moon" | "candle";

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
}

const PATHS: Record<IconName, ReactElement> = {
  check: <polyline points="4 12 10 18 20 6" />,
  plus: <g><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></g>,
  arrow: <g><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></g>,
  arrowLeft: <g><line x1="19" y1="12" x2="5" y2="12" /><polyline points="11 6 5 12 11 18" /></g>,
  user: <g><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></g>,
  users: <g><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" /><circle cx="17" cy="6" r="2.5" /><path d="M16 14c3 0 6 2 6 5" /></g>,
  briefcase: <g><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><line x1="3" y1="13" x2="21" y2="13" /></g>,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />,
  lock: <g><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></g>,
  mail: <g><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></g>,
  video: <g><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></g>,
  mic: <g><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><line x1="12" y1="18" x2="12" y2="22" /></g>,
  pen: <g><path d="M4 20h4l11-11-4-4L4 16v4z" /><line x1="15" y1="6" x2="18" y2="9" /></g>,
  sparkle: <path d="M12 3l1.8 5.6L19 10l-5.2 1.4L12 17l-1.8-5.6L5 10l5.2-1.4z" />,
  heart: <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />,
  bell: <g><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" /><path d="M10 22h4" /></g>,
  clock: <g><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></g>,
  eye: <g><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></g>,
  settings: <g><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></g>,
  play: <polygon points="6 4 20 12 6 20" />,
  file: <g><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><polyline points="14 3 14 8 19 8" /></g>,
  chev: <polyline points="9 6 15 12 9 18" />,
  chevDown: <polyline points="6 9 12 15 18 9" />,
  grid: <g><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></g>,
  home: <g><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></g>,
  leaf: <path d="M20 4c-9 0-16 7-16 16 0 0 16 0 16-16z" />,
  fingerprint: <g><path d="M8 11a4 4 0 0 1 8 0v2c0 3-1 5-2 7" /><path d="M5 14c0-7 4-11 11-9" /><path d="M11 22c-1-3-2-6-2-9" /></g>,
  moon: <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />,
  candle: <g><path d="M12 3c-1 2 2 3 0 5" /><rect x="9" y="9" width="6" height="11" rx="1" /><line x1="6" y1="22" x2="18" y2="22" /></g>,
};

export function Icon({ name, size = 18, stroke = 1.5, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
