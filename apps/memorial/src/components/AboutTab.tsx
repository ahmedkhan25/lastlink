import { useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { Icon } from "@lastlink/ui";
import type { PublicMemorialPayload } from "@lastlink/shared";
import { getJson } from "../lib/api.js";
import { card } from "./styles.js";

export function AboutTab({ data, onOffer }: { data: PublicMemorialPayload; onOffer: (id: string) => void }) {
  const feature = data.offerings[0];
  return <div>
    {data.memorial.quote && <blockquote className="serif" style={{ fontStyle: "italic", fontSize: 34, lineHeight: 1.3, maxWidth: "22ch", margin: "0 0 32px" }}>“{data.memorial.quote}”</blockquote>}
    {data.memorial.story && <p style={{ maxWidth: "66ch", fontSize: 18, color: "var(--ink-2)", lineHeight: 1.75 }}>{data.memorial.story}</p>}
    {(data.memorial.serviceWhen || data.memorial.serviceDetails) && <div style={{ ...card, padding: "22px 24px", maxWidth: 720, marginTop: 28 }}><div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".12em" }}>Service & wishes</div>{data.memorial.serviceWhen && <div className="serif" style={{ fontSize: 23, margin: "6px 0 4px" }}>{data.memorial.serviceWhen}</div>}<div style={{ color: "var(--ink-2)" }}>{data.memorial.serviceDetails}</div></div>}
    {!!data.gallery.length && <section style={{ marginTop: 44 }}><h2 className="serif" style={{ fontSize: 30, fontWeight: 500 }}>A few favorite moments</h2><div className="memorial-gallery">{data.gallery.map((photo) => <figure key={photo.id} style={{ margin: 0 }}><img src={photo.url} alt={photo.altText ?? photo.caption ?? `A memory of ${data.memorial.displayName}`} /><figcaption>{photo.caption}</figcaption></figure>)}</div></section>}
    {!!data.publicMessages.length && <section style={{ marginTop: 44 }}><h2 className="serif" style={{ fontSize: 30, marginBottom: 4 }}>Shared with everyone</h2><p style={{ color: "var(--ink-3)", fontSize: 14 }}>Messages chosen to be part of this public remembrance.</p><div className="message-grid">{data.publicMessages.map((message) => <PublicMessageCard key={message.id} slug={data.memorial.slug} message={message} />)}</div></section>}
    {feature && <button className="offer-strip" onClick={() => onOffer(feature.id)}><img src={feature.imageUrl ?? undefined} alt="" /><span><span className="mono">{feature.sponsorLabel ?? "Remembrance partner"}</span><strong className="serif">{feature.title}</strong><small>{feature.description}</small></span><span className="ll-btn secondary">{feature.ctaLabel}</span></button>}
  </div>;
}

type PublicMessage = PublicMemorialPayload["publicMessages"][number];
type Playback = { playbackId: string; tokens: { playback: string; thumbnail: string; storyboard: string } };

function PublicMessageCard({ slug, message }: { slug: string; message: PublicMessage }) {
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const label = message.title ?? "A message for everyone";

  async function play() {
    setState("loading");
    try {
      const result = await getJson<Playback>(`/public/memorial/${encodeURIComponent(slug)}/message/${encodeURIComponent(message.id)}/playback`);
      setPlayback(result);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  if (message.type === "video" && playback) {
    return <article style={{ ...card, overflow: "hidden" }}>
      <div style={{ aspectRatio: "16 / 9", background: "#241D17" }}>
        <MuxPlayer playbackId={playback.playbackId} tokens={playback.tokens} autoPlay accentColor="#6B2CB0" style={{ height: "100%", width: "100%" }} />
      </div>
      <MessageLabel message={message} label={label} />
    </article>;
  }

  if (message.type === "video") {
    return <button type="button" onClick={play} disabled={state === "loading"} aria-label={`Play ${label}`} style={{ ...card, display: "block", width: "100%", padding: 0, overflow: "hidden", textAlign: "left", color: "inherit", cursor: state === "loading" ? "wait" : "pointer" }}>
      <div style={{ height: 118, background: "var(--brand-grad-soft)", display: "grid", placeItems: "center", gap: 8, alignContent: "center" }}>
        <Icon name="play" size={30} color="var(--brand-purple)" />
        <span className="mono" style={{ fontSize: 10, color: state === "error" ? "var(--err)" : "var(--brand-purple)", letterSpacing: ".08em" }}>
          {state === "loading" ? "OPENING VIDEO…" : state === "error" ? "VIDEO UNAVAILABLE — TRY AGAIN" : "PLAY PUBLIC VIDEO"}
        </span>
      </div>
      <MessageLabel message={message} label={label} />
    </button>;
  }

  return <article style={{ ...card, overflow: "hidden" }}><div style={{ height: 118, background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}><Icon name="pen" size={30} color="var(--brand-purple)" /></div><MessageLabel message={message} label={label} /></article>;
}

function MessageLabel({ message, label }: { message: PublicMessage; label: string }) {
  return <div style={{ padding: 16 }}><div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase" }}>{message.type}{message.durationSeconds ? ` · ${Math.ceil(message.durationSeconds / 60)} min` : ""}</div><div className="serif" style={{ fontSize: 20, marginTop: 4 }}>{label}</div></div>;
}
