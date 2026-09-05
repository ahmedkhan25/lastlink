import { useEffect, useState, type FormEvent } from "react";
import { Logo, Icon, ImgSlot, LLPhotos, type IconName } from "@lastlink/ui";
import { gql, postApi, getApiUrl, getMarketingUrl } from "../lib/api.js";
import { useSession } from "../lib/auth.js";
import { VideoComposer } from "./VideoComposer.js";
import { GoogleMark, OutlookMark, AolMark, FacebookMark, AppleMark } from "./preview/_shared.js";

const STEPS = ["Welcome", "Consent", "Identity", "Advocates", "Message", "Contacts", "Done"];
const ONBOARDING_STEP_KEY = "lastlink:onboarding-step:v3";
const PREVIOUS_STEP_KEY = "lastlink:onboarding-step:v2";

function savedStep(): number {
  const current = window.sessionStorage.getItem(ONBOARDING_STEP_KEY);
  // Resume at the earliest unfinished step when upgrading the previous order.
  const previous = Number(window.sessionStorage.getItem(PREVIOUS_STEP_KEY) ?? 0);
  const value = current === null ? ([0, 1, 2, 3, 3, 4, 6][previous] ?? 0) : Number(current);
  return Number.isInteger(value) && value >= 0 && value < STEPS.length ? value : 0;
}

