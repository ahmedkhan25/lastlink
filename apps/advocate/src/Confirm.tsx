import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Icon, type IconName } from "@lastlink/ui";
import { Header } from "./parts.js";
import { getApiUrl } from "./lib/api.js";

interface CaseData {
  registrantName: string;
  advocate: { name: string; slot: string };
  advocates: { slot: string; name: string; status: string }[];
  contactsAffected: number;
  case: null | {
    id: string;
    state: string;
    holdExpiresAt: string | null;
    iConfirmed: boolean;
    confirmCount: number;
  };
}

const API = getApiUrl();

function useCountdown(target: string | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return 0;
  return Math.max(0, new Date(target).getTime() - now);
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function Confirm() {
  const { token } = useParams();
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reportedDod, setReportedDod] = useState("");

  const load = useCallback(async () => {
    if (!token) { setErr("invalid"); setLoading(false); return; }
    try {
      const r = await fetch(`${API}/advocate/${token}/case`);
      if (!r.ok) throw new Error("invalid");
      setData(await r.json());
    } catch { setErr("invalid"); }
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function post(path: string, body?: unknown) {
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${API}/advocate/${token}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Something went wrong.");
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "error"); }
    setBusy(false);
  }

  const c = data?.case ?? null;
  const hold = useCountdown(c?.state === "safety_hold" ? c.holdExpiresAt : null);
  const other = data?.advocates.find((a) => a.slot !== data.advocate.slot);

  return (
    <Shell>
      {loading && <p style={{ color: "var(--ink-3)" }}>One moment…</p>}

      {!loading && err === "invalid" && (
        <Centered title="This link isn't valid.">
          The link may have expired or already been used. Ask the person who invited you to resend it.
        </Centered>
      )}

      {!loading && data && (() => {
        // No open case → this advocate can report the passing.
        if (!c) return (
          <div style={card}>
            <Halo icon="shield" />
            <h1 className="serif" style={h1}>Confirm {data.registrantName}'s passing</h1>
            <p style={lede}>
              If <strong>{data.registrantName}</strong> has passed, you can begin the confirmation here.
              Nothing is released until <strong>both</strong> advocates confirm, independently — and even then,
              only after a <strong>24-hour safety hold</strong> that either of you can stop.
            </p>
            <label style={fieldLabel}>Date of passing</label>
            <input type="date" value={reportedDod} onChange={(e) => setReportedDod(e.target.value)}
              style={input} max={new Date().toISOString().slice(0, 10)} />
            {err && err !== "invalid" && <p style={errStyle}>{err}</p>}
            <button className="ll-btn grad" disabled={busy || !reportedDod}
              onClick={() => post("initiate", { reportedDod })} style={primaryBtn}>
              {busy ? "One moment…" : "Begin confirmation"} <Icon name="arrow" size={16} color="white" />
            </button>
            <p style={fine}>This notifies {other?.name ?? "the second advocate"} too. You'll both confirm separately.</p>
          </div>
        );

        if (c.state === "released") return (
          <Centered title="The messages have been delivered." icon="check" grad>
            {data.registrantName}'s recipients have each received a private link to the words left for them.
            Thank you for the care you gave at the hardest moment.
          </Centered>
        );

        if (c.state === "cancelled") return (
          <Centered title="The release was stopped." icon="shield">
            This confirmation was cancelled. Nothing was delivered. If this was a mistake, a new confirmation
            can be started.
          </Centered>
        );

        if (c.state === "disputed") return (
          <Centered title="This confirmation is on hold." icon="shield">
            An advocate flagged a concern, so nothing will proceed. The LastLink team has been notified.
          </Centered>
        );

        // Safety hold → countdown + cancel + demo time-warp release.
        if (c.state === "safety_hold") return (
          <div style={card}>
            <Halo icon="clock" />
            <h1 className="serif" style={h1}>Both advocates have confirmed.</h1>
            <p style={lede}>
              A mandatory <strong>safety hold</strong> is now running. When it ends, {data.registrantName}'s
              messages will be released to {data.contactsAffected} recipient{data.contactsAffected === 1 ? "" : "s"}.
              Until then, either advocate can stop everything.
            </p>
            <div style={countdownBox}>
              <span className="mono" style={{ fontSize: 40, fontWeight: 600, color: "var(--ink)" }}>{fmt(hold)}</span>
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-3)" }}>UNTIL RELEASE</span>
            </div>
            {err && err !== "invalid" && <p style={errStyle}>{err}</p>}
            <button className="ll-btn" disabled={busy} onClick={() => post("cancel")}
              style={{ ...primaryBtn, background: "var(--bone)", color: "var(--danger, #b3261e)", border: "1px solid var(--danger, #b3261e)" }}>
              Stop the release
            </button>
            <div style={demoBox}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--ink-3)" }}>DEMO CONTROL</span>
              <button className="ll-btn grad" disabled={busy} onClick={() => post("release")} style={{ ...primaryBtn, marginTop: 8 }}>
                {busy ? "Releasing…" : "Advance hold & release now"} <Icon name="arrow" size={16} color="white" />
              </button>
            </div>
          </div>
        );

        // Open case, not yet in hold.
        if (c.iConfirmed) return (
          <Centered title="Your confirmation is recorded." icon="check">
            Thank you, {data.advocate.name}. We're now waiting for {other?.name ?? "the second advocate"} to
            confirm independently. The 24-hour hold begins only once you've both confirmed.
          </Centered>
        );

        // This advocate needs to confirm/dispute.
        return (
          <div style={card}>
            <Halo icon="shield" />
            <h1 className="serif" style={h1}>{data.advocate.name}, please confirm.</h1>
            <p style={lede}>
              A request has been made to confirm the passing of <strong>{data.registrantName}</strong>.
              {c.confirmCount > 0 && other ? ` ${other.name} has already confirmed.` : ""} Your confirmation is
              independent — only confirm if you personally know this to be true.
            </p>
            <div style={reviewBox}>
              <Row k="Person" v={data.registrantName} />
              <Row k="Recipients affected" v={String(data.contactsAffected)} />
              <Row k="Confirmations so far" v={`${c.confirmCount} of 2`} />
            </div>
            {err && err !== "invalid" && <p style={errStyle}>{err}</p>}
            <button className="ll-btn grad" disabled={busy} onClick={() => post("confirm", { decision: "confirm" })} style={primaryBtn}>
              {busy ? "One moment…" : `I confirm ${data.registrantName} has passed`} <Icon name="arrow" size={16} color="white" />
            </button>
            <button className="ll-btn" disabled={busy} onClick={() => post("confirm", { decision: "dispute" })}
              style={{ ...secondaryBtn }}>
              Something is wrong — flag this
            </button>
          </div>
        );
      })()}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100%" }}>
      <Header />
      <div style={{ display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ maxWidth: 560, width: "100%" }}>{children}</div>
      </div>
    </div>
  );
}

