import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { PublicMemorialPayload } from "@lastlink/shared";
import { getJson } from "./lib/api.js";
import { MemorialHeader } from "./components/MemorialHeader.js";
import { AboutTab } from "./components/AboutTab.js";
import { CondolencesTab } from "./components/CondolencesTab.js";
import { OfferingModal, RememberTab } from "./components/RememberTab.js";
import { wrap } from "./components/styles.js";

type Tab = "about" | "condolences" | "remember";

export function Memorial() {
  const { slug } = useParams();
  const [data, setData] = useState<PublicMemorialPayload | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "not-found" | "error">("loading");
  const [tab, setTab] = useState<Tab>("about");
  const [offerId, setOfferId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    document.querySelector('meta[name="robots"]')?.setAttribute("content", "noindex,nofollow");
    if (!slug) { setState("not-found"); return; }
    getJson<PublicMemorialPayload>(`/public/memorial/${encodeURIComponent(slug)}`)
      .then((payload) => {
        if (!active) return;
        setData(payload); setState("ready");
        document.title = `In memory of ${payload.memorial.displayName} — LastLink`;
      })
      .catch((error: Error) => active && setState(error.message === "not-found" ? "not-found" : "error"));
    return () => { active = false; };
  }, [slug]);

  if (state === "loading") return <StatePage title="Opening this memorial…" />;
  if (state === "not-found") return <StatePage title="This memorial isn't available." body="Check the link with the person who shared it with you." />;
  if (state === "error" || !data) return <StatePage title="We couldn't open this memorial." body="Please wait a moment and try again." />;
  const offer = data.offerings.find((item) => item.id === offerId);

  return <div style={{ minHeight: "100%", background: "var(--bg)", color: "var(--ink)" }}>
    <MemorialHeader memorial={data.memorial} />
    <nav style={{ ...wrap, display: "flex", gap: 28, borderBottom: "1px solid var(--line)", marginTop: 22 }}>
      {([['about', 'About'], ['condolences', 'Memories'], ['remember', 'Remember them']] as [Tab, string][]).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className="mono" style={{ background: "none", border: "none", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: tab === id ? "var(--ink)" : "var(--ink-3)", padding: "12px 2px 14px", borderBottom: `2px solid ${tab === id ? "var(--brand-purple)" : "transparent"}`, marginBottom: -1 }}>{label}</button>)}
    </nav>
    <main style={{ ...wrap, paddingTop: 38, paddingBottom: 84 }}>
      {tab === "about" && <AboutTab data={data} onOffer={setOfferId} />}
      {tab === "condolences" && <CondolencesTab data={data} />}
      {tab === "remember" && <RememberTab offers={data.offerings} onOpen={setOfferId} />}
    </main>
    <footer style={{ borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}><div style={{ ...wrap, paddingTop: 25, paddingBottom: 25, display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", color: "var(--ink-3)", fontSize: 12 }}><span>Memorial shared through LastLink</span><span className="mono" style={{ fontSize: 9 }}>INVESTOR DEMO · TEST DATA</span></div></footer>
    {offer && <OfferingModal offer={offer} onClose={() => setOfferId(null)} />}
  </div>;
}

function StatePage({ title, body }: { title: string; body?: string }) {
  return <div style={{ minHeight: "100%", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}><div><div className="serif" style={{ fontSize: 36 }}>{title}</div>{body && <p style={{ color: "var(--ink-3)" }}>{body}</p>}</div></div>;
}
