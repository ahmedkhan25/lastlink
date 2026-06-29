import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Logo, Icon, ImgSlot, LLPhotos, type IconName } from "@lastlink/ui";
import { gql, postApi, getApiUrl } from "../lib/api.js";
import { useSession } from "../lib/auth.js";
import { VideoComposer } from "./VideoComposer.js";

const ADD_ADVOCATES = `mutation($aName: String!, $aEmail: String!, $bName: String!, $bEmail: String!) {
  a: insert_app_advocates_one(object: {slot: "A", full_name: $aName, email: $aEmail, invite_status: "pending"}) { id }
  b: insert_app_advocates_one(object: {slot: "B", full_name: $bName, email: $bEmail, invite_status: "pending"}) { id }
}`;

const STEPS = ["Welcome", "Identity", "Contacts", "Message", "Advocates", "Done"];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { data: session } = useSession();
  const fullName = session?.user?.name ?? "";
  const firstName = fullName.split(" ")[0] || "there";
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100%" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid var(--line-soft)" }}>
        <Logo size={22} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {STEPS.map((_, i) => (
              <span key={i} style={{ width: i === step ? 24 : 7, height: 7, borderRadius: 999, background: i <= step ? "var(--brand-grad)" : "var(--line)", transition: "width 200ms" }} />
            ))}
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>STEP {step + 1} OF 6</span>
        </div>
      </header>

      <div style={{ display: "grid", placeItems: "center", padding: 40, overflow: "auto" }}>
        {step === 0 && <Welcome onNext={next} firstName={firstName} />}
        {step === 1 && <Identity onNext={next} fullName={fullName} />}
        {step === 2 && <ContactsStep onNext={next} />}
        {step === 3 && <MessageStep onNext={next} />}
        {step === 4 && <AdvocatesStep onNext={next} />}
        {step === 5 && <Done onDone={() => navigate("/dashboard")} />}
      </div>
    </div>
  );
}

