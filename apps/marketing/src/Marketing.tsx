import { useState } from "react";
import { Logo, Icon, ImgSlot, LLPhotos, type IconName } from "@lastlink/ui";

// CTAs point at the registrant app. In prod, set VITE_APP_URL to the lastlink-web URL.
const APP = import.meta.env.VITE_APP_URL ?? "http://localhost:5273";

export function Marketing() {
  return (
    <div className="ll-marketing" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <Nav />
      <Hero />
      <ProblemStrip />
      <HowItWorks />
      <VerificationBlock />
      <TrustBlock />
      <ScenariosBlock />
      <PricingTeaser />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// ----------------------------------------------------------- NAV
const Nav = () => (
  <header style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "22px 64px", borderBottom: "1px solid var(--line-soft)",
    position: "sticky", top: 0,
    background: "color-mix(in oklab, var(--bg) 92%, transparent)",
    backdropFilter: "blur(8px)", zIndex: 10,
  }}>
    <Logo size={26} />
    <nav style={{ display: "flex", gap: 36, fontSize: 14, color: "var(--ink-2)" }}>
      <a href="#how">How it works</a>
      <a href="#trust">Trust &amp; security</a>
      <a href="#scenarios">Who it's for</a>
      <a href="#pricing">Pricing</a>
      <a href="#enterprise">For organizations</a>
    </nav>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <a href={APP} className="ll-btn ghost">Sign in</a>
      <a href={APP} className="ll-btn">Begin your LastLink</a>
    </div>
  </header>
);

// ----------------------------------------------------------- HERO
const Hero = () => (
  <section style={{
    padding: "96px 64px 80px", display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
    gap: 64, alignItems: "center", maxWidth: 1440, margin: "0 auto",
  }}>
    <div>
      <div className="ll-chip" style={{ marginBottom: 28 }}>
        <span className="dot" />
        Patent-pending dual-advocate verification
      </div>
      <h1 className="serif" style={{
        fontSize: 92, lineHeight: 0.98, margin: "0 0 28px",
        letterSpacing: "-0.02em", fontWeight: 500, textWrap: "pretty",
      }}>
        Your final message,<br />
        <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>delivered with certainty.</em>
      </h1>
      <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 560, margin: "0 0 36px" }}>
        LastLink is the verified, dignified way to make sure the people you love
        — and the people you work with — hear the news in your words, at the
        same moment, never secondhand.
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <a href={APP} className="ll-btn">
          Begin your LastLink
          <Icon name="arrow" size={16} />
        </a>
        <a href="#how" className="ll-btn secondary">See how it works</a>
      </div>
      <div style={{
        display: "flex", gap: 36, marginTop: 56, paddingTop: 28,
        borderTop: "1px solid var(--line)", color: "var(--ink-3)", fontSize: 13,
      }}>
        <Reassure icon="shield" label="Verified by two independent advocates" />
        <Reassure icon="lock" label="Encrypted at rest · SOC&nbsp;2 audit underway" />
        <Reassure icon="leaf" label="10 minutes to register · free forever" />
      </div>
    </div>
    <HeroCard />
  </section>
);

