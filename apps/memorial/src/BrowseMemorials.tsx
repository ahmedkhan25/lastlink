import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Logo } from "@lastlink/ui";
import type { PublicMemorialSummary } from "@lastlink/shared";
import { getJson } from "./lib/api.js";
import { card, input, wrap } from "./components/styles.js";

const MARKETING = import.meta.env.VITE_MARKETING_URL ?? "https://lastlink-marketing.onrender.com";

export function BrowseMemorials() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const [draft, setDraft] = useState(query);
  const [items, setItems] = useState<PublicMemorialSummary[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    setState("loading");
    getJson<{ memorials: PublicMemorialSummary[] }>(`/public/memorials?q=${encodeURIComponent(query)}`)
      .then((data) => { if (active) { setItems(data.memorials); setState("ready"); } })
      .catch(() => active && setState("error"));
    return () => { active = false; };
  }, [query]);

  return <div style={{ minHeight: "100%", background: "var(--bg)", color: "var(--ink)" }}>
    <header style={{ ...wrap, display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 22, paddingBottom: 22 }}>
      <a href={MARKETING} aria-label="LastLink home"><Logo size={22} /></a>
      <a href={MARKETING} className="ll-btn ghost">About LastLink</a>
    </header>
    <main style={{ ...wrap, paddingTop: 48, paddingBottom: 90 }}>
      <div className="mono" style={{ color: "var(--ink-3)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase" }}>Public memorials</div>
      <h1 className="serif browse-title" style={{ fontSize: 56, lineHeight: 1.04, fontWeight: 500, margin: "10px 0 12px" }}>Find a life remembered.</h1>
      <p style={{ color: "var(--ink-2)", fontSize: 17, maxWidth: 620, margin: "0 0 28px" }}>Search by name or location. Only memorials a family has chosen to make public appear here.</p>
      <form className="memorial-search" onSubmit={(event) => { event.preventDefault(); setParams(draft.trim() ? { q: draft.trim() } : {}); }}>
        <input aria-label="Search memorials" style={{ ...input, fontSize: 16, padding: "13px 15px" }} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search a name or location" />
        <button className="ll-btn grad" type="submit">Search</button>
      </form>

      <div style={{ marginTop: 38 }}>
        {state === "loading" && <p style={{ color: "var(--ink-3)" }}>Looking through public memorials…</p>}
        {state === "error" && <p style={{ color: "var(--err)" }}>We couldn't load memorials. Please try again.</p>}
        {state === "ready" && !items.length && <div style={{ ...card, padding: 28 }}><div className="serif" style={{ fontSize: 25 }}>No public memorials found.</div><p style={{ color: "var(--ink-3)", marginBottom: 0 }}>Try a different name or location.</p></div>}
        {state === "ready" && !!items.length && <div className="browse-grid">{items.map((item) => <MemorialCard key={item.slug} item={item} />)}</div>}
      </div>
    </main>
    <footer style={{ borderTop: "1px solid var(--line)", color: "var(--ink-3)" }}><div style={{ ...wrap, paddingTop: 24, paddingBottom: 24, fontSize: 12 }}>Public memorials shared through LastLink</div></footer>
  </div>;
}

function MemorialCard({ item }: { item: PublicMemorialSummary }) {
  const dates = [item.birthYear, item.deathYear].filter(Boolean).join(" — ");
  const image = item.portraitUrl ?? item.coverImageUrl;
  return <a href={`/${item.slug}`} style={{ ...card, display: "block", overflow: "hidden", color: "inherit", textDecoration: "none" }}>
    <div style={{ height: 210, background: "var(--brand-grad-soft)" }}>{image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="serif" style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 58, color: "var(--brand-purple)" }}>{item.displayName.charAt(0)}</div>}</div>
    <div style={{ padding: 20 }}><h2 className="serif" style={{ fontSize: 27, margin: 0, fontWeight: 500 }}>{item.displayName}</h2>{dates && <div className="serif" style={{ color: "var(--ink-3)", fontStyle: "italic", marginTop: 3 }}>{dates}</div>}<p style={{ color: "var(--ink-2)", lineHeight: 1.5, minHeight: 42 }}>{item.headline}</p>{item.location && <div className="mono" style={{ color: "var(--ink-3)", fontSize: 9, letterSpacing: ".09em", textTransform: "uppercase" }}>{item.location}</div>}</div>
  </a>;
}
