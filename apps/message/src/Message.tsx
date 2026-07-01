import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MuxPlayer from "@mux/mux-player-react";
import { Logo, Icon } from "@lastlink/ui";
import { getApiUrl } from "./lib/api.js";

const API = getApiUrl();

interface Arrival {
  recipientName: string;
  registrantName: string;
  message: { type: string; title: string | null; durationSeconds: number | null; recordedDate: string | null };
  advocates: string[];
}
interface Opened {
  type: string;
  playbackId?: string;
  tokens?: { playback: string; thumbnail: string; storyboard: string };
  title?: string | null;
  body?: string;
}

export function Message() {
  const { token } = useParams();
  const [arrival, setArrival] = useState<Arrival | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [state, setState] = useState<"loading" | "invalid" | "arrival" | "opening" | "opened">("loading");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`${API}/recipient/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Arrival) => { setArrival(d); setState("arrival"); })
      .catch(() => setState("invalid"));
  }, [token]);

  async function open() {
    setState("opening");
    try {
      const r = await fetch(`${API}/recipient/${token}/open`, { method: "POST" });
      if (!r.ok) throw new Error();
      setOpened(await r.json());
      setState("opened");
    } catch { setState("arrival"); }
  }

  const recordedDate = arrival?.message.recordedDate
    ? new Date(arrival.message.recordedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div style={{ minHeight: "100%", background: "var(--bone)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid var(--line-soft)" }}>
        <Logo size={22} />
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.12em" }}>A MESSAGE FOR YOU</span>
      </header>

      <div style={{ display: "grid", placeItems: "center", padding: "48px 24px" }}>
        <div style={{ maxWidth: 680, width: "100%" }}>

          {state === "loading" && <p style={{ textAlign: "center", color: "var(--ink-3)" }}>One moment…</p>}

          {state === "invalid" && (
            <div style={{ textAlign: "center" }}>
              <Halo icon="leaf" />
              <h1 className="serif" style={h1}>This link is no longer active.</h1>
              <p style={lede}>The private link may have expired. The message itself is kept safe — please ask the family to send you a fresh link.</p>
            </div>
          )}

          {(state === "arrival" || state === "opening") && arrival && (
            <div style={{ textAlign: "center" }}>
              <Halo icon="heart" grad />
              <p className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-3)", marginBottom: 14 }}>
                {recordedDate ? `RECORDED ${recordedDate.toUpperCase()}` : "A LASTLINK MESSAGE"}
              </p>
              <h1 className="serif" style={h1}>
                {arrival.recipientName}, {arrival.registrantName} left something for you.
              </h1>
              <p style={lede}>
                Before {arrival.registrantName} passed, they recorded {arrival.message.type === "video" ? "a video" : arrival.message.type === "audio" ? "an audio message" : "a letter"} meant
                for you, to be shared only after their passing was confirmed. There's no rush. Open it whenever you feel ready.
              </p>
              <button className="ll-btn grad" onClick={open} disabled={state === "opening"} style={primaryBtn}>
                {state === "opening" ? "Opening…" : "Open when you're ready"} <Icon name="arrow" size={16} color="white" />
              </button>
              <AuditFooter advocates={arrival.advocates} registrantName={arrival.registrantName} />
            </div>
          )}

          {state === "opened" && opened && arrival && (
            <div>
              <p className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-3)", marginBottom: 10 }}>
                FROM {arrival.registrantName.toUpperCase()} {recordedDate ? `· ${recordedDate.toUpperCase()}` : ""}
              </p>
              <h1 className="serif" style={{ ...h1, textAlign: "left", marginBottom: 24 }}>
                {opened.title ?? (opened.type === "letter" ? "A letter for you" : `For ${arrival.recipientName}`)}
              </h1>

              {opened.type === "video" && opened.playbackId && opened.tokens && (
                <div style={{ borderRadius: "var(--r-4, 18px)", overflow: "hidden", aspectRatio: "16/9", background: "#241D17", boxShadow: "var(--shadow-3, 0 24px 60px rgba(31,24,20,0.18))" }}>
                  <MuxPlayer playbackId={opened.playbackId} tokens={opened.tokens} accentColor="#6B2CB0" style={{ height: "100%", width: "100%" }} />
                </div>
              )}

              {opened.type === "letter" && (
                <div style={{ background: "white", borderRadius: "var(--r-4, 18px)", padding: "44px 48px", boxShadow: "var(--shadow-2, 0 16px 40px rgba(31,24,20,0.12))", border: "1px solid var(--line-soft)" }}>
                  <p className="serif" style={{ fontSize: 19, lineHeight: 1.75, color: "var(--ink)", whiteSpace: "pre-wrap", margin: 0 }}>{opened.body}</p>
                </div>
              )}

              <Aftercare registrantName={arrival.registrantName} />
              <AuditFooter advocates={arrival.advocates} registrantName={arrival.registrantName} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Aftercare({ registrantName }: { registrantName: string }) {
  return (
    <div style={{ marginTop: 36, padding: "24px 28px", borderRadius: "var(--r-3, 14px)", background: "var(--brand-grad-soft)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Icon name="candle" size={18} color="var(--brand-purple)" />
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>You don't have to carry this alone.</span>
      </div>
      <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
        Grief has no schedule. If you'd like, you can return to {registrantName}'s message again — it stays here for you.
        Resources for support and remembrance are gathered in the family's care guide.
      </p>
    </div>
  );
}

function AuditFooter({ advocates, registrantName }: { advocates: string[]; registrantName: string }) {
  const names = advocates.filter(Boolean);
  return (
    <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--line-soft)", display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
      <Icon name="shield" size={15} color="var(--ink-3)" />
      <span style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5, textAlign: "center" }}>
        {names.length >= 2
          ? <>This release was independently confirmed by <strong>{names[0]}</strong> and <strong>{names[1]}</strong>, then held 24 hours before delivery.</>
          : <>This message was released through LastLink's verified confirmation process on behalf of {registrantName}.</>}
      </span>
    </div>
  );
}

function Halo({ icon, grad }: { icon: "leaf" | "heart"; grad?: boolean }) {
  return (
    <div style={{ width: 76, height: 76, borderRadius: "50%", background: grad ? "var(--brand-grad)" : "var(--brand-grad-soft)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
      <Icon name={icon} size={32} color={grad ? "white" : "var(--brand-purple)"} />
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: 36, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.12, margin: "0 0 16px", color: "var(--ink)", textAlign: "center" };
const lede: React.CSSProperties = { fontSize: 16, color: "var(--ink-2)", lineHeight: 1.65, margin: "0 0 28px", textAlign: "center" };
const primaryBtn: React.CSSProperties = { padding: "14px 30px", fontSize: 15 };