const Reassure = ({ icon, label }: { icon: IconName; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <Icon name={icon} size={15} color="var(--ink-3)" />
    <span dangerouslySetInnerHTML={{ __html: label }} />
  </div>
);

const HeroCard = () => (
  <div style={{ position: "relative", width: "100%", maxWidth: 520, marginLeft: "auto", flexShrink: 0 }}>
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: "var(--r-4)", boxShadow: "var(--shadow-3)", padding: 36,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.12em",
        textTransform: "uppercase", marginBottom: 28,
      }}>
        <span>For · Emily</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ok)" }} />
          Verified delivery
        </span>
      </div>

      <ImgSlot src={LLPhotos.windowLight} alt="Soft morning light through a window"
        style={{ aspectRatio: "16/10", borderRadius: 12, marginBottom: 28 }} />

      <div className="serif" style={{
        fontSize: 28, lineHeight: 1.25, color: "var(--ink)", fontStyle: "italic",
        marginBottom: 18, textWrap: "pretty",
      }}>
        "Em — there's so much I never said out loud. Sit with me for nine minutes. I want to tell you everything."
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 18 }}>
        A message from <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>Daniel R.</span> · Recorded Oct 14, 2024
      </div>

      <div style={{
        marginTop: "auto", display: "flex", alignItems: "center", gap: 12,
        padding: 12, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--line)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 999, background: "var(--brand-grad)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "white",
        }}>
          <Icon name="play" size={14} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 4, background: "var(--line)", overflow: "hidden" }}>
            <div style={{ width: "32%", height: "100%", background: "var(--brand-grad)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--ink-3)" }}>
            <span>02:54</span><span>09:11</span>
          </div>
        </div>
      </div>
    </div>

    <div style={{
      position: "absolute", top: -30, right: -40, width: 160, height: 160,
      borderRadius: "50%", background: "var(--brand-grad)", opacity: 0.08,
      filter: "blur(20px)", zIndex: -1, pointerEvents: "none",
    }} />
  </div>
);

// ----------------------------------------------------------- PROBLEM STRIP
const ProblemStrip = () => (
  <section style={{
    padding: "80px 64px", background: "var(--surface)",
    borderTop: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)",
  }}>
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div className="ll-eyebrow" style={{ marginBottom: 16 }}>The quiet problem</div>
      <h2 className="serif" style={{
        fontSize: 56, lineHeight: 1.05, margin: "0 0 56px",
        letterSpacing: "-0.015em", maxWidth: 980, fontWeight: 500, textWrap: "pretty",
      }}>
        In America, <span style={{ color: "var(--brand-purple)" }}>3.7 million people</span> die each year.
        Each one leaves behind about <span style={{ color: "var(--brand-blue)" }}>150 relationships</span> who deserve to be told —
        and most of them won't be.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid var(--line)" }}>
        {([
          ["No verified standard", "Families learn through Facebook comments and gossip — never a dignified, confirmed source."],
          ["Networks go dark", "Business partners, colleagues, and clients find out days late. Deals collapse. Trust frays."],
          ["Final words are lost", "People die with messages undelivered. Love unspoken. Gratitude unexpressed."],
          ["No single solution exists", "Until LastLink, no platform simultaneously verified, notified, and delivered."],
        ] as const).map(([title, body], i) => (
          <div key={i} style={{
            padding: "32px 28px 32px 0",
            borderRight: i < 3 ? "1px solid var(--line)" : "none",
            paddingLeft: i > 0 ? 28 : 0,
          }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 14 }}>0{i + 1}</div>
            <h3 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 10px" }}>{title}</h3>
            <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.55, margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ----------------------------------------------------------- HOW IT WORKS
const HowItWorks = () => {
  const [active, setActive] = useState(0);
  const steps = [
    { n: "01", title: "Register, free", sub: "10 minutes. A lifetime of peace.",
      body: "Create your account, verify your identity, and build contact lists across Family, Friends, and Business." },
    { n: "02", title: "Write what matters", sub: "Your voice, your way.",
      body: "Record video or audio. Type a letter. Send something different to each group — or one message for everyone." },
    { n: "03", title: "Designate two advocates", sub: "The people you trust most.",
      body: "Two independent people confirm your passing before anything is ever sent. Zero false positives, ever." },
    { n: "04", title: "Verified trigger", sub: "Patent-pending workflow.",
      body: "Both advocates confirm, with identity checks. Only then does LastLink begin to deliver — never before." },
    { n: "05", title: "Dignified delivery", sub: "Everyone, at the same moment.",
      body: "Family, friends, colleagues — each receives a private, personal notification with your message inside." },
  ];
  return (
    <section id="how" style={{ padding: "120px 64px 96px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56 }}>
        <div>
          <div className="ll-eyebrow" style={{ marginBottom: 16 }}>How it works</div>
          <h2 className="serif" style={{
            fontSize: 64, lineHeight: 1.02, margin: 0, letterSpacing: "-0.015em",
            fontWeight: 500, maxWidth: 720, textWrap: "pretty",
          }}>
            Five quiet steps.<br />One last act of love.
          </h2>
        </div>
        <div style={{ color: "var(--ink-3)", fontSize: 13, maxWidth: 280, textAlign: "right" }}>
          Hover or click a step to read more. Each is its own protected workflow.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 64, alignItems: "stretch" }}>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((s, i) => {
            const isActive = i === active;
            return (
              <li key={i} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)}
                style={{
                  padding: "22px 4px", borderTop: "1px solid var(--line)",
                  borderBottom: i === steps.length - 1 ? "1px solid var(--line)" : "none",
                  display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 20,
                  alignItems: "center", cursor: "pointer",
                  opacity: isActive ? 1 : 0.6, transition: "opacity 200ms",
                }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.n}</div>
                <div>
                  <div className="serif" style={{ fontSize: 26, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em" }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>{s.sub}</div>
                </div>
                <Icon name="chev" size={16} color="var(--ink-4)" />
              </li>
            );
          })}
        </ol>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18,
          padding: 36, display: "flex", flexDirection: "column", minHeight: 540,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -60, right: -60, width: 260, height: 260,
            background: "var(--brand-grad)", opacity: 0.06, borderRadius: "50%", filter: "blur(28px)",
          }} />
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 12 }}>Step {steps[active]!.n}</div>
          <h3 className="serif" style={{ fontSize: 44, lineHeight: 1.05, margin: "0 0 16px", fontWeight: 500 }}>{steps[active]!.title}</h3>
          <p style={{ fontSize: 17, color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 28px", maxWidth: 460 }}>{steps[active]!.body}</p>
          <StepIllustration step={active} />
        </div>
      </div>
    </section>
  );
};

