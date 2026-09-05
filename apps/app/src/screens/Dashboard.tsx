import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "@lastlink/ui";
import { gql, getApi } from "../lib/api.js";
import { useUploadThing } from "../lib/uploadthing.js";
import { useConfirm } from "../components/ConfirmProvider.js";
import { RemembranceDashboard } from "../components/RemembranceDashboard.js";
import { useAccountContext } from "../lib/account-context.js";
import { passingHeading } from "@lastlink/shared";

interface Data {
  app_registrants: { legal_name: string; account_state: string }[];
  app_advocates: { full_name: string; invite_status: string }[];
  app_messages: { id: string; title: string | null; type: string; status: string; audience_type: "public" | "private" }[];
  app_contacts: { id: string }[];
}

const Q = `query {
  app_registrants { legal_name account_state }
  app_advocates(order_by: {slot: asc}) { full_name invite_status }
  app_messages(order_by: {created_at: desc}) { id title type status audience_type }
  app_contacts { id }
}`;

interface Me {
  legalName: string | null;
  avatarUrl: string | null;
  uploadsEnabled: boolean;
}

// Profile photo (issues-sheet request). Reads/writes via REST — the avatar
// column is not exposed through Hasura. Hidden entirely when the API has no
// upload provider configured.
function ProfilePhoto() {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    getApi<Me>("/api/account/me").then((r) => active && setMe(r)).catch(() => {});
    return () => { active = false; };
  }, []);

  const { startUpload, isUploading } = useUploadThing("profilePhoto", {
    onClientUploadComplete: (res: { serverData?: { avatarUrl?: string }; ufsUrl?: string }[]) => {
      const url = res?.[0]?.serverData?.avatarUrl ?? res?.[0]?.ufsUrl ?? null;
      setErr(null);
      if (url) setMe((m) => (m ? { ...m, avatarUrl: url } : m));
    },
    onUploadError: (e: Error) => setErr(e.message || "Upload failed"),
  });

  if (!me?.uploadsEnabled && !me?.avatarUrl) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <button
        type="button"
        title={me.avatarUrl ? "Change photo" : "Add a photo"}
        onClick={() => fileRef.current?.click()}
        disabled={isUploading || !me.uploadsEnabled}
        style={{
          width: 84, height: 84, borderRadius: "50%", padding: 0, overflow: "hidden",
          border: "1px solid var(--line)", background: "var(--surface)",
          cursor: me.uploadsEnabled ? "pointer" : "default", display: "grid", placeItems: "center",
        }}
      >
        {me.avatarUrl
          ? <img src={me.avatarUrl} alt="Profile photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: isUploading ? 0.5 : 1 }} />
          : <Icon name="plus" size={22} color="var(--ink-3)" />}
      </button>
      {me.uploadsEnabled && (
        <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
          {isUploading ? "Uploading…" : me.avatarUrl ? "Change photo" : "Add a photo"}
        </span>
      )}
      {err && <span style={{ fontSize: 11.5, color: "var(--err, #b3261e)", maxWidth: 140, textAlign: "center" }}>{err}</span>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void startUpload([file]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

const TYPE_ICON: Record<string, IconName> = { video: "video", audio: "mic", letter: "pen" };
const DELETE_MSG = `mutation($id: uuid!) { delete_app_messages_by_pk(id: $id) { id } }`;

export function Dashboard() {
  const account=useAccountContext();
  const navigate = useNavigate();
  const [d, setD] = useState<Data | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    let active = true;
    gql<Data>(Q).then((r) => active && setD(r));
    return () => { active = false; };
  }, []);

  async function removeMessage(id: string, title: string) {
    const ok = await confirm({
      title: "Delete this message?",
      message: `"${title}" will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete message",
      tone: "danger",
    });
    if (!ok) return;
    setD((prev) => (prev ? { ...prev, app_messages: prev.app_messages.filter((m) => m.id !== id) } : prev));
    await gql(DELETE_MSG, { id }).catch(() => {});
    await gql<Data>(Q).then(setD); // authoritative reconcile with the DB
  }

  const reg = d?.app_registrants[0];
  const firstName = reg?.legal_name?.split(" ")[0] ?? "there";
  const sealed = reg?.account_state === "active_sealed";
  const advAccepted = d?.app_advocates.filter((a) => a.invite_status === "accepted").length ?? 0;
  const ready = d?.app_messages.filter((m) => m.status === "ready").length ?? 0;
  const failedMessages = d?.app_messages.filter((m) => m.status === "failed").length ?? 0;
  const processingMessages = (d?.app_messages.length ?? 0) - ready - failedMessages;
  if(account?.status.accountState === "released") return <RemembranceDashboard messages={d?.app_messages ?? []} />;

  return (
    <div style={{ padding: "56px 64px 80px", maxWidth: 1020, margin: "0 auto" }}>
      <header style={{ marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
        <div>
          {reg?.account_state === "onboarding" && (
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.14em" }}>
              SETUP IN PROGRESS
            </div>
          )}
          <h1 className="serif" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.04, margin: "8px 0 0" }}>
            {account?.status.accountState === "in_verification" ? passingHeading(account.status) : `Good morning, ${firstName}.`}
          </h1>
          <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--ink-2)", lineHeight: 1.4, maxWidth: 620, margin: "12px 0 0", fontWeight: 400 }}>
            {account?.status.accountState === "in_verification" ? "A passing report is being verified. Check with the advocates before making changes." : sealed
              ? "Everything is in place. There's nothing you need to do today — unless you want to add a thought."
              : "A few steps left. Finish setting up to seal your account."}
          </p>
        </div>
        <ProfilePhoto />
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, padding: "24px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 56 }}>
        <Status icon="check" label="Identity verified" sub={reg ? reg.legal_name : "—"} ok />
        <Status icon="shield" label="Advocates confirmed"
          sub={(d?.app_advocates.length ?? 0) === 0 ? "Add your advocates →" : `${advAccepted} of ${d?.app_advocates.length} accepted`}
          ok={advAccepted >= 2} onClick={() => navigate("/advocates")} />
        <Status icon="lock" label="Secure messages"
          sub={(d?.app_messages.length ?? 0) === 0
            ? "Write your first →"
            : [ready && `${ready} ready`, processingMessages && `${processingMessages} processing`, failedMessages && `${failedMessages} failed`].filter(Boolean).join(" · ")}
          ok={ready > 0} onClick={() => navigate("/compose")} />
      </section>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em" }}>Your messages</h2>
        <button className="ll-btn ghost" onClick={() => navigate("/compose")}><Icon name="plus" size={14} /> Write a new one</button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 56px" }}>
        {!d && <li style={{ color: "var(--ink-3)", padding: "18px 0" }}>Loading…</li>}
        {d && d.app_messages.length === 0 && (
          <li style={{ color: "var(--ink-3)", padding: "18px 0" }}>No messages yet — write your first one.</li>
        )}
        {d?.app_messages.map((m) => {
          const ok = m.status === "ready";
          const failed = m.status === "failed";
          return (
            <li key={m.id} onClick={() => navigate(`/messages/${m.id}`)}
              style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center", padding: "18px 0", borderBottom: "1px solid var(--line-soft)", cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--r-2)", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}>
                <Icon name={TYPE_ICON[m.type] ?? "pen"} size={16} color="var(--brand-purple)" />
              </div>
              <div>
                <div className="serif" style={{ fontSize: 20, fontWeight: 500 }}>{m.title ?? "Untitled message"}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", textTransform: "capitalize" }}>{m.type} · {m.audience_type}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: failed ? "var(--err)" : ok ? "var(--ok)" : "var(--warn)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name={ok ? "check" : "pen"} size={14} color={failed ? "var(--err)" : ok ? "var(--ok)" : "var(--warn)"} />
                  {failed ? "Failed — delete and retry" : ok ? "Ready" : "Processing"}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeMessage(m.id, m.title ?? "this message"); }}
                  title="Delete message"
                  style={{ background: "none", border: "none", color: "var(--ink-4)", cursor: "pointer", fontSize: 12 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--err)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-4)")}
                >
                  Delete
                </button>
                <Icon name="chev" size={16} color="var(--ink-4)" />
              </div>
            </li>
          );
        })}
      </ul>

      <div style={{ borderLeft: "2px solid var(--brand-purple)", padding: "0 4px 0 24px", maxWidth: 520 }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em" }}>A QUIET PROMPT</div>
        <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--ink-2)", lineHeight: 1.4, margin: "10px 0 16px" }}>
          Whose name have you been meaning to say out loud, and never quite did?
        </p>
        <button className="ll-btn ghost" onClick={() => navigate("/compose")}>Write to them →</button>
      </div>
    </div>
  );
}

function Status({ icon, label, sub, ok, onClick }: { icon: IconName; label: string; sub: string; ok?: boolean; onClick?: () => void }) {
  const link = !ok && onClick;
  return (
    <div onClick={onClick} style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: link ? "pointer" : "default" }}>
      <Icon name={icon} size={18} color={ok ? "var(--ok)" : "var(--ink-4)"} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: link ? "var(--brand-purple)" : "var(--ink-3)", fontWeight: link ? 500 : 400 }}>{sub}</div>
      </div>
    </div>
  );
}
