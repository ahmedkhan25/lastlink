import { useState, useEffect } from "react";
import { Logo, Icon, ImgSlot, LLPhotos, type IconName } from "@lastlink/ui";

// CTAs point at the registrant app. In prod, set VITE_APP_URL to the lastlink-web URL.
const APP = import.meta.env.VITE_APP_URL ?? "http://localhost:5273";
// Advocate re-entry surface — for someone named as an advocate, whenever the day comes.
const ADVOCATE = import.meta.env.VITE_ADVOCATE_URL ?? "http://localhost:5274";

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
      <a href="#messages">Your messages</a>
      <a href="#pricing">Plans</a>
      <a href="#enterprise">For Partners</a>
    </nav>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <a href={ADVOCATE} className="ll-btn ghost ll-hide-mobile">I'm an advocate</a>
      <a href={APP} className="ll-btn ghost ll-hide-mobile">Linker Sign-in</a>
      <a href={APP} className="ll-btn">Begin your LastLink</a>
    </div>
  </header>
);

// ----------------------------------------------------------- HERO
const Hero = () => (
  <section style={{
    padding: "96px 64px 80px", display: "grid",
    gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.15fr)",
    gap: 56, alignItems: "center", maxWidth: 1480, margin: "0 auto",
  }}>
    <div>
      <div className="ll-chip" style={{ marginBottom: 28 }}>
        <span className="dot" />
        Patented dual-advocate verification
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
      <div className="ll-btnrow" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <a href={APP} className="ll-btn">
          Begin your LastLink
          <Icon name="arrow" size={16} />
        </a>
        <a href="#how" className="ll-btn secondary">See how it works</a>
      </div>
      <div className="ll-reassure" style={{
        display: "flex", gap: 36, marginTop: 56, paddingTop: 28,
        borderTop: "1px solid var(--line)", color: "var(--ink-3)", fontSize: 13,
      }}>
        <Reassure icon="shield" label="Verified by two independent advocates" />
        <Reassure icon="lock" label="Encrypted at rest · SOC&nbsp;2 audit underway" />
        <Reassure icon="leaf" label="10 minutes to register · free to begin" />
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
  <div style={{ position: "relative", width: "100%", maxWidth: 720, marginLeft: "auto", flexShrink: 0 }}>
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: "var(--r-4)", boxShadow: "var(--shadow-3)", padding: 12,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.12em",
        textTransform: "uppercase", padding: "6px 8px 12px",
      }}>
        <span>For · Emily</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ok)" }} />
          Verified delivery
        </span>
      </div>

      {/* The real 30s message video (16:9). Autoplays muted; tap to unmute. */}
      <div style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "16 / 9", background: "#241D17" }}>
        <video
          src="/assets/video/LastLink_30s_Marketing_v2.mp4"
          autoPlay muted loop playsInline controls preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      <div style={{ fontSize: 13, color: "var(--ink-3)", padding: "12px 8px 6px" }}>
        A message from <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>Daniel R.</span> · for his daughter Emily
        <span style={{ color: "var(--ink-3)" }}> · tap to unmute</span>
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
const PROBLEMS = [
  { img: "/assets/problem/image1.webp", title: "Currently No Trusted Solution", body: "Families learn through a Facebook comment or a whispered rumor — never a dignified, confirmed source." },
  { img: "/assets/problem/image2.webp", title: "Networks go dark", body: "Colleagues, partners, and clients find out days late. Deals stall. Relationships fray in the silence." },
  { img: "/assets/problem/image3.webp", title: "Final words go unspoken", body: "People pass with messages undelivered — love left unsaid, gratitude never expressed, goodbyes never heard." },
  { img: "/assets/problem/image4.webp", title: "No one has solved this", body: "Until LastLink, no platform verified a passing, then delivered the news gently — in the person's own words." },
] as const;

const CYCLE_MS = 5000;

