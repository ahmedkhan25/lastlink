import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo, Icon, ImgSlot, LLPhotos, type IconName } from "@lastlink/ui";
import { gql, postApi } from "../lib/api.js";

const ADD_ADVOCATES = `mutation($aEmail: String!, $bEmail: String!) {
  a: insert_app_advocates_one(object: {slot: "A", full_name: "Sarah Rourke", relationship: "Sister", email: $aEmail, invite_status: "pending"}) { id }
  b: insert_app_advocates_one(object: {slot: "B", full_name: "Michael Tanaka", relationship: "Family attorney", email: $bEmail, invite_status: "pending"}) { id }
}`;

const STEPS = ["Welcome", "Identity", "Contacts", "Message", "Advocates", "Done"];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
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
        {step === 0 && <Welcome onNext={next} />}
        {step === 1 && <Identity onNext={next} />}
        {step === 2 && <ContactsStep onNext={next} />}
        {step === 3 && <MessageStep onNext={next} />}
        {step === 4 && <AdvocatesStep onNext={next} />}
        {step === 5 && <Done onDone={() => navigate("/dashboard")} />}
      </div>
    </div>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  const cards: { icon: IconName; t: string; s: string }[] = [
    { icon: "fingerprint", t: "Verify your identity", s: "So no one can speak for you." },
    { icon: "users", t: "Build your contact list", s: "Family, friends, business." },
    { icon: "pen", t: "Write what matters", s: "Video, audio, or letter." },
    { icon: "shield", t: "Designate two advocates", s: "They confirm, together." },
  ];
  return (
    <div style={{ maxWidth: 600, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Logo size={48} stacked /></div>
      <h1 className="serif" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.015em", margin: 0 }}>Welcome, Daniel.</h1>
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

function Identity({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ maxWidth: 760, width: "100%" }}>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>First, let's confirm it's really you.</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 28px" }}>We verify identity so that no one else can ever register or speak on your behalf.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <Field label="Legal first name" value="Daniel" />
        <Field label="Legal last name" value="Rourke" />
        <Field label="Date of birth" value="May 4, 1962" />
        <Field label="Country of residence" value="United States" />
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

function GroupRow({ icon, color, name, count }: { icon: IconName; color: string; name: string; count: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 18, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)" }}>
      <div style={{ width: 40, height: 40, borderRadius: "var(--r-2)", background: "var(--brand-grad-soft)", display: "grid", placeItems: "center" }}>
        <Icon name={icon} size={18} color={color} />
      </div>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 500 }}>{name}</div><div style={{ fontSize: 12, color: "var(--ink-3)" }}>{count}</div></div>
      <button className="ll-btn secondary" style={{ fontSize: 13 }}>Add contacts</button>
    </div>
  );
}

function ContactsStep({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ maxWidth: 760, width: "100%" }}>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>Who should be told?</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 24px", maxWidth: 600 }}>Start with the people closest to you. You can add more anytime — there's no rush.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <GroupRow icon="heart" color="var(--brand-purple)" name="Family" count="12 people" />
        <GroupRow icon="users" color="var(--brand-blue)" name="Close friends" count="Add 0" />
        <GroupRow icon="briefcase" color="var(--ink-3)" name="Business & colleagues" count="Add 0" />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="ll-btn" onClick={onNext}>Continue</button></div>
    </div>
  );
}

function MessageStep({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>What do you want to say?</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 24px" }}>Start with one message for one group. You can write more anytime.</p>
      <div style={{ padding: 28, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <span className="ll-btn" style={{ fontSize: 13, padding: "8px 14px" }}><Icon name="video" size={14} color="white" /> Video</span>
          <span className="ll-btn secondary" style={{ fontSize: 13, padding: "8px 14px" }}><Icon name="mic" size={14} /> Audio</span>
          <span className="ll-btn secondary" style={{ fontSize: 13, padding: "8px 14px" }}><Icon name="pen" size={14} /> Letter</span>
        </div>
        <ImgSlot src={LLPhotos.recordingMic} alt="recording" style={{ aspectRatio: "16/9", borderRadius: "var(--r-3)", marginBottom: 16 }} />
        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>No time limit. Speak slowly.</div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="ll-btn" onClick={onNext}>Continue</button></div>
    </div>
  );
}

function AdvocatesStep({ onNext }: { onNext: () => void }) {
  const [a, setA] = useState({ name: "Sarah Rourke", email: "" });
  const [b, setB] = useState({ name: "Michael Tanaka", email: "" });
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