const StepIllustration = ({ step }: { step: number }) => {
  const base: React.CSSProperties = {
    marginTop: "auto", border: "1px solid var(--line)", borderRadius: 14,
    background: "var(--bg)", padding: 22,
  };
  if (step === 0) return (
    <div style={base}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 12 }}>VERIFY IDENTITY · 3 OF 4</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[0, 1, 2, 3].map((i) =>
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= 2 ? "var(--brand-grad)" : "var(--line)" }} />)}
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Icon name="fingerprint" size={28} color="var(--brand-purple)" />
        <div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Confirm with your government ID</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Encrypted and never shared. Reviewed in &lt; 5 minutes.</div>
        </div>
      </div>
    </div>
  );
  if (step === 1) return (
    <div style={base}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {([["video", "Video"], ["mic", "Audio"], ["pen", "Letter"]] as const).map(([n, l], i) =>
          <button key={l} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
            border: "1px solid var(--line)", borderRadius: 999, fontSize: 13,
            color: i === 0 ? "white" : "var(--ink-2)", background: i === 0 ? "var(--ink)" : "transparent",
          }}>
            <Icon name={n} size={14} color={i === 0 ? "white" : "var(--ink-2)"} />{l}
          </button>)}
      </div>
      <ImgSlot src={LLPhotos.recordingMic} alt="Microphone in soft light" style={{ aspectRatio: "16/9", borderRadius: 10 }} />
    </div>
  );
  if (step === 2) return (
    <div style={base}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 14 }}>YOUR ADVOCATES</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {["Sarah R. · sister", "Michael T. · attorney"].map((n, i) =>
          <div key={i} style={{
            padding: 14, border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 999,
              background: i === 0 ? "rgba(107,44,176,0.15)" : "rgba(46,115,220,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: i === 0 ? "var(--brand-purple)" : "var(--brand-blue)", fontWeight: 600, fontSize: 13,
            }}>{n[0]}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{n.split(" · ")[0]}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{n.split(" · ")[1]}</div>
            </div>
          </div>)}
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="shield" size={13} color="var(--ink-3)" />
        Both must independently confirm — neither can act alone.
      </div>
    </div>
  );
  if (step === 3) return (
    <div style={base}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 14 }}>VERIFICATION WORKFLOW</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        {["Advocate A confirms", "Identity check", "Advocate B confirms", "24-hr safety hold", "Release"].map((s, i, arr) =>
          <span key={i} style={{ display: "contents" }}>
            <div style={{
              padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10,
              fontSize: 11, color: "var(--ink-2)", background: "var(--surface)", textAlign: "center",
              flex: 1, minHeight: 50, display: "flex", alignItems: "center", justifyContent: "center",
            }}>{s}</div>
            {i < arr.length - 1 && <div style={{ width: 12, height: 1, background: "var(--line)" }} />}
          </span>)}
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 14 }}>Patent-pending verification workflow</div>
    </div>
  );
  if (step === 4) return (
    <div style={base}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 14 }}>DELIVERY · IN PROGRESS</div>
      {([
        ["Family · 12 people", "Delivered", "var(--ok)"],
        ["Close friends · 48 people", "Delivering", "var(--brand-blue)"],
        ["Business contacts · 91 people", "Queued · 9:30am", "var(--ink-3)"],
      ] as const).map(([who, status, color], i) =>
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", padding: "12px 0",
          borderBottom: i < 2 ? "1px solid var(--line-soft)" : "none", fontSize: 13,
        }}>
          <span>{who}</span>
          <span style={{ color, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
            {status}
          </span>
        </div>)}
    </div>
  );
  return null;
};

