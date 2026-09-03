import type { PublicMemorialPayload } from "@lastlink/shared";
import { ContributionForm } from "./ContributionForm.js";
import { card } from "./styles.js";

export function CondolencesTab({ data }: { data: PublicMemorialPayload }) {
  return <div className="cond-grid"><div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{data.condolences.map((item) => <article key={item.id} style={{ ...card, padding: "20px 22px" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}><span className="serif" style={{ fontSize: 21 }}>{item.authorName}</span><span className="mono" style={{ color: "var(--ink-3)", fontSize: 9 }}>{new Date(item.createdAt).toLocaleDateString()}</span></div>{item.relationship && <div style={{ color: "var(--ink-3)", fontSize: 12 }}>{item.relationship}</div>}<p style={{ color: "var(--ink-2)", fontSize: 16, lineHeight: 1.65 }}>{item.body}</p>{item.imageUrl && <img src={item.imageUrl} alt={`Shared by ${item.authorName}`} style={{ width: "100%", maxHeight: 340, objectFit: "cover", borderRadius: "var(--r-2)" }} />}</article>)}{!data.condolences.length && <div style={{ ...card, padding: 28, color: "var(--ink-3)" }}>Be the first to share a memory of {data.memorial.displayName}.</div>}</div><ContributionForm slug={data.memorial.slug} /></div>;
}
