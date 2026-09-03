import { useState } from "react";
import { postJson } from "../lib/api.js";
import { useUploadThing } from "../lib/uploadthing.js";
import { card, fieldLabel, input } from "./styles.js";

export function ContributionForm({ slug }: { slug: string }) {
  const [form, setForm] = useState({ authorName: "", authorEmail: "", relationship: "", body: "" });
  const [image, setImage] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const { startUpload } = useUploadThing("condolencePhoto");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setState("saving"); setError(null);
    try {
      const uploaded = image ? await startUpload([image]) : null;
      const file = uploaded?.[0] as { key?: string; ufsUrl?: string; serverData?: { url?: string; key?: string } } | undefined;
      await postJson(`/public/memorial/${slug}/condolences`, {
        ...form,
        imageUrl: file?.serverData?.url ?? file?.ufsUrl,
        imageKey: file?.serverData?.key ?? file?.key,
      });
      setForm({ authorName: "", authorEmail: "", relationship: "", body: "" }); setImage(null); setState("done");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not submit this memory."); setState("idle"); }
  }
  if (state === "done") return <aside style={{ ...card, padding: 24 }}><div className="serif" style={{ fontSize: 24 }}>Thank you.</div><p style={{ color: "var(--ink-3)", marginBottom: 0 }}>Your memory is waiting for the family to approve it.</p><button style={{ border: 0, background: "none", color: "var(--brand-purple)", padding: "14px 0 0" }} onClick={() => setState("idle")}>Share another</button></aside>;
  return <aside style={{ ...card, padding: 24 }}><div className="serif" style={{ fontSize: 24 }}>Share a memory</div><p style={{ color: "var(--ink-3)", fontSize: 13, margin: "2px 0 18px" }}>A few words or a favorite photograph the family will treasure.</p><form onSubmit={submit}><TextField label="Your name" required value={form.authorName} onChange={(value) => setForm({ ...form, authorName: value })} /><TextField label="Relationship (optional)" value={form.relationship} onChange={(value) => setForm({ ...form, relationship: value })} /><TextField label="Email (not shown publicly)" type="email" value={form.authorEmail} onChange={(value) => setForm({ ...form, authorEmail: value })} /><label style={{ display: "block", marginBottom: 14 }}><span className="mono" style={fieldLabel}>Your message</span><textarea required maxLength={1500} style={{ ...input, minHeight: 108, resize: "vertical" }} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label><label style={{ display: "block", marginBottom: 16 }}><span className="mono" style={fieldLabel}>Add one photo (optional)</span><input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} /></label>{error && <p style={{ color: "var(--err)", fontSize: 13 }}>{error}</p>}<button className="ll-btn grad" disabled={state === "saving"} style={{ width: "100%", justifyContent: "center" }}>{state === "saving" ? "Sharing…" : "Leave your memory"}</button></form><p style={{ color: "var(--ink-3)", fontSize: 11, margin: "12px 0 0" }}>Memories appear after a quick review.</p></aside>;
}

function TextField({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label style={{ display: "block", marginBottom: 12 }}><span className="mono" style={fieldLabel}>{label}</span><input style={input} type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