// ----------------------------------------------------------- VERIFICATION BLOCK
const VerificationBlock = () => (
  <section style={{
    padding: "120px 64px", background: "var(--surface)",
    borderTop: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)",
  }}>
    <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
      <div className="ll-eyebrow" style={{ marginBottom: 16 }}>The thing nobody else has gotten right</div>
      <h2 className="serif" style={{ fontSize: 64, lineHeight: 1.02, margin: "0 0 32px", fontWeight: 500, letterSpacing: "-0.015em", textWrap: "pretty" }}>
        A false alert is unthinkable.<br />So we made it impossible.
      </h2>
      <p style={{ fontSize: 19, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 720, margin: "0 auto 64px" }}>
        Two trusted advocates. Independent identity checks. A 24-hour safety
        hold. Cancellable at any time, by you or either advocate. We've turned the most fragile
        moment in a life into the most carefully held one.
      </p>

      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 22, padding: "56px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 56, alignItems: "center" }}>
          <AdvocateCard side="left" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "var(--brand-grad)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "var(--shadow-2)",
            }}>
              <Icon name="shield" size={28} color="white" stroke={1.8} />
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.15em" }}>AND</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", maxWidth: 160, textAlign: "center" }}>
              Both must confirm.<br />Neither can act alone.
            </div>
          </div>
          <AdvocateCard side="right" />
        </div>
      </div>

      <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, textAlign: "left" }}>
        {([
          ["Patent-pending", "Dual-advocate verification, conditional posthumous activation, and structured life-area notification are covered by pending IP."],
          ["Cancellable at any moment", "If anything changes — a contact, an advocate, a message — you can update or revoke instantly. You are always in control."],
          ["Auditable & encrypted", "Every action is written to a verifiable event log. Messages are encrypted at rest and sealed until verified release."],
        ] as const).map(([t, b], i) =>
          <div key={i}>
            <h4 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 8px" }}>{t}</h4>
            <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.55, margin: 0 }}>{b}</p>
          </div>)}
      </div>
    </div>
  </section>
);

