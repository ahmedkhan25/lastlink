import { useState, type CSSProperties } from "react";
import { Icon } from "@lastlink/ui";

// Presentational public memorial page. Renders from local fixtures — no backend.
// The real build resolves a slug and reads a `memorials` table + approved condolences.
const PERSON = {
  name: "Daniel Rourke",
  dates: "1962 — 2026",
  relation: "Father, carpenter, and the loudest laugh in any room. Dublin, Ireland.",
  quote: "Be kind. It costs nothing, and it outlives you.",
  story:
    "He built things with his hands and made everyone feel like the most interesting person in the room. He loved terrible puns, strong coffee, and his family — roughly in reverse order, though he'd never admit it.",
  service: "St. Mary's, Haddington Road, Dublin. No flowers, by his request — a donation to the hospice that cared for him means more.",
  serviceWhen: "Saturday 14 June, 11:00",
};

const CONDOLENCES = [
  { name: "Sarah Chen", rel: "Colleague & friend", when: "2 days ago", msg: "He was the kindest man I ever worked with, and the most patient teacher. I still hear his voice when I measure twice. I'll miss him terribly." },
  { name: "Michael Rivera", rel: "Neighbour", when: "3 days ago", msg: "Thinking of the whole family. Daniel talked about you all constantly — you were his proudest work by a mile." },
  { name: "Aunt Peggy", rel: "Family", when: "4 days ago", msg: "From a boy who couldn't sit still to a man who held everyone together. Rest easy, Danny." },
];

const OFFERINGS = [
  { t: "Send flowers", d: "A quiet arrangement delivered to the service, through a local florist.", p: "From €45" },
  { t: "Donate to the hospice", d: "In lieu of flowers, as Daniel asked. Every euro goes to Our Lady's Hospice.", p: "Any amount" },
  { t: "Plant a tree in his name", d: "A native oak in the Wicklow hills he walked every Sunday.", p: "€30" },
];

type Tab = "about" | "condolences" | "remember";
const card: CSSProperties = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", boxShadow: "var(--shadow-1)" };
const wrap: CSSProperties = { maxWidth: 1000, margin: "0 auto", padding: "0 24px" };