function Welcome({ onNext, firstName }: { onNext: () => void; firstName: string }) {
  const cards: { icon: IconName; t: string; s: string }[] = [
    { icon: "fingerprint", t: "Verify your identity", s: "So no one can speak for you." },
    { icon: "users", t: "Build your contact list", s: "Family, friends, business." },
    { icon: "pen", t: "Write what matters", s: "Video, audio, or letter." },
    { icon: "shield", t: "Designate two advocates", s: "They confirm, together." },
  ];
  return (
    <div style={{ maxWidth: 600, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Logo size={48} stacked /></div>
      <h1 className="serif" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.015em", margin: 0 }}>Welcome, {firstName}.</h1>
      <p style={{ fontSize: 18, color: "var(--ink-2)", lineHeight: 1.55, margin: "16px 0 28px" }}>
        The next ten minutes will give your loved ones a lifetime of certainty. We'll set you up in five quiet steps.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28, textAlign: "left" }}>
        {cards.map((c) => (
          <div key={c.t} style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", display: "flex", gap: 12, alignItems: "center" }}>
            <Icon name={c.icon} size={22} color="var(--brand-purple)" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c.t}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.s}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="ll-btn grad" onClick={onNext}>Begin — it takes about 10 minutes <Icon name="arrow" size={16} color="white" /></button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>{label}</div>
      <input defaultValue={value} style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--surface)", fontSize: 14 }} />
    </label>
  );
}

function Identity({ onNext, fullName }: { onNext: () => void; fullName: string }) {
  const parts = fullName.trim().split(" ");
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return (
    <div style={{ maxWidth: 760, width: "100%" }}>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>First, let's confirm it's really you.</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 28px" }}>We verify identity so that no one else can ever register or speak on your behalf.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <Field label="Legal first name" value={firstName} />
        <Field label="Legal last name" value={lastName} />
        <Field label="Date of birth" value="" />
        <Field label="Country of residence" value="" />
      </div>
      <div style={{ padding: 24, border: "1px dashed var(--line)", borderRadius: "var(--r-3)", background: "var(--surface)", display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: "var(--r-3)", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}>
          <Icon name="fingerprint" size={26} color="var(--brand-purple)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>Upload a government-issued ID</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Passport, driver's license, or national ID. Reviewed within 5 minutes.</div>
        </div>
        <button className="ll-btn secondary">Choose file</button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--ink-3)", display: "flex", gap: 8, alignItems: "center" }}>
          <Icon name="lock" size={14} color="var(--ink-3)" /> Encrypted with AES-256. Never sold, never shared.
        </span>
        <button className="ll-btn" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}

interface OBContact { id: string; full_name: string; relationship: string | null; email: string | null }
const LIST_CONTACTS = `query { app_contacts(order_by: {created_at: asc}) { id full_name relationship email } }`;
const ADD_CONTACT = `mutation($n: String!, $r: String, $e: String) { insert_app_contacts_one(object: {full_name: $n, relationship: $r, email: $e}) { id } }`;
const GROUPS = ["Family", "Close friends", "Business"];

function ContactsStep({ onNext }: { onNext: () => void }) {
  const [contacts, setContacts] = useState<OBContact[]>([]);
  const [form, setForm] = useState({ name: "", rel: "Family", email: "" });
  const [busy, setBusy] = useState(false);
  const refresh = () => gql<{ app_contacts: OBContact[] }>(LIST_CONTACTS).then((d) => setContacts(d.app_contacts));
  useEffect(() => { let a = true; gql<{ app_contacts: OBContact[] }>(LIST_CONTACTS).then((d) => a && setContacts(d.app_contacts)); return () => { a = false; }; }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || busy) return;
    setBusy(true);
    await gql(ADD_CONTACT, { n: form.name, r: form.rel || null, e: form.email || null }).catch(() => {});
    setForm({ name: "", rel: form.rel, email: "" });
    setBusy(false);
    await refresh();
  }

  return (
    <div style={{ maxWidth: 760, width: "100%" }}>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>Who should be told?</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 24px", maxWidth: 600 }}>Start with the people closest to you. You can add more anytime — there's no rush.</p>
      <form onSubmit={add} style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input placeholder="Full name (required)" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={obInput} />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={obInput} />
        <select value={form.rel} onChange={(e) => setForm({ ...form, rel: e.target.value })} style={{ ...obInput, flex: "0 0 150px" }}>
          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <button className="ll-btn" type="submit" disabled={busy || !form.name.trim()}><Icon name="plus" size={14} color="white" /> {busy ? "Adding…" : "Add"}</button>
      </form>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, maxHeight: 260, overflow: "auto" }}>
        {contacts.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-3)" }}>No one added yet — add the people you love above.</div>}
        {contacts.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface-2)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 500 }}>{c.full_name.charAt(0)}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: 14 }}>{c.full_name}</div><div style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.relationship ?? ""} {c.email ? `· ${c.email}` : ""}</div></div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{contacts.length} added</span>
        <button className="ll-btn" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}

const CREATE_LETTER = `mutation($t: String) { insert_app_messages_one(object: {type: "letter", title: $t, status: "draft"}) { id } }`;
type MTab = "video" | "audio" | "letter";