const AdvocateCard = ({ side }: { side: "left" | "right" }) => (
  <div style={{
    padding: 24, background: "var(--surface)", border: "1px solid var(--line)",
    borderRadius: 16, display: "flex", flexDirection: "column", gap: 16, boxShadow: "var(--shadow-1)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        background: side === "left" ? "rgba(107,44,176,0.12)" : "rgba(46,115,220,0.12)",
        color: side === "left" ? "var(--brand-purple)" : "var(--brand-blue)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 500, fontSize: 16, fontFamily: "var(--font-serif)",
      }}>{side === "left" ? "S" : "M"}</div>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: 500 }}>{side === "left" ? "Sarah R." : "Michael T."}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{side === "left" ? "Sister · Chicago" : "Attorney · Boston"}</div>
      </div>
    </div>
    <div style={{
      padding: "10px 14px", background: "var(--bg)", borderRadius: 10,
      border: "1px solid var(--line-soft)", display: "flex", alignItems: "center", gap: 10,
      fontSize: 13, color: "var(--ink-2)",
    }}>
      <Icon name="check" size={14} color="var(--ok)" />
      Confirmed identity · 10:42 am
    </div>
    <div style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "left" }}>
      ID checked · Death certificate uploaded · Phone &amp; geo verified
    </div>
  </div>
);

// ----------------------------------------------------------- TRUST
const TrustBlock = () => (
  <section id="trust" style={{ padding: "120px 64px", maxWidth: 1280, margin: "0 auto" }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 80, alignItems: "center" }}>
      <ImgSlot src={LLPhotos.letterHands} alt="Hands writing a letter" style={{ aspectRatio: "4/5", borderRadius: 18 }} />
      <div>
        <div className="ll-eyebrow" style={{ marginBottom: 16 }}>Trust &amp; security</div>
        <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, margin: "0 0 28px", fontWeight: 500, letterSpacing: "-0.015em" }}>
          The most careful product you'll ever use.
        </h2>
        <p style={{ fontSize: 17, color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 36 }}>
          We hold something irreplaceable: your words for the people you love most.
          That responsibility shapes every decision we make.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
          {([
            ["AES-256 encryption at rest", "Your messages are sealed with strong encryption and stay sealed until verified release."],
            ["SOC 2 Type II — audit underway", "We're pursuing independent annual audits and treat your data the way hospitals treat charts."],
            ["Verifiable audit log", "Every advocate action, every login, every release is recorded and verifiable."],
            ["Patent-pending workflow", "Dual-advocate verification and conditional posthumous release."],
            ["No third-party data sale, ever", "We make money from subscriptions and partnerships — not your information."],
          ] as const).map(([t, b], i) =>
            <li key={i} style={{
              padding: "20px 0", borderTop: "1px solid var(--line)",
              borderBottom: i === 4 ? "1px solid var(--line)" : "none",
              display: "grid", gridTemplateColumns: "24px 1fr", gap: 16,
            }}>
              <Icon name="check" size={18} color="var(--brand-purple)" />
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{t}</div>
                <div style={{ fontSize: 14, color: "var(--ink-3)" }}>{b}</div>
              </div>
            </li>)}
        </ul>
      </div>
    </div>
  </section>
);