function Centered({ title, children, icon = "shield", grad }: { title: string; children: React.ReactNode; icon?: IconName; grad?: boolean }) {
  return (
    <div style={{ ...card, textAlign: "center" }}>
      <Halo icon={icon} grad={grad} />
      <h1 className="serif" style={h1}>{title}</h1>
      <p style={lede}>{children}</p>
    </div>
  );
}

function Halo({ icon, grad }: { icon: IconName; grad?: boolean }) {
  return (
    <div style={{ width: 72, height: 72, borderRadius: "50%", background: grad ? "var(--brand-grad)" : "var(--brand-grad-soft)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
      <Icon name={icon} size={30} color={grad ? "white" : "var(--brand-purple)"} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
      <span style={{ color: "var(--ink-3)", fontSize: 14 }}>{k}</span>
      <span style={{ color: "var(--ink)", fontSize: 14, fontWeight: 500 }}>{v}</span>
    </div>
  );
}

const card: React.CSSProperties = { textAlign: "center" };
const h1: React.CSSProperties = { fontSize: 34, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.12, margin: "0 0 16px" };
const lede: React.CSSProperties = { fontSize: 16, color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 24px" };
const fine: React.CSSProperties = { fontSize: 13, color: "var(--ink-3)", marginTop: 16 };
const fieldLabel: React.CSSProperties = { display: "block", textAlign: "left", fontSize: 13, color: "var(--ink-3)", marginBottom: 6 };
const input: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line-soft)", fontSize: 15, marginBottom: 8, background: "white" };
const primaryBtn: React.CSSProperties = { padding: "14px 28px", fontSize: 15, width: "100%", justifyContent: "center", marginTop: 8 };
const secondaryBtn: React.CSSProperties = { padding: "12px 24px", fontSize: 14, width: "100%", justifyContent: "center", marginTop: 10, background: "transparent", color: "var(--ink-3)" };
const errStyle: React.CSSProperties = { color: "var(--danger, #b3261e)", fontSize: 14, margin: "4px 0" };
const reviewBox: React.CSSProperties = { textAlign: "left", background: "var(--bone-2, #fff)", borderRadius: 12, padding: "4px 18px", margin: "0 0 20px", border: "1px solid var(--line-soft)" };
const countdownBox: React.CSSProperties = { display: "grid", placeItems: "center", gap: 4, padding: "24px", margin: "0 0 20px", borderRadius: 16, background: "var(--brand-grad-soft)" };
const demoBox: React.CSSProperties = { marginTop: 24, paddingTop: 20, borderTop: "1px dashed var(--line-soft)" };
