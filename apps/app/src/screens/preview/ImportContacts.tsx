import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@lastlink/ui";
import { getApi, postApi } from "../../lib/api.js";
import { Flag, GoogleMark, page, card } from "./_shared.js";

// Contact import. The connect step is simulated (see apps/api/src/contacts-import.ts)
// but everything after it is real: the directory is fetched from the API, deduped
// against contacts already in the database, and the people you tick are written —
// contact row, group, and membership — before this screen hands off to /contacts.

type Provider = "google";

interface Row {
  external_id: string;
  full_name: string;
  email: string;
  relationship: string;
  group: string;
  already: boolean;
}

interface Preview {
  provider: Provider;
  label: string;
  account: string;
  contacts: Row[];
  newCount: number;
  alreadyCount: number;
}

const GRID = "34px 1.15fr 1.5fr 1fr 0.9fr";

export function ImportContacts() {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState<Provider | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect(provider: Provider) {
    setConnecting(provider);
    setError(null);
    setPreview(null);
    try {
      const data = await getApi<Preview>(`/api/contacts/import/${provider}`);
      setPreview(data);
      // Everyone new is ticked by default; anyone already saved starts unticked.
      setPicked(new Set(data.contacts.filter((c) => !c.already).map((c) => c.external_id)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not reach the provider";
      setError(
        /not found/i.test(msg)
          ? "Contact import is off in this environment — set DEMO_CONTACT_IMPORT=true on the API."
          : msg,
      );
    } finally {
      setConnecting(null);
    }
  }

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save() {
    if (!preview || picked.size === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      await postApi(`/api/contacts/import/${preview.provider}`, { externalIds: [...picked] });
      navigate("/contacts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save these contacts");
      setSaving(false);
    }
  }

  const selectableIds = preview?.contacts.filter((c) => !c.already).map((c) => c.external_id) ?? [];
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => picked.has(id));

  return (
    <div style={page}>
      <div>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.14em" }}>Contacts · import</div>
        <h1 className="serif" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.05, margin: "8px 0 0" }}>
          Import contacts
        </h1>
        <p style={{ color: "var(--ink-3)", fontSize: 15, margin: "10px 0 0", maxWidth: "60ch" }}>
          Bring people in from a connected account instead of typing each one. Review and untick anyone
          you don't want — nothing is saved until you confirm.
        </p>
      </div>

      <div style={{
        ...card, margin: "24px 0 8px", padding: 22, display: "flex", gap: 16, alignItems: "center",
        borderColor: preview ? "var(--brand-purple)" : "var(--line)",
      }}>
        <div style={{ width: 44, height: 44, borderRadius: "var(--r-2)", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}>
          <GoogleMark size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>Google Contacts</div>
          <div style={{ color: "var(--ink-3)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {preview ? `Connected as ${preview.account}` : "Sign in with Google to bring your address book across"}
          </div>
        </div>
        <button
          className={preview ? "ll-btn secondary" : "ll-btn grad"}
          style={{ padding: "8px 16px", fontSize: 13 }}
          disabled={connecting !== null}
          onClick={() => void connect("google")}
        >
          {connecting ? "Connecting…" : preview ? "Refresh" : "Connect Google"}
        </button>
      </div>

      {error && (
        <div style={{ ...card, padding: "12px 14px", marginTop: 12, fontSize: 13, color: "var(--err, #b3261e)", borderColor: "var(--err, #b3261e)" }}>
          {error}
        </div>
      )}

      {connecting && (
        <div style={{ ...card, padding: 28, marginTop: 16, textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>
          Asking Google for your contacts…
        </div>
      )}

      {preview && !connecting && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "26px 0 8px", gap: 12, flexWrap: "wrap" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em" }}>
              {preview.label} · {preview.newCount} new · {preview.alreadyCount} already in your contacts
            </div>
            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 13, color: "var(--ink-3)" }}>
              <input
                type="checkbox"
                checked={allSelected}
                disabled={selectableIds.length === 0}
                onChange={(e) => setPicked(e.target.checked ? new Set(selectableIds) : new Set())}
              />
              Select all new
            </label>
          </div>

          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "0 14px" }} className="mono">
              {["", "Name", "Email", "Group", "Relationship"].map((h, i) => (
                <div key={i} style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", padding: "12px 0 10px" }}>{h}</div>
              ))}
            </div>
            {preview.contacts.map((r) => (
              <label key={r.external_id} style={{
                display: "grid", gridTemplateColumns: GRID, padding: "12px 14px",
                borderTop: "1px solid var(--line)", alignItems: "center",
                opacity: r.already ? 0.55 : 1, cursor: r.already ? "default" : "pointer",
              }}>
                <input
                  type="checkbox"
                  checked={picked.has(r.external_id)}
                  disabled={r.already}
                  onChange={() => toggle(r.external_id)}
                />
                <div className="serif" style={{ fontSize: 15, fontWeight: 500 }}>{r.full_name}</div>
                <div style={{ color: "var(--ink-3)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis" }}>{r.email}</div>
                <div>
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.08em", padding: "3px 9px", borderRadius: "var(--r-pill)", background: "var(--line-soft)", color: "var(--ink-3)" }}>
                    {r.already ? "ALREADY ADDED" : r.group.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{r.relationship}</div>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <button className="ll-btn secondary" onClick={() => navigate("/contacts")}>Cancel</button>
            <button className="ll-btn grad" disabled={picked.size === 0 || saving} onClick={() => void save()}>
              {saving ? "Adding…" : `Add ${picked.size} contact${picked.size === 1 ? "" : "s"}`}
            </button>
          </div>
        </>
      )}

      <Flag>
        <b>Demo connector.</b> The Google sign-in is simulated and the directory is a fixed set of
        test users on <b>lastlink.care</b> — but the import is real: it dedupes by email against your
        saved contacts, and writes each person plus their <b>group</b> (Family, Close friends,
        Business) to the database. Those groups are what Compose addresses a message to. Wiring the
        live Google People API means swapping the fixture for a <code>contacts.readonly</code> fetch —
        the review and save steps stay as they are.
      </Flag>
    </div>
  );
}