// ----------------------------------------------------------- SCENARIOS
const ScenariosBlock = () => {
  const [tab, setTab] = useState(0);
  const tabs = [
    { label: "For a father", who: "Daniel · 62 · architect",
      excerpt: "Em — there's so much I never said out loud. Sit with me for nine minutes.",
      to: "To his daughter, on her 30th birthday — and his last.",
      audience: ["Family · 12", "Close friends · 48", "Studio &amp; clients · 91"] },
    { label: "For a founder", who: "Priya · 51 · CEO",
      excerpt: "If you're seeing this, you already know. Here's what I'd want you to do next.",
      to: "To her co-founders, with a recorded handoff and her notes on the next two years.",
      audience: ["Family · 4", "Leadership · 9", "Investors &amp; board · 22"] },
    { label: "For a grandmother", who: "Constance · 84 · grandmother of seven",
      excerpt: "There's a recipe I never wrote down. I want each of you to have it.",
      to: "To seven grandchildren, with a video for each one, by name.",
      audience: ["Family · 23", "Friends · 14"] },
  ];
  const t = tabs[tab]!;
  return (
    <section id="scenarios" style={{
      padding: "120px 64px", background: "var(--surface)",
      borderTop: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="ll-eyebrow" style={{ marginBottom: 16 }}>Who LastLink is for</div>
        <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, margin: "0 0 48px", fontWeight: 500, letterSpacing: "-0.015em", maxWidth: 760, textWrap: "pretty" }}>
          Three quiet moments LastLink was built for.
        </h2>

        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {tabs.map((tt, i) =>
            <button key={i} onClick={() => setTab(i)} style={{
              padding: "10px 20px", border: "1px solid var(--line)",
              background: i === tab ? "var(--ink)" : "transparent",
              color: i === tab ? "var(--bone-soft)" : "var(--ink-2)",
              borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}>{tt.label}</button>)}
        </div>

        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 20, padding: 48, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 64 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 14 }}>{t.who.toUpperCase()}</div>
            <blockquote className="serif" style={{ fontStyle: "italic", fontSize: 36, lineHeight: 1.2, margin: "0 0 20px", color: "var(--ink)", fontWeight: 500, textWrap: "pretty" }}>
              "{t.excerpt}"
            </blockquote>
            <p style={{ fontSize: 15, color: "var(--ink-3)", margin: 0, lineHeight: 1.55 }}>{t.to}</p>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 14 }}>MESSAGE GROUPS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {t.audience.map((a, i) =>
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--line)",
                  borderRadius: 12, fontSize: 15,
                }}>
                  <span dangerouslySetInnerHTML={{ __html: a }} />
                  <Icon name="check" size={16} color="var(--ok)" />
                </div>)}
            </div>
            <div style={{ marginTop: 24, padding: 20, background: "var(--brand-grad-soft)", border: "1px solid var(--line)", borderRadius: 12, fontSize: 13, color: "var(--ink-2)" }}>
              Each group can receive a different message — the one for family, the one for colleagues, and the one only one person was ever meant to hear.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------------- PRICING
const PricingTeaser = () => (
  <section id="pricing" style={{ padding: "120px 64px", maxWidth: 1280, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 56 }}>
      <div className="ll-eyebrow" style={{ marginBottom: 16 }}>Pricing</div>
      <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, margin: "0 0 16px", fontWeight: 500, letterSpacing: "-0.015em" }}>
        Begin for free. Forever.
      </h2>
      <p style={{ fontSize: 17, color: "var(--ink-2)", maxWidth: 560, margin: "0 auto" }}>
        Everyone deserves a verified last word. Premium adds video, multi-group messages, and unlimited storage.
      </p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {([
        { name: "Free", price: "$0", per: "forever", desc: "Everything you need to make sure you're heard.",
          features: ["1 message · 1 audience group", "Designate two advocates", "Verified, dignified delivery", "Encryption at rest", "Up to 50 contacts"],
          cta: "Begin your LastLink", grad: false },
        { name: "Premium", price: "$60", per: "per year", desc: "For when one message isn't enough.",
          features: ["Unlimited messages — video, audio, letter", "Family, friends, business, and custom groups", "Up to 1,000 contacts", "Memorial page &amp; legacy archive", "Priority advocate support 24/7"],
          cta: "Go Premium", grad: true },
      ] as const).map((p, i) =>
        <div key={i} style={{
          padding: 40, background: p.grad ? "var(--ink)" : "var(--surface)",
          color: p.grad ? "var(--bone-soft)" : "var(--ink)",
          border: "1px solid " + (p.grad ? "transparent" : "var(--line)"),
          borderRadius: 22, position: "relative", overflow: "hidden",
        }}>
          {p.grad && <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, background: "var(--brand-grad)", opacity: 0.55, borderRadius: "50%", filter: "blur(60px)" }} />}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28 }}>
              <h3 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: 0 }}>{p.name}</h3>
              <div style={{ textAlign: "right" }}>
                <div className="serif" style={{ fontSize: 36, fontWeight: 500, lineHeight: 1 }}>{p.price}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{p.per}</div>
              </div>
            </div>
            <p style={{ fontSize: 15, opacity: 0.85, marginBottom: 24 }}>{p.desc}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
              {p.features.map((f, j) =>
                <li key={j} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name="check" size={14} color={p.grad ? "#5AA0F0" : "var(--brand-purple)"} stroke={2.2} />
                  <span dangerouslySetInnerHTML={{ __html: f }} />
                </li>)}
            </ul>
            <a href={APP} className={"ll-btn " + (p.grad ? "grad" : "secondary")} style={{ width: "100%", justifyContent: "center" }}>
              {p.cta} <Icon name="arrow" size={14} />
            </a>
          </div>
        </div>)}
    </div>
  </section>
);