export function Memorial() {
  const [tab, setTab] = useState<Tab>("about");
  return (
    <div style={{ minHeight: "100%", background: "var(--bg)", color: "var(--ink)" }}>
      {/* preview strip — honest that this is a not-yet-wired page */}
      <div className="mono" style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.12em", padding: "6px", color: "var(--brand-purple)", background: "var(--brand-grad-soft)" }}>
        PREVIEW · PUBLIC MEMORIAL PAGE · PRESENTATIONAL
      </div>

      <header style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px" }}>
        <div className="serif" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 600 }}>
          <img src="/assets/lastlink-mark.png" alt="" style={{ height: 24 }} /> LastLink
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>In memory</div>
      </header>

      {/* portrait + identity */}
      <section style={{ ...wrap, display: "flex", gap: 26, padding: "20px 24px 8px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <img
          src="/assets/daniel.jpg"
          alt={`Portrait of ${PERSON.name}`}
          style={{ width: 150, height: 184, objectFit: "cover", borderRadius: "var(--r-3)", border: "1px solid var(--line)", boxShadow: "var(--shadow-1)" }}
        />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>A life remembered</div>
          <div className="serif" style={{ fontSize: 58, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.02 }}>{PERSON.name}</div>
          <div className="serif" style={{ fontStyle: "italic", fontSize: 22, color: "var(--ink-3)", marginTop: 4 }}>{PERSON.dates}</div>
          <div style={{ marginTop: 14, fontSize: 15, color: "var(--ink-2)", maxWidth: "52ch" }}>{PERSON.relation}</div>
        </div>
      </section>

      {/* tabs */}
      <nav style={{ ...wrap, display: "flex", gap: 28, borderBottom: "1px solid var(--line)", marginTop: 22, padding: "0 24px" }}>
        {([["about", "About"], ["condolences", "Condolences"], ["remember", "Remember them"]] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="mono"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: tab === id ? "var(--ink)" : "var(--ink-3)", padding: "12px 2px 14px", borderBottom: `2px solid ${tab === id ? "var(--brand-purple)" : "transparent"}`, marginBottom: -1 }}
          >
            {label}
          </button>
        ))}
      </nav>

      <main style={{ ...wrap, padding: "36px 24px 80px" }}>
        {tab === "about" && (
          <div>
            <p className="serif" style={{ fontStyle: "italic", fontSize: 32, lineHeight: 1.35, maxWidth: "20ch", margin: "0 0 32px" }}>“{PERSON.quote}”</p>
            <p style={{ maxWidth: "62ch", fontSize: 18, color: "var(--ink-2)", lineHeight: 1.7, margin: "0 0 28px" }}>{PERSON.story}</p>
            <div style={{ ...card, padding: "22px 24px", maxWidth: "62ch" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>Service &amp; wishes</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500, margin: "6px 0 4px" }}>{PERSON.serviceWhen}</div>
              <div style={{ color: "var(--ink-2)" }}>{PERSON.service}</div>
            </div>

            <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, margin: "44px 0 4px" }}>Shared with everyone</h2>
            <p style={{ color: "var(--ink-3)", fontSize: 14, margin: "0 0 20px" }}>Messages Daniel chose to make public. Private ones went straight to each person.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
              {[{ icon: "play" as const, k: "Video · 2:14", t: "To everyone who knew me" }, { icon: "pen" as const, k: "Letter", t: "A few last thoughts" }].map((m) => (
                <div key={m.t} style={{ ...card, overflow: "hidden" }}>
                  <div style={{ height: 120, background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}>
                    <Icon name={m.icon} size={30} color="var(--brand-purple)" />
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{m.k}</div>
                    <div className="serif" style={{ fontSize: 19, fontWeight: 500, marginTop: 4 }}>{m.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "condolences" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }} className="cond-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {CONDOLENCES.map((c) => (
                <article key={c.name} style={{ ...card, padding: "20px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <span className="serif" style={{ fontSize: 20, fontWeight: 500 }}>{c.name}</span>
                    <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{c.when}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>{c.rel}</div>
                  <p style={{ marginTop: 10, color: "var(--ink-2)", fontSize: 16, lineHeight: 1.6 }}>{c.msg}</p>
                </article>
              ))}
            </div>
            <aside style={{ ...card, padding: 24 }}>
              <div className="serif" style={{ fontSize: 24, fontWeight: 500 }}>Share a memory</div>
              <p style={{ color: "var(--ink-3)", fontSize: 13, margin: "2px 0 18px" }}>A few words the family will treasure. It'll appear once approved.</p>
              <Field label="Your name" placeholder="e.g. Sarah Chen" />
              <Field label="Email (not shown publicly)" placeholder="you@example.com" />
              <label style={{ display: "block", marginBottom: 14 }}>
                <span className="mono" style={fieldLabel}>Your message</span>
                <textarea placeholder="A memory, a thank you, a goodbye…" style={{ ...input, minHeight: 96, resize: "vertical" }} />
              </label>
              <button className="ll-btn grad" style={{ width: "100%", justifyContent: "center" }}>Leave your message</button>
              <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 12, fontSize: 12, color: "var(--ink-3)" }}>
                <Icon name="shield" size={14} color="var(--ink-3)" />
                <span>Messages are reviewed before they appear, to keep this page gentle for the family.</span>
              </div>
            </aside>
          </div>
        )}

        {tab === "remember" && (
          <div>
            <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, margin: 0 }}>Remember them</h2>
            <p style={{ color: "var(--ink-3)", fontSize: 14, margin: "4px 0 22px" }}>Ways to honour Daniel, chosen with the family. No pressure, ever.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
              {OFFERINGS.map((o) => (
                <div key={o.t} style={{ ...card, padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "var(--r-2)", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}><Icon name="heart" size={20} color="var(--brand-purple)" /></div>
                  <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{o.t}</div>
                  <div style={{ color: "var(--ink-3)", fontSize: 14, flex: 1 }}>{o.d}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                    <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{o.p}</span>
                    <button className="ll-btn secondary" style={{ padding: "6px 13px", fontSize: 13 }}>Choose</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
        <div style={{ ...wrap, padding: "26px 24px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--ink-2)", fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ok)" }} />
            Verified by two advocates · passing confirmed 11 June 2026
          </div>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>LastLink · the link expires, the message stays</div>
        </div>
      </footer>
    </div>
  );
}

const fieldLabel: CSSProperties = { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", display: "block", marginBottom: 6 };
const input: CSSProperties = { width: "100%", font: "inherit", color: "var(--ink)", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: "var(--r-2)", padding: "10px 12px" };

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span className="mono" style={fieldLabel}>{label}</span>
      <input placeholder={placeholder} style={input} />
    </label>
  );
}
