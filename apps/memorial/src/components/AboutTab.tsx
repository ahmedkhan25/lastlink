import { Icon } from "@lastlink/ui";
import type { PublicMemorialPayload } from "@lastlink/shared";
import { card } from "./styles.js";

export function AboutTab({ data, onOffer }: { data: PublicMemorialPayload; onOffer: (id: string) => void }) {
  const feature = data.offerings[0];
  return <div>
    {data.memorial.quote && <blockquote className="serif" style={{ fontStyle: "italic", fontSize: 34, lineHeight: 1.3, maxWidth: "22ch", margin: "0 0 32px" }}>“{data.memorial.quote}”</blockquote>}
    {data.memorial.story && <p style={{ maxWidth: "66ch", fontSize: 18, color: "var(--ink-2)", lineHeight: 1.75 }}>{data.memorial.story}</p>}
    {(data.memorial.serviceWhen || data.memorial.serviceDetails) && <div style={{ ...card, padding: "22px 24px", maxWidth: 720, marginTop: 28 }}><div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".12em" }}>Service & wishes</div>{data.memorial.serviceWhen && <div className="serif" style={{ fontSize: 23, margin: "6px 0 4px" }}>{data.memorial.serviceWhen}</div>}<div style={{ color: "var(--ink-2)" }}>{data.memorial.serviceDetails}</div></div>}
    {!!data.gallery.length && <section style={{ marginTop: 44 }}><h2 className="serif" style={{ fontSize: 30, fontWeight: 500 }}>A few favorite moments</h2><div className="memorial-gallery">{data.gallery.map((photo) => <figure key={photo.id} style={{ margin: 0 }}><img src={photo.url} alt={photo.altText ?? photo.caption ?? `A memory of ${data.memorial.displayName}`} /><figcaption>{photo.caption}</figcaption></figure>)}</div></section>}
    {!!data.publicMessages.length && <section style={{ marginTop: 44 }}><h2 className="serif" style={{ fontSize: 30, marginBottom: 4 }}>Shared with everyone</h2><p style={{ color: "var(--ink-3)", fontSize: 14 }}>Messages chosen to be part of this public remembrance.</p><div className="message-grid">{data.publicMessages.map((message) => <article key={message.id} style={{ ...card, overflow: "hidden" }}><div style={{ height: 118, background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}><Icon name={message.type === "video" ? "play" : "pen"} size={30} color="var(--brand-purple)" /></div><div style={{ padding: 16 }}><div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase" }}>{message.type}{message.durationSeconds ? ` · ${Math.ceil(message.durationSeconds / 60)} min` : ""}</div><div className="serif" style={{ fontSize: 20, marginTop: 4 }}>{message.title ?? "A message for everyone"}</div></div></article>)}</div></section>}
    {feature && <button className="offer-strip" onClick={() => onOffer(feature.id)}><img src={feature.imageUrl ?? undefined} alt="" /><span><span className="mono">{feature.sponsorLabel ?? "Remembrance partner"}</span><strong className="serif">{feature.title}</strong><small>{feature.description}</small></span><span className="ll-btn secondary">{feature.ctaLabel}</span></button>}
  </div>;
}