export function Onboarding() {
  const [step, setStep] = useState(savedStep);
  const [visited, setVisited] = useState(() => new Set([step]));
  const [navigationBusy, setNavigationBusy] = useState(false);
  const [unsavedVideo, setUnsavedVideo] = useState(false);
  const { data: session } = useSession();
  const fullName = session?.user?.name ?? "";
  const firstName = fullName.split(" ")[0] || "there";
  function goTo(target: number) {
    setVisited((steps) => new Set([...steps, target]));
    setStep(target);
  }
  const next = () => goTo(Math.min(step + 1, STEPS.length - 1));
  const previous = () => goTo(Math.max(step - 1, 0));
  useEffect(() => {
    window.sessionStorage.setItem(ONBOARDING_STEP_KEY, String(step));
    window.sessionStorage.removeItem(PREVIOUS_STEP_KEY);
  }, [step]);

  function finishOnboarding() {
    window.sessionStorage.removeItem(ONBOARDING_STEP_KEY);
    window.location.assign("/dashboard");
  }

  return (
    <div className="[&_*]:min-w-0 [overflow-wrap:anywhere] max-sm:[&_input]:!text-base max-sm:[&_select]:!text-base max-sm:[&_button]:min-h-11 max-sm:[&_h1]:!text-3xl" style={{ display: "grid", gridTemplateRows: "auto minmax(0,1fr)", height: "100%" }}>
      <header className="max-sm:!px-4 flex-wrap gap-y-3" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid var(--line-soft)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo size={22} />
          {step > 0 && <button type="button" className="ll-btn ghost" onClick={previous} disabled={navigationBusy || (step === 4 && unsavedVideo)} title={step === 4 && unsavedVideo ? "Save or discard your recording before going back." : undefined}><Icon name="arrowLeft" size={15} /> Back</button>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="max-sm:!hidden" style={{ display: "flex", gap: 6 }}>
            {STEPS.map((_, i) => (
              <span key={i} style={{ width: i === step ? 24 : 7, height: 7, borderRadius: 999, background: i <= step ? "var(--brand-grad)" : "var(--line)", transition: "width 200ms" }} />
            ))}
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>STEP {step + 1} OF {STEPS.length}</span>
        </div>
      </header>

      <div className="max-sm:!px-4 max-sm:!py-6 [&>div]:max-w-full" style={{ display: "grid", placeItems: "safe center", padding: 40, overflow: "auto" }}>
        {/* Keep visited forms mounted so Back retains entered values and saved state. */}
        {visited.has(0) && <div hidden={step !== 0}><Welcome onNext={next} firstName={firstName} /></div>}
        {visited.has(1) && <div hidden={step !== 1} style={{ width: "100%", maxWidth: 560 }}><Consent onNext={next} /></div>}
        {visited.has(2) && <div hidden={step !== 2} style={{ width: "100%", maxWidth: 760 }}><Identity onNext={next} fullName={fullName} /></div>}
        {visited.has(3) && <div hidden={step !== 3} style={{ width: "100%", maxWidth: 760 }}><AdvocatesStep onNext={next} onBusyChange={setNavigationBusy} /></div>}
        {visited.has(4) && <div hidden={step !== 4} style={{ width: "100%", maxWidth: 800 }}><MessageStep active={step === 4} onNext={next} onDirtyChange={setUnsavedVideo} onBusyChange={setNavigationBusy} /></div>}
        {visited.has(5) && <div hidden={step !== 5} style={{ width: "100%", maxWidth: 760 }}><ContactsStep onNext={next} /></div>}
        {step === 6 && <Done onDone={finishOnboarding} onBusyChange={setNavigationBusy} />}
      </div>
    </div>
  );
}

function Welcome({ onNext, firstName }: { onNext: () => void; firstName: string }) {
  const cards: { icon: IconName; t: string; s: string }[] = [
    { icon: "fingerprint", t: "Verify your identity", s: "So no one can speak for you." },
    { icon: "shield", t: "Designate two advocates", s: "They confirm, together." },
    { icon: "pen", t: "Write what matters", s: "Video, audio, or letter." },
    { icon: "users", t: "Build your contact list", s: "Family, friends, business." },
  ];
  return (
    <div style={{ maxWidth: 600, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Logo size={48} stacked /></div>
      <h1 className="serif" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.015em", margin: 0 }}>Welcome, {firstName}.</h1>
      <p style={{ fontSize: 18, color: "var(--ink-2)", lineHeight: 1.55, margin: "16px 0 28px" }}>
        The next few minutes will give your loved ones a lifetime of certainty. We'll set you up in a few quiet steps.
      </p>
      <div style={{ display: "grid", gap: 10, marginBottom: 28, textAlign: "left" }}>
        {cards.map((c) => (
          <div key={c.t} style={{ padding: "4px 0", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name={c.icon} size={16} color="var(--brand-purple)" />
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c.t}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.s}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="ll-btn grad" onClick={onNext}>Begin — it takes just a few minutes <Icon name="arrow" size={16} color="white" /></button>
    </div>
  );
}

// Consent step — the legacy app's ToS gate, now explicit. Records agreement to
// the terms and to the two-advocate + one-hour-hold release model before anything is
// collected. (Presentational: the checkboxes gate the button, nothing persists.)
// The policies live on the marketing site. Open in a new tab so a half-finished
// onboarding isn't thrown away by someone reading the terms.
function Legal({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <a href={`${getMarketingUrl()}${path}`} target="_blank" rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{ color: "var(--brand-purple)", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: 2 }}>
      {children}
    </a>
  );
}

function Consent({ onNext }: { onNext: () => void }) {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const items = [
    { checked: a, set: setA, node: <>I agree to the <Legal path="/terms">Terms of Service</Legal> and <Legal path="/privacy">Privacy Policy</Legal>.</> },
    { checked: b, set: setB, node: <>I understand my messages are released only after <strong>two advocates independently confirm my passing</strong>, followed by a one-hour cancellable hold.</> },
  ];
  return (
    <div style={{ maxWidth: 560, width: "100%" }}>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>Before we begin.</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 24px" }}>A few things to agree to — this is what keeps the promise honest.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
        {items.map((it, i) => (
          <label key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", cursor: "pointer", alignItems: "flex-start" }}>
            <input type="checkbox" checked={it.checked} onChange={(e) => it.set(e.target.checked)} style={{ marginTop: 3 }} />
            <span style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>{it.node}</span>
          </label>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="ll-btn grad" onClick={onNext} disabled={!a || !b}>I agree — continue <Icon name="arrow" size={16} color="white" /></button>
      </div>
    </div>
  );
}

function Field({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>{label}</div>
      <input type={type} defaultValue={value} style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r-2)", background: "var(--surface)", fontSize: 14 }} />
    </label>
  );
}

function DateOfBirthField() {
  const [value, setValue] = useState("");

  function update(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
    setValue(parts.join("/"));
  }

  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>Date of birth</div>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder="MM/DD/YYYY"
        aria-label="Date of birth in month day year format"
        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r-2)", background: "var(--surface)", fontSize: 14 }}
      />
      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 5 }}>Type 8 digits — for example, 04251980.</div>
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
      <div className="max-sm:!grid-cols-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <Field label="Legal first name" value={firstName} />
        <Field label="Legal last name" value={lastName} />
        <DateOfBirthField />
        <Field label="Country of residence" value="" />
      </div>
      <div className="max-sm:flex-wrap max-sm:!p-4" style={{ padding: 24, border: "1px dashed var(--line)", borderRadius: "var(--r-3)", background: "var(--surface)", display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: "var(--r-3)", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}>
          <Icon name="fingerprint" size={26} color="var(--brand-purple)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>Upload a government-issued ID</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Passport, driver's license, or national ID. Reviewed within 5 minutes.</div>
        </div>
        <button className="ll-btn secondary">Choose file</button>
      </div>
      <div className="max-sm:flex-wrap max-sm:!p-4" style={{ padding: 24, border: "1px solid var(--line)", borderRadius: "var(--r-3)", background: "var(--surface)", display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}>
          <Icon name="user" size={26} color="var(--brand-purple)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>Add a photo</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Optional. Also becomes your memorial portrait.</div>
        </div>
        <button className="ll-btn secondary">Add photo</button>
      </div>
      <div className="flex-wrap gap-4" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--ink-3)", display: "flex", gap: 8, alignItems: "center" }}>
          <Icon name="lock" size={14} color="var(--ink-3)" /> Encrypted with AES-256. Never sold, never shared.
        </span>
        <button className="ll-btn" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}

interface OBContact { id: string; full_name: string; relationship: string | null; email: string | null; receives_public: boolean }
const LIST_CONTACTS = `query { app_contacts(order_by: {created_at: asc}) { id full_name relationship email receives_public } }`;
const ADD_CONTACT = `mutation($n: String!, $r: String, $e: String, $public: Boolean!) { insert_app_contacts_one(object: {full_name: $n, relationship: $r, email: $e, receives_public: $public}) { id } }`;

function ContactsStep({ onNext }: { onNext: () => void }) {
  const [contacts, setContacts] = useState<OBContact[]>([]);
  const [form, setForm] = useState({ name: "", rel: "", email: "", receivesPublic: true });
  const [busy, setBusy] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const refresh = () => gql<{ app_contacts: OBContact[] }>(LIST_CONTACTS).then((d) => setContacts(d.app_contacts));
  useEffect(() => { let a = true; gql<{ app_contacts: OBContact[] }>(LIST_CONTACTS).then((d) => a && setContacts(d.app_contacts)); return () => { a = false; }; }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || busy) return;
    setBusy(true);
    await gql(ADD_CONTACT, { n: form.name, r: form.rel || null, e: form.email || null, public: form.receivesPublic }).catch(() => {});
    setForm({ name: "", rel: "", email: "", receivesPublic: true });
    setBusy(false);
    await refresh();
  }

  return (
    <div style={{ maxWidth: 760, width: "100%" }}>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>Who should be told?</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 16px", maxWidth: 600 }}>Start with the people closest to you. You can add more anytime — there's no rush.</p>
      {/* Inline import preview — stays inside onboarding (does NOT navigate to
          the dashboard). The full import screen lives at /contacts/import for
          after onboarding. */}
      <button type="button" onClick={() => setShowImport((v) => !v)} className="ll-btn secondary" style={{ marginBottom: showImport ? 12 : 16 }}>
        <Icon name="users" size={14} color="var(--ink)" /> Import contacts
      </button>
      {showImport && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="ll-btn secondary" style={{ flex: "1 1 160px", justifyContent: "center" }}><GoogleMark size={16} /> Google</button>
            <button type="button" className="ll-btn secondary" style={{ flex: "1 1 160px", justifyContent: "center" }}><OutlookMark size={16} /> Hotmail / Outlook</button>
            <button type="button" className="ll-btn secondary" style={{ flex: "1 1 160px", justifyContent: "center" }}><AolMark size={16} /> AOL</button>
            <button type="button" className="ll-btn secondary" style={{ flex: "1 1 160px", justifyContent: "center" }}><FacebookMark size={16} /> Facebook</button>
            <button type="button" className="ll-btn secondary" style={{ flex: "1 1 160px", justifyContent: "center" }}><AppleMark size={16} /> Apple</button>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-2)", padding: "10px 12px" }}>
            Connect a source to bring your contacts in, then review and tag them before saving. For now, add people below — you can import anytime from Contacts.
          </div>
        </div>
      )}
      <form onSubmit={add} style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input placeholder="Full name (required)" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={obInput} />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={obInput} />
        <input placeholder="Relationship" value={form.rel} onChange={(e) => setForm({ ...form, rel: e.target.value })} style={obInput} />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "0 8px", fontSize: 13 }}>
          <input type="checkbox" checked={form.receivesPublic} onChange={(e) => setForm({ ...form, receivesPublic: e.target.checked })} /> Public
        </label>
        <button className="ll-btn" type="submit" disabled={busy || !form.name.trim()}><Icon name="plus" size={14} color="white" /> {busy ? "Adding…" : "Add"}</button>
      </form>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, maxHeight: 260, overflow: "auto" }}>
        {contacts.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-3)" }}>No one added yet — add the people you love above.</div>}
        {contacts.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface-2)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 500 }}>{c.full_name.charAt(0)}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: 14 }}>{c.full_name}</div><div style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.relationship ?? ""} {c.email ? `· ${c.email}` : ""} · {c.receives_public ? "Public" : "Private only"}</div></div>
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

