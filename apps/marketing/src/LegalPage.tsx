import { Logo } from "@lastlink/ui";
import type { Block, LegalDoc, Run } from "./legal/types.js";

// Both policies cite the granted patent in their colophon; the importer strips
// that trailing line so the page chrome can render it once, consistently.
const PATENT = "US Patent No. 11,875,417 B1";

const slug = (n: string) => `section-${n}`;

export function LegalPage({ doc, other }: { doc: LegalDoc; other: { href: string; label: string } }) {
  const sections = doc.blocks.filter((b): b is Extract<Block, { k: "h2" }> => b.k === "h2");

  return (
    <div className="ll-marketing ll-legal" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "22px 64px", borderBottom: "1px solid var(--line-soft)",
        position: "sticky", top: 0, zIndex: 10,
        background: "color-mix(in oklab, var(--bg) 92%, transparent)", backdropFilter: "blur(8px)",
      }}>
        <a href="/"><Logo size={26} /></a>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href={other.href} className="ll-btn ghost ll-hide-mobile">{other.label}</a>
          <a href="/" className="ll-btn secondary">Back to lastlink.care</a>
        </div>
      </header>

      <section style={{ padding: "72px 64px 0", maxWidth: 1180, margin: "0 auto" }}>
        <div className="ll-eyebrow" style={{ marginBottom: 16 }}>Legal</div>
        <h1 className="serif" style={{
          fontSize: 64, lineHeight: 1.02, margin: "0 0 20px",
          letterSpacing: "-0.02em", fontWeight: 500,
        }}>
          {doc.meta.title}
        </h1>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", fontSize: 13, color: "var(--ink-3)" }}>
          {doc.meta.updated && <span>Last updated · {doc.meta.updated}</span>}
          {doc.meta.effective && <span>Effective · {doc.meta.effective}</span>}
          <span>{PATENT}</span>
        </div>
      </section>

      <section className="ll-legal-body" style={{
        padding: "48px 64px 96px", maxWidth: 1180, margin: "0 auto",
        display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", gap: 64, alignItems: "start",
      }}>
        <nav className="ll-legal-toc ll-hide-mobile" style={{ position: "sticky", top: 108 }}>
          <div className="ll-eyebrow" style={{ marginBottom: 14 }}>Contents</div>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            {sections.map((s) => (
              <li key={s.n} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.4 }}>
                <span className="mono" style={{ color: "var(--ink-4)", flexShrink: 0 }}>{s.n}</span>
                <a href={`#${slug(s.n)}`} style={{ color: "var(--ink-3)" }}>{s.t}</a>
              </li>
            ))}
          </ol>
        </nav>

        <article style={{ maxWidth: 760 }}>
          {group(doc.blocks).map((node, i) => <Node key={i} node={node} />)}

          <div style={{
            marginTop: 56, paddingTop: 24, borderTop: "1px solid var(--line)",
            fontSize: 13, color: "var(--ink-3)", lineHeight: 1.7,
          }}>
            {doc.meta.title} · last updated {doc.meta.updated}.<br />
            LastLink, Inc. · Houston, Texas · {PATENT}
          </div>
        </article>
      </section>

      <footer style={{ padding: "40px 64px", borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
        <div style={{
          maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between",
          gap: 20, flexWrap: "wrap", fontSize: 12, color: "var(--ink-3)",
        }}>
          <span>© 2026 LastLink, Inc. · Patented · support@lastlink.care</span>
          <span className="ll-footer-meta" style={{ display: "flex", gap: 18 }}>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/">Home</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

/** Consecutive `li` blocks become one list, so bullets render as a real <ul>. */
type Node = Block | { k: "ul"; items: Run[][] };

function group(blocks: Block[]): Node[] {
  const out: Node[] = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.k === "li") {
      if (last?.k === "ul") last.items.push(b.runs);
      else out.push({ k: "ul", items: [b.runs] });
    } else {
      out.push(b);
    }
  }
  return out;
}

const Spans = ({ runs }: { runs: Run[] }) => (
  <>{runs.map((r, i) => (r.b ? <strong key={i} style={{ fontWeight: 600, color: "var(--ink)" }}>{r.t}</strong> : <span key={i}>{r.t}</span>))}</>
);

function Node({ node }: { node: Node }) {
  switch (node.k) {
    case "h2":
      return (
        <h2 id={slug(node.n)} className="serif" style={{
          fontSize: 34, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.15,
          margin: "56px 0 16px", scrollMarginTop: 100,
          paddingTop: 28, borderTop: "1px solid var(--line)",
        }}>
          <span className="mono" style={{ fontSize: 13, color: "var(--ink-4)", marginRight: 12 }}>{node.n}</span>
          {node.t}
        </h2>
      );

    case "h3":
      return (
        <h3 style={{ fontSize: 17, fontWeight: 600, margin: "32px 0 10px", color: "var(--ink)" }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--ink-4)", marginRight: 10 }}>{node.n}</span>
          {node.t}
        </h3>
      );

    case "p":
      return (
        <p style={{ fontSize: 15.5, lineHeight: 1.75, color: "var(--ink-2)", margin: "0 0 16px" }}>
          <Spans runs={node.runs} />
        </p>
      );

    case "ul":
      return (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 9 }}>
          {node.items.map((runs, i) => (
            <li key={i} className="ll-row-bullet" style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 10, fontSize: 15.5, lineHeight: 1.7, color: "var(--ink-2)" }}>
              <span aria-hidden style={{ color: "var(--brand-purple)", lineHeight: 1.7 }}>·</span>
              <span><Spans runs={runs} /></span>
            </li>
          ))}
        </ul>
      );

    case "callout":
      return (
        <div style={{
          background: "var(--brand-grad-soft)", border: "1px solid var(--line)",
          borderRadius: 16, padding: "24px 28px", margin: "0 0 32px",
          fontSize: 15.5, lineHeight: 1.7, color: "var(--ink-2)",
        }}>
          <Spans runs={node.runs} />
        </div>
      );

    case "table":
      return (
        <div className="ll-scroll-x" style={{
          overflowX: "auto", margin: "0 0 24px",
          border: "1px solid var(--line)", borderRadius: 14,
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr>
                {node.head.map((h, i) => (
                  <th key={i} style={{
                    textAlign: "left", padding: "14px 18px", background: "var(--surface)",
                    borderBottom: "1px solid var(--line)", fontWeight: 600, color: "var(--ink)",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {node.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{
                      padding: "14px 18px", verticalAlign: "top", lineHeight: 1.6,
                      color: j === 0 ? "var(--ink)" : "var(--ink-2)",
                      fontWeight: j === 0 ? 500 : 400,
                      borderBottom: i < node.rows.length - 1 ? "1px solid var(--line-soft)" : "none",
                    }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    // `li` is always folded into `ul` by group().
    default:
      return null;
  }
}