const ProblemStrip = () => {
  const [active, setActive] = useState(0);
  // Auto-advance; resetting on `active` means a manual click also gets a full dwell.
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % PROBLEMS.length), CYCLE_MS);
    return () => clearInterval(t);
  }, [active]);
  const p = PROBLEMS[active]!;

  return (
    <section style={{
      padding: "96px 64px", background: "var(--surface)",
      borderTop: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="ll-eyebrow" style={{ marginBottom: 16 }}>The quiet problem</div>
        <h2 className="serif" style={{
          fontSize: 56, lineHeight: 1.05, margin: "0 0 56px",
          letterSpacing: "-0.015em", maxWidth: 980, fontWeight: 500, textWrap: "pretty",
        }}>
          In America, <span style={{ color: "var(--brand-purple)" }}>3.7 million people</span> pass each year.
          Each one leaves behind about <span style={{ color: "var(--brand-blue)" }}>150 relationships</span> who deserve to be told —
          and most of them won't be.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 56, alignItems: "center" }}>
          {/* Left: the issues as quiet nav, active one carries a filling progress line */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {PROBLEMS.map((pp, i) => (
              <button key={i} onClick={() => setActive(i)} aria-label={pp.title} style={{
                textAlign: "left", padding: "18px 0", background: "transparent",
                border: "none", borderTop: "1px solid var(--line)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14,
                opacity: i === active ? 1 : 0.45, transition: "opacity 260ms ease",
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid var(--line)" }}>
                  <img src={pp.img} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: i === active ? "none" : "grayscale(0.7)", transition: "filter 300ms ease" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>{pp.title}</div>
                  {i === active && (
                    <div style={{ height: 2, background: "var(--line)", borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
                      <div key={active} className="ll-progress" style={{ height: "100%", background: "var(--brand-grad)" }} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Right: the spotlight — a photo on top, then the words. Crossfades. */}
          <div style={{
            background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 22,
            overflow: "hidden", position: "relative",
          }}>
            <div key={active} className="ll-reveal">
              <div style={{ aspectRatio: "16 / 9", overflow: "hidden", background: "#241D17" }}>
                <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ padding: "30px 40px 36px" }}>
                <h3 className="serif" style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 14px", lineHeight: 1.1 }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: 18, color: "var(--ink-2)", lineHeight: 1.6, margin: 0, maxWidth: 560 }}>{p.body}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------------- HOW IT WORKS
const HowItWorks = () => {
  const [active, setActive] = useState(0);
  // Three user-facing steps. Contact lists are assembled in the background as
  // you go, so collecting them is deliberately not a step of its own.
  const steps = [
    { n: "01", title: "Sign up", sub: "10 minutes. A lifetime of peace.",
      body: "Create your account and verify your identity. That's the whole of it — your contacts come together in the background as you go." },
    { n: "02", title: "Pick your advocates", sub: "The people you trust most.",
      body: "Two people you choose, who each confirm independently. Neither can act alone, and either can stop a release." },
    { n: "03", title: "Link your message", sub: "Your voice, your way.",
      body: "Record video or audio. Type a letter. Send something different to each group — or one message for everyone." },
  ];
  return (
    <section id="how" style={{ padding: "120px 64px 96px", maxWidth: 1280, margin: "0 auto" }}>
      <div className="ll-stack-mobile" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56 }}>
        <div>
          <div className="ll-eyebrow" style={{ marginBottom: 16 }}>How it works</div>
          <h2 className="serif" style={{
            fontSize: 64, lineHeight: 1.02, margin: 0, letterSpacing: "-0.015em",
            fontWeight: 500, maxWidth: 720, textWrap: "pretty",
          }}>
            Three quiet steps.<br />One last act of love.
          </h2>
        </div>
        <div className="ll-hide-mobile" style={{ color: "var(--ink-3)", fontSize: 13, maxWidth: 280, textAlign: "right" }}>
          Hover or click a step to read more. Each is its own protected workflow.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 64, alignItems: "stretch" }}>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((s, i) => {
            const isActive = i === active;
            return (
              <li key={i} className="ll-row-step" onMouseEnter={() => setActive(i)} onClick={() => setActive(i)}
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

        <div className="ll-howpanel" style={{
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18,
          padding: 36, display: "flex", flexDirection: "column", minHeight: 440,
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
  if (step === 2) return (
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
  if (step === 1) return (
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
  return null;
};

// ----------------------------------------------------------- VERIFICATION BLOCK
const VerificationBlock = () => (
  <section style={{
    padding: "120px 64px", background: "var(--surface)",
    borderTop: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)",
  }}>
    <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
      <h2 className="serif" style={{ fontSize: 64, lineHeight: 1.02, margin: "0 0 64px", fontWeight: 500, letterSpacing: "-0.015em", textWrap: "pretty" }}>
        Trusted advocates,<br />independently verified.
      </h2>

      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 22, padding: "56px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 56, alignItems: "center" }}>
          <AdvocateCard side="left" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {/* The mark sits between the two advocates — the thing that holds
                both confirmations together. Soft ground, not the gradient, so
                the colored mark keeps its contrast. */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "var(--brand-grad-soft)",
              border: "1px solid var(--line)", boxShadow: "var(--shadow-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Logo size={30} withWordmark={false} />
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
          ["Patented", "Dual-advocate verification and conditional posthumous release are protected by our issued US patent."],
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
          The most careful product you'll use.
        </h2>
        <p style={{ fontSize: 17, color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 36 }}>
          We hold something irreplaceable, your words for the people you love most.
          That responsibility shapes every decision we make.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
          {([
            ["AES-256 encryption at rest", "Your messages are sealed with strong encryption and stay sealed until verified release."],
            ["SOC 2 Type II — audit underway", "We're pursuing independent annual audits and treat your data the way hospitals treat charts."],
            ["Verifiable audit log", "Advocate actions, logins, and releases are recorded and verifiable."],
            ["Patented workflow", "Dual-advocate verification and conditional posthumous release."],
            ["No third-party data sale", "We make money from subscriptions and partnerships — not your information."],
          ] as const).map(([t, b], i) =>
            <li key={i} className="ll-row-icon" style={{
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
// Private vs. public is the only distinction we draw at this stage. The wording
// tracks Terms of Service §4.3 so the marketing claim and the contract agree.
const MESSAGE_KINDS = [
  {
    kind: "Private",
    icon: "lock" as IconName,
    line: "Only the people you choose receive it.",
    body: "Create personalized messages for specific individuals. Recipients in one group can't see what was written for another, and the one meant for a single person stays that way.",
  },
  {
    kind: "Public",
    icon: "users" as IconName,
    line: "Everyone you named receives it, at the same moment.",
    body: "Send one message to your entire contacts list — so nobody hears it secondhand, and nobody hears it late.",
  },
];

const ScenariosBlock = () => (
  <section id="messages" style={{
    padding: "120px 64px", background: "var(--surface)",
    borderTop: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)",
  }}>
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div className="ll-eyebrow" style={{ marginBottom: 16 }}>Your messages</div>
      <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, margin: "0 0 48px", fontWeight: 500, letterSpacing: "-0.015em", maxWidth: 760, textWrap: "pretty" }}>
        Messages can be private or public.
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {MESSAGE_KINDS.map((m) => (
          <div key={m.kind} style={{
            background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 20,
            padding: 40, display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: "var(--brand-grad-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={m.icon} size={24} color="var(--brand-purple)" />
            </div>
            <h3 className="serif" style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.015em", margin: 0, lineHeight: 1.1 }}>
              {m.kind}
            </h3>
            <p style={{ fontSize: 17, color: "var(--ink)", lineHeight: 1.5, margin: 0 }}>{m.line}</p>
            <p style={{ fontSize: 15, color: "var(--ink-3)", lineHeight: 1.6, margin: 0 }}>{m.body}</p>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 24, padding: "20px 24px", background: "var(--brand-grad-soft)",
        border: "1px solid var(--line)", borderRadius: 14, fontSize: 14, color: "var(--ink-2)",
      }}>
        You choose which it is, message by message — and you can change your mind at any time before release.
      </div>
    </div>
  </section>
);

// ----------------------------------------------------------- PRICING
const PricingTeaser = () => (
  <section id="pricing" style={{ padding: "120px 64px", maxWidth: 1280, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 56 }}>
      <div className="ll-eyebrow" style={{ marginBottom: 16 }}>Plans</div>
      <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, margin: "0 0 16px", fontWeight: 500, letterSpacing: "-0.015em" }}>
        Begin your LastLink.
      </h2>
      <p style={{ fontSize: 17, color: "var(--ink-2)", maxWidth: 560, margin: "0 auto" }}>
        Everyone deserves a verified last word. Premium adds video, multi-group messages, and unlimited storage.
      </p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {([
        { name: "Free", price: "$0", per: "to begin", desc: "Everything you need to make sure you're heard.",
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
        Every person who passes deserves to be remembered with intention.
      </h2>
      <p className="serif" style={{ fontSize: 28, fontStyle: "italic", color: "var(--ink-4)", margin: "0 0 48px", lineHeight: 1.3, fontWeight: 400 }}>
        Every person left behind deserves to be told with dignity.
      </p>
      <div className="ll-btnrow" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <a href={APP} className="ll-btn grad" style={{ padding: "16px 30px", fontSize: 15 }}>
          Begin your LastLink <Icon name="arrow" size={16} color="white" />
        </a>
        <a href="mailto:dawn@lastlink.com" className="ll-btn" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "var(--bone-soft)", padding: "16px 30px", fontSize: 15 }}>
          For Partners &amp; HR
        </a>
      </div>
    </div>
  </section>
);

// ----------------------------------------------------------- FOOTER
// Every entry resolves to something that exists today — an on-page anchor, one
// of the two legal pages, or an inbox published in the policies. Aspirational
// links (a help centre, a blog, a patent page) are left out until they're real.
const FOOTER_COLS: readonly (readonly [string, readonly (readonly [string, string])[]])[] = [
  ["Product", [
    ["How it works", "#how"],
    ["Your messages", "#messages"],
    ["Trust & security", "#trust"],
    ["Plans", "#pricing"],
  ]],
  ["For Partners", [
    ["HR & benefits", "mailto:partnerships@lastlink.care?subject=HR%20%26%20benefits"],
    ["Insurance", "mailto:partnerships@lastlink.care?subject=Insurance"],
    ["Hospice & healthcare", "mailto:partnerships@lastlink.care?subject=Hospice%20%26%20healthcare"],
    ["Military", "mailto:partnerships@lastlink.care?subject=Military"],
  ]],
  ["Legal", [
    ["Privacy Policy", "/privacy"],
    ["Terms of Service", "/terms"],
    ["Report a concern", "mailto:security@lastlink.care?subject=Security%20concern"],
    ["Legal enquiries", "mailto:legal@lastlink.care"],
  ]],
  ["Contact", [
    ["Support", "mailto:support@lastlink.care"],
    ["Privacy questions", "mailto:privacy@lastlink.care"],
    ["Partnerships", "mailto:partnerships@lastlink.care"],
    ["For Partners & HR", "#enterprise"],
  ]],
] as const;

const Footer = () => (
  <footer style={{ padding: "64px 64px 40px", background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
    <div className="ll-footer-cols" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.3fr repeat(4, 1fr)", gap: 48 }}>
      <div>
        <Logo size={24} />
        <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 16, maxWidth: 280, lineHeight: 1.55 }}>
          A verified, patented platform for legacy messages and dignified notification.
        </p>
      </div>
      {FOOTER_COLS.map(([h, items]) =>
        <div key={h}>
          <div className="ll-eyebrow" style={{ marginBottom: 14 }}>{h}</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map(([label, href]) =>
              <li key={label} style={{ fontSize: 13, color: "var(--ink-2)" }}>
                <a href={href}>{label}</a>
              </li>)}
          </ul>
        </div>)}
    </div>
    <div className="ll-stack-mobile ll-footer-meta" style={{ maxWidth: 1280, margin: "48px auto 0", paddingTop: 24, borderTop: "1px solid var(--line-soft)", display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-3)" }}>
      <span>© 2026 LastLink, Inc. · Patented · support@lastlink.care</span>
      <span style={{ display: "flex", gap: 16 }}>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="#trust">Security</a>
      </span>
    </div>
  </footer>
);