type MTab = "video" | "audio" | "letter";

function MessageStep({ onNext, active, onDirtyChange, onBusyChange }: { onNext: () => void; active: boolean; onDirtyChange: (dirty: boolean) => void; onBusyChange: (busy: boolean) => void }) {
  const [tab, setTab] = useState<MTab>("video");
  const [title, setTitle] = useState("A message for the people I love");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [videoSaved, setVideoSaved] = useState(false);
  const [videoDirty, setVideoDirty] = useState(false); // recorded/uploading but not persisted
  const [nudge, setNudge] = useState(false);

  function handleContinue() {
    // Don't let the user leave the video tab with a recording that was never
    // saved (the row is created only when the video is actually used/uploaded).
    // Switching to another tab is a deliberate "skip video", so only gate here.
    if (tab === "video" && videoDirty) { setNudge(true); return; }
    onNext();
  }

  async function saveLetter() {
    setStatus("saving");
    onBusyChange(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/messages/letter`, {
        method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, body, audienceType: "public", contactIds: [] }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch { setStatus("error"); }
    finally { onBusyChange(false); }
  }

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>What do you want to say?</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 24px" }}>Record a video, or write a letter. You can add more anytime.</p>
      <div className="max-sm:!p-4" style={{ padding: 28, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["video", "audio", "letter"] as MTab[]).map((t) => (
            <button key={t} onClick={() => { setTab(t); setNudge(false); if (t !== "video") { setVideoDirty(false); onDirtyChange(false); } }} className={`ll-btn ${tab === t ? "" : "secondary"}`} style={{ fontSize: 13, padding: "8px 14px", textTransform: "capitalize" }}>
              <Icon name={t === "video" ? "video" : t === "audio" ? "mic" : "pen"} size={14} color={tab === t ? "white" : "var(--ink)"} /> {t}
            </button>
          ))}
        </div>
        {tab === "video" && active && (
          <VideoComposer
            title={title}
            audienceType="public"
            contactIds={[]}
            onSaved={() => { setVideoSaved(true); setNudge(false); }}
            onDirtyChange={(d) => { setVideoDirty(d); onDirtyChange(d); if (d) setNudge(false); }}
          />
        )}
        {tab === "video" && videoSaved && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--ok)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="check" size={14} color="var(--ok)" /> Saved to your account — it will appear on your dashboard.
          </div>
        )}
        {tab === "audio" && <div style={{ padding: 40, border: "1px dashed var(--line)", borderRadius: "var(--r-3)", textAlign: "center", color: "var(--ink-3)" }}>Audio recording is post-MVP — use Video or Letter.</div>}
        {tab === "letter" && (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 6 }} htmlFor="message-title">Message title</label>
            <input id="message-title" readOnly={status === "saved" || status === "saving"} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your message a title" className="serif" style={{ width: "100%", fontSize: 20, fontWeight: 500, border: "1.5px solid var(--ink-3)", borderRadius: "var(--r-2)", background: "var(--surface)", padding: "12px 14px", marginBottom: 16 }} />
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 6 }} htmlFor="message-body">Your message</label>
            <textarea id="message-body" readOnly={status === "saved" || status === "saving"} value={body} onChange={(e) => setBody(e.target.value)} placeholder="My loves,&#10;&#10;" style={{ width: "100%", height: 200, padding: 18, border: "1.5px solid var(--ink-3)", borderRadius: "var(--r-3)", background: "var(--surface)", fontFamily: "var(--font-serif)", fontSize: 16, lineHeight: 1.65, resize: "vertical" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{status === "saved" ? "Saved · encrypted ✓" : "Stored encrypted on save"}</span>
              <button className="ll-btn grad" onClick={saveLetter} disabled={status === "saving" || status === "saved" || !body.trim()}>{status === "saved" ? "Saved ✓" : status === "saving" ? "Saving…" : "Save letter"}</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14 }}>
        {nudge && (
          <span style={{ fontSize: 13, color: "var(--err)", textAlign: "right", maxWidth: 420 }}>
            Your video isn't saved yet — click <strong>"Use this video"</strong> (or let the upload finish) first. Or switch tabs to skip it.
          </span>
        )}
        <button className="ll-btn" onClick={handleContinue} disabled={status === "saving"}>Continue</button>
      </div>
    </div>
  );
}

const obInput = { padding: "11px 14px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--surface)", fontSize: 14, flex: "1 1 180px" } as const;

function AdvocatesStep({ onNext, onBusyChange }: { onNext: () => void; onBusyChange: (busy: boolean) => void }) {
  const [a, setA] = useState({ name: "", email: "" });
  const [b, setB] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSlots, setExistingSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    gql<{ app_advocates: { slot: string; full_name: string; email: string }[] }>(
      `query { app_advocates(order_by: {slot: asc}) { slot full_name email } }`,
    ).then(({ app_advocates }) => {
      if (!mounted) return;
      for (const advocate of app_advocates) {
        const value = { name: advocate.full_name, email: advocate.email };
        if (advocate.slot === "A") setA(value);
        if (advocate.slot === "B") setB(value);
      }
      setExistingSlots(app_advocates.map((advocate) => advocate.slot));
      setLoading(false);
    }).catch(() => { if (mounted) setError("Could not load your advocates. Refresh to try again."); });
    return () => { mounted = false; };
  }, []);

  async function inviteAndContinue() {
    if (existingSlots.includes("A") && existingSlots.includes("B")) { onNext(); return; }
    setBusy(true);
    onBusyChange(true);
    setError(null);
    try {
      const result = await postApi<{ advocates: { id: string; slot: string }[] }>("/api/advocates", {
        advocates: [
          { slot: "A", name: a.name, email: a.email },
          { slot: "B", name: b.name, email: b.email },
        ].filter((advocate) => !existingSlots.includes(advocate.slot)),
      });
      setExistingSlots((slots) => [...slots, ...result.advocates.map((advocate) => advocate.slot)]);
      // Send each advocate their email invite (real email if Resend is configured).
      await Promise.all(result.advocates.map((advocate) => postApi(`/api/advocates/${advocate.id}/invite`).catch(() => {})));
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add your advocates.");
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
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
            <div className="max-sm:!grid-cols-1" style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10 }}>
              <input disabled={loading || busy || existingSlots.includes(i === 0 ? "A" : "B")} value={row.v.name} onChange={(e) => row.set({ ...row.v, name: e.target.value })} placeholder="Full name"
                style={inputStyle} />
              <input disabled={loading || busy || existingSlots.includes(i === 0 ? "A" : "B")} value={row.v.email} type="email" onChange={(e) => row.set({ ...row.v, email: e.target.value })} placeholder={`${row.label} email`}
                style={inputStyle} />
            </div>
          </div>
        ))}
      </div>
      {error && <p style={{ fontSize: 13, color: "var(--err)", margin: "0 0 14px" }}>{error}</p>}
      {existingSlots.length > 0 && <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Your saved advocates are shown above. You can manage them from Advocates after setup.</p>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="ll-btn" onClick={inviteAndContinue} disabled={loading || busy || !ready}>
          {loading ? "Loading advocates…" : busy ? "Sending invites…" : existingSlots.length === 2 ? "Continue" : "Send invites & continue"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = { padding: "11px 13px", border: "1px solid var(--line)", borderRadius: "var(--r-2)", background: "var(--bg)", fontSize: 14, width: "100%" } as const;

function Done({ onDone, onBusyChange }: { onDone: () => void; onBusyChange: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function finish() {
    setBusy(true);
    onBusyChange(true);
    try {
      await postApi("/api/account/seal");
      onDone();
    } catch {
      setError("Could not finish setup. Please try again.");
      setBusy(false);
      onBusyChange(false);
    }
  }
  return (
    <div style={{ maxWidth: 600, textAlign: "center" }}>
      <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--brand-grad)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
        <Icon name="check" size={44} color="white" stroke={2} />
      </div>
      <h1 className="serif" style={{ fontSize: 48, fontWeight: 500, lineHeight: 1.05, margin: 0 }}>You're Linked.</h1>
      <p style={{ fontSize: 18, color: "var(--ink-2)", lineHeight: 1.55, margin: "16px 0 28px" }}>
        Your LastLink is active. Come back anytime to make necessary changes.
      </p>
      {error && <p role="alert" style={{ color: "var(--err)" }}>{error}</p>}
      <button className="ll-btn grad" onClick={finish} disabled={busy}>
        {busy ? "Sealing…" : "Go to your overview"} <Icon name="arrow" size={16} color="white" />
      </button>
    </div>
  );
}
