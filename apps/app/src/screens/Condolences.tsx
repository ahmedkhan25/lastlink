import { useCallback, useEffect, useState } from "react";
import { gql, manageAccount } from "../lib/api.js";
import { isAdministrator } from "../lib/administrator.js";
import { MemorialHead, MemorialTabs, card, page } from "./memorial/shared.js";

interface Condolence {
  id: string;
  author_name: string;
  author_email: string | null;
  relationship: string | null;
  body: string;
  image_url: string | null;
  status: "pending" | "approved" | "hidden";
  created_at: string;
}
interface Data { app_condolences: Condolence[] }
const QUERY = `query MemorialCondolences { app_condolences(order_by: {created_at: desc}) { id author_name author_email relationship body image_url status created_at } }`;
const REVIEW = `mutation ReviewCondolence($id: uuid!, $status: String!, $at: timestamptz!) { update_app_condolences_by_pk(pk_columns: {id: $id}, _set: {status: $status, reviewed_at: $at}) { id } }`;

export function Condolences() {
  const [items, setItems] = useState<Condolence[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => gql<Data>(QUERY).then((data) => setItems(data.app_condolences)), []);
  useEffect(() => { load().catch((err) => setError(String(err))); }, [load]);
  async function review(id: string, status: "approved" | "hidden") {
    setBusy(id); setError(null);
    try { if(isAdministrator()) await manageAccount({action:"condolence-review",id,status}); else await gql(REVIEW, { id, status, at: new Date().toISOString() }); await load(); }
    catch (err) { setError(String(err)); } finally { setBusy(null); }
  }
  const pending = items.filter((item) => item.status === "pending");
  const published = items.filter((item) => item.status === "approved");
  return <div style={page}>
    <MemorialHead title="Visitor memories" sub="Review comments and images before they appear on this test user's memorial." />
    <MemorialTabs />
    <Count pending={pending.length} published={published.length} />
    <List title="Awaiting review" empty="New visitor memories will appear here." items={pending} busy={busy} onReview={review} />
    <List title="Published" empty="No memories have been published yet." items={published} busy={busy} onReview={review} published />
    {error && <p style={{ color: "var(--err)" }}>{error}</p>}
  </div>;
}

function Count({ pending, published }: { pending: number; published: number }) { return <div style={{ display: "flex", gap: 10, margin: "22px 0 16px" }}><Chip text={`${pending} awaiting review`} warn /><Chip text={`${published} published`} /></div>; }
function Chip({ text, warn }: { text: string; warn?: boolean }) { return <span className="mono" style={{ fontSize: 10, letterSpacing: ".1em", padding: "5px 11px", borderRadius: "var(--r-pill)", background: warn ? "rgba(192,120,42,.14)" : "rgba(47,122,85,.14)", color: warn ? "var(--warn)" : "var(--ok)" }}>{text}</span>; }

function List({ title, empty, items, busy, onReview, published }: { title: string; empty: string; items: Condolence[]; busy: string | null; onReview: (id: string, status: "approved" | "hidden") => void; published?: boolean }) {
  return <section style={{ ...card, overflow: "hidden", marginBottom: 16 }}><div className="serif" style={{ fontSize: 22, padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>{title}</div>{!items.length && <div style={{ padding: 20, color: "var(--ink-3)", fontSize: 13 }}>{empty}</div>}{items.map((item) => <article key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "18px 20px", borderTop: "1px solid var(--line-soft)" }}><div><div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}><span className="serif" style={{ fontSize: 19 }}>{item.author_name}</span>{item.relationship && <span style={{ color: "var(--ink-3)", fontSize: 12 }}>{item.relationship}</span>}<span className="mono" style={{ color: "var(--ink-3)", fontSize: 9 }}>{new Date(item.created_at).toLocaleDateString()}</span></div>{item.author_email && <div style={{ color: "var(--ink-3)", fontSize: 11 }}>{item.author_email}</div>}<p style={{ margin: "8px 0", color: "var(--ink-2)" }}>{item.body}</p>{item.image_url && <img src={item.image_url} alt="Submitted memory" style={{ width: 150, height: 100, objectFit: "cover", borderRadius: "var(--r-2)" }} />}</div><div style={{ display: "flex", gap: 7, alignItems: "center" }}>{!published && <button className="ll-btn grad" disabled={busy === item.id} onClick={() => onReview(item.id, "approved")} style={{ padding: "7px 13px" }}>Approve</button>}<button className="ll-btn secondary" disabled={busy === item.id} onClick={() => onReview(item.id, "hidden")} style={{ padding: "7px 13px" }}>Hide</button></div></article>)}</section>;
}