// ----------------------------------------------------------- FINAL CTA
const FinalCTA = () => (
  <section id="enterprise" style={{ padding: "140px 64px", background: "var(--ink)", color: "var(--bone-soft)", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 800, height: 800, background: "var(--brand-grad)", opacity: 0.12, borderRadius: "50%", filter: "blur(80px)" }} />
    <div style={{ maxWidth: 920, margin: "0 auto", textAlign: "center", position: "relative" }}>
      <h2 className="serif" style={{ fontSize: 72, lineHeight: 1.02, margin: "0 0 24px", fontWeight: 500, letterSpacing: "-0.015em", textWrap: "pretty" }}>
        Every person who dies deserves to be remembered with intention.
      </h2>
      <p className="serif" style={{ fontSize: 28, fontStyle: "italic", color: "var(--ink-4)", margin: "0 0 48px", lineHeight: 1.3, fontWeight: 400 }}>
        Every person left behind deserves to be told with dignity.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <a href={APP} className="ll-btn grad" style={{ padding: "16px 30px", fontSize: 15 }}>
          Begin your LastLink — free <Icon name="arrow" size={16} color="white" />
        </a>
        <a href="mailto:dawn@lastlink.com" className="ll-btn" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "var(--bone-soft)", padding: "16px 30px", fontSize: 15 }}>
          For organizations &amp; HR
        </a>
      </div>
    </div>
  </section>
);

// ----------------------------------------------------------- FOOTER
const Footer = () => (
  <footer style={{ padding: "64px 64px 40px", background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.3fr repeat(4, 1fr)", gap: 48 }}>
      <div>
        <Logo size={24} />
        <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 16, maxWidth: 280, lineHeight: 1.55 }}>
          A verified, patent-pending digital death notification and legacy messaging platform.
        </p>
      </div>
      {([
        ["Product", ["How it works", "Pricing", "Security", "Patent"]],
        ["For organizations", ["HR & benefits", "Insurance", "Hospice", "Military"]],
        ["Resources", ["Help center", "Sample messages", "Estate guide", "Blog"]],
        ["Company", ["About", "Press", "Careers", "Contact"]],
      ] as const).map(([h, items]) =>
        <div key={h}>
          <div className="ll-eyebrow" style={{ marginBottom: 14 }}>{h}</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((l) => <li key={l} style={{ fontSize: 13, color: "var(--ink-2)" }}>{l}</li>)}
          </ul>
        </div>)}
    </div>
    <div style={{ maxWidth: 1280, margin: "48px auto 0", paddingTop: 24, borderTop: "1px solid var(--line-soft)", display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-3)" }}>
      <span>© 2026 LastLink, Inc. · Patent pending · dawn@lastlink.com</span>
      <span>Privacy · Terms · Status · Security</span>
    </div>
  </footer>
);