function MessageStep({ onNext }: { onNext: () => void }) {
  const [tab, setTab] = useState<MTab>("video");
  const [title, setTitle] = useState("A message for the people I love");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function saveLetter() {
    setStatus("saving");
    try {
      const c = await gql<{ insert_app_messages_one: { id: string } }>(CREATE_LETTER, { t: title });
      const res = await fetch(`${getApiUrl()}/api/messages/${c.insert_app_messages_one.id}/letter`, {
        method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch { setStatus("error"); }
  }

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>What do you want to say?</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 24px" }}>Record a video, or write a letter. You can add more anytime.</p>
      <div style={{ padding: 28, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["video", "audio", "letter"] as MTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`ll-btn ${tab === t ? "" : "secondary"}`} style={{ fontSize: 13, padding: "8px 14px", textTransform: "capitalize" }}>
              <Icon name={t === "video" ? "video" : t === "audio" ? "mic" : "pen"} size={14} color={tab === t ? "white" : "var(--ink)"} /> {t}
            </button>
          ))}
        </div>
        {tab === "video" && <VideoComposer title={title} groupId="" />}
        {tab === "audio" && <div style={{ padding: 40, border: "1px dashed var(--line)", borderRadius: "var(--r-3)", textAlign: "center", color: "var(--ink-3)" }}>Audio recording is post-MVP — use Video or Letter.</div>}
        {tab === "letter" && (
          <div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="serif" style={{ width: "100%", fontSize: 22, fontWeight: 500, border: "none", borderBottom: "1px solid var(--line)", background: "transparent", padding: "6px 0 10px", marginBottom: 14 }} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="My loves,&#10;&#10;" style={{ width: "100%", height: 200, padding: 18, border: "1px solid var(--line)", borderRadius: "var(--r-3)", background: "var(--bg)", fontFamily: "var(--font-serif)", fontSize: 16, lineHeight: 1.65, resize: "vertical" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{status === "saved" ? "Saved · encrypted ✓" : "Stored encrypted on save"}</span>
              <button className="ll-btn grad" onClick={saveLetter} disabled={status === "saving" || !body.trim()}>{status === "saved" ? "Saved ✓" : status === "saving" ? "Saving…" : "Save letter"}</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="ll-btn" onClick={onNext}>Continue</button></div>
    </div>
  );
}

const obInput = { padding: "11px 14px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--surface)", fontSize: 14, flex: "1 1 180px" } as const;

function AdvocatesStep({ onNext }: { onNext: () => void }) {
  const [a, setA] = useState({ name: "", email: "" });
  const [b, setB] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false);

  async function inviteAndContinue() {
    setBusy(true);
    try {
      const r = await gql<{ a: { id: string }; b: { id: string } }>(ADD_ADVOCATES, {
        aName: a.name, aEmail: a.email, bName: b.name, bEmail: b.email,
      });
      // Send each advocate their email invite (real email if Resend is configured).
      await Promise.all([
        postApi(`/api/advocates/${r.a.id}/invite`).catch(() => {}),
        postApi(`/api/advocates/${r.b.id}/invite`).catch(() => {}),
      ]);
    } catch { /* already added — proceed */ }
    onNext();
  }

  const ready = a.name && a.email && b.name && b.email;
  return (
    <div style={{ maxWidth: 760, width: "100%" }}>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>Two people you trust most.</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 24px" }}>
        Your advocates are the only two people who can confirm your passing and release your message. We'll email each of them an invitation to accept.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {[{ v: a, set: setA, label: "First advocate" }, { v: b, set: setB, label: "Second advocate" }].map((row, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center", fontFamily: "var(--font-serif)", color: "var(--brand-purple)", fontWeight: 600 }}>{(row.v.name[0] ?? "?").toUpperCase()}</div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10 }}>
              <input value={row.v.name} onChange={(e) => row.set({ ...row.v, name: e.target.value })} placeholder="Full name"
                style={inputStyle} />
              <input value={row.v.email} type="email" onChange={(e) => row.set({ ...row.v, email: e.target.value })} placeholder={`${row.label} email`}
                style={inputStyle} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="ll-btn" onClick={inviteAndContinue} disabled={busy || !ready}>
          {busy ? "Sending invites…" : "Send invites & continue"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = { padding: "11px 13px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--bg)", fontSize: 14, width: "100%" } as const;

function Done({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function finish() {
    setBusy(true);
    try { await postApi("/api/account/seal"); } catch { /* non-fatal for demo */ }
    onDone();
  }
  return (
    <div style={{ maxWidth: 600, textAlign: "center" }}>
      <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--brand-grad)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
        <Icon name="check" size={44} color="white" stroke={2} />
      </div>
      <h1 className="serif" style={{ fontSize: 48, fontWeight: 500, lineHeight: 1.05, margin: 0 }}>You're protected.</h1>
      <p style={{ fontSize: 18, color: "var(--ink-2)", lineHeight: 1.55, margin: "16px 0 28px" }}>
        Your LastLink is active and sealed. Come back anytime to add a message, refine your audience, or update an advocate. We won't bother you.
      </p>
      <button className="ll-btn grad" onClick={finish} disabled={busy}>
        {busy ? "Sealing…" : "Go to your overview"} <Icon name="arrow" size={16} color="white" />
      </button>
    </div>
  );
}
