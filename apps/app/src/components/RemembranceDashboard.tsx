import { Link } from "react-router-dom";
import { Icon } from "@lastlink/ui";
import { emailStatusLabel, type AccountStatus } from "@lastlink/shared";
import { useAccountContext } from "../lib/account-context.js";
import { useState } from "react";
import { manageAccount } from "../lib/api.js";
import { isAdministrator } from "../lib/administrator.js";

const dateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) +
  ` (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
function dateOnly(value: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
interface Message {
  id: string;
  title: string | null;
  type: string;
  audience_type: string;
}
export function RemembranceDashboard({ messages }: { messages: Message[] }) {
  const context = useAccountContext();
  if (!context) return null;
  const { status, administrator } = context;
  return (
    <div style={{ padding: "48px 56px 72px", maxWidth: 1100, margin: "0 auto" }}>
      <header
        style={{
          padding: "36px 40px",
          border: "1px solid var(--line)",
          borderRadius: 24,
          background: "linear-gradient(125deg,#f1eaf8,#faf7f1 70%)",
        }}
      >
        <Icon name="candle" size={26} color="var(--brand-purple)" />
        <p
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: ".18em",
            color: "var(--ink-3)",
            margin: "22px 0 10px",
          }}
        >
          IN LOVING MEMORY OF
        </p>
        <h1
          className="serif"
          style={{ fontSize: "clamp(36px,4vw,58px)", fontWeight: 500, margin: 0, lineHeight: 1.1 }}
        >
          {status.legalName}
        </h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "16px 0" }}>
          {status.case?.reportedDate
            ? `Passed away ${dateOnly(status.case.reportedDate)}`
            : "Date of passing not recorded"}
        </p>
        <p
          className="serif"
          style={{ fontSize: 22, fontStyle: "italic", color: "var(--ink-3)", margin: "20px 0 0" }}
        >
          Their words are preserved. Their memory lives on.
        </p>
      </header>
      <section
        style={{ padding: "22px 4px", borderBottom: "1px solid var(--line)", marginBottom: 24 }}
      >
        <div style={{ display: "flex", gap: 9, alignItems: "center", fontWeight: 500 }}>
          <Icon name="shield" size={17} color="var(--ok)" />
          {status.case?.confirmations.length === 2
            ? "Passing confirmed by both advocates"
            : "Passing confirmation record"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 36px", marginTop: 12 }}>
          {status.case?.confirmations.map((c) => (
            <div key={c.slot}>
              <div style={{ fontSize: 14 }}>
                {c.name} <span style={{ color: "var(--ink-3)" }}>· Advocate {c.slot}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                {dateTime(c.confirmedAt)}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 0 }}>
          Reported date of passing above; confirmation times show when each advocate confirmed.{" "}
          {status.case?.releasedAt && `Release recorded ${dateTime(status.case.releasedAt)}.`}
        </p>
      </section>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
        <Link className="ll-btn grad" to="/memorial/settings">
          Manage memorial
        </Link>
        <Link className="ll-btn secondary" to="/condolences">
          Review visitor memories
        </Link>
        <Link className="ll-btn secondary" to="/contacts">
          Manage contacts
        </Link>
      </div>
      {!administrator && (
        <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
          This is the account owner login. Advocates should use their own emailed administrator
          links.
        </p>
      )}
      <section id="messages">
        <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, marginBottom: 4 }}>
          Messages left with love
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
          No new messages can be created. Existing messages stay unchanged; administrators can
          send the released Public messages to contacts who were missed.
        </p>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              gap: 14,
              padding: "16px 0",
              borderBottom: "1px solid var(--line-soft)",
              alignItems: "center",
            }}
          >
            <Icon
              name={m.type === "video" ? "video" : "pen"}
              size={20}
              color="var(--brand-purple)"
            />
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 21 }}>
                {m.title || "Untitled message"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", textTransform: "capitalize" }}>
                {m.type} · {m.audience_type}
              </div>
            </div>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Preserved · Read-only</span>
          </div>
        ))}
      </section>
      <DeliveryStatus status={status} />
    </div>
  );
}
function DeliveryStatus({ status }: { status: AccountStatus }) {
  const [retrying, setRetrying] = useState(false),
    [notice, setNotice] = useState("");
  async function retry() {
    setRetrying(true);
    try {
      const r = await manageAccount({ action: "delivery-retry" });
      setNotice(
        `${r.emails.accepted} email(s) sent; ${r.emails.failed} still need attention. Status refreshes shortly.`,
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not retry");
    } finally {
      setRetrying(false);
    }
  }
  return (
    <section style={{ marginTop: 32 }}>
      <h2 className="serif" style={{ fontSize: 26, fontWeight: 500 }}>
        Message email delivery
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
        A recorded release is not proof of email delivery. These are the latest recorded provider
        statuses.
      </p>
      {isAdministrator() &&
        status.deliveries.some((d) => ["queued", "failed"].includes(d.status)) && (
          <button className="ll-btn secondary" disabled={retrying} onClick={retry}>
            {retrying ? "Retrying…" : "Retry pending public-message emails"}
          </button>
        )}
      {notice && <p role="status">{notice}</p>}
      {status.deliveries.map((d) => (
        <div
          key={d.id}
          style={{
            padding: "13px 16px",
            marginTop: 8,
            border: "1px solid var(--line)",
            borderRadius: 12,
            background: "var(--surface)",
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 14 }}>
              {d.recipientName} · {d.email}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 4,
                textTransform: "capitalize",
              }}
            >
              {d.type} · {d.title}
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              color: ["bounced", "failed", "complained"].includes(d.status)
                ? "var(--err)"
                : "var(--ink-2)",
            }}
          >
            {emailStatusLabel(d.status)}
          </div>
        </div>
      ))}
      {!status.deliveries.length && <p>No recipient emails were queued for this release.</p>}
    </section>
  );
}
