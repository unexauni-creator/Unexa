import { useNavigate } from "react-router-dom";

const FEATURES = [
  { icon: "🎓", title: "Discover Universities", desc: "Browse design and art programs across Europe, filtered by country, tuition, language, and more.", accent: "mustard" },
  { icon: "⚖️", title: "Compare Side by Side", desc: "Add up to 4 universities to your dashboard and compare scholarships, deadlines, and requirements at a glance.", accent: "moss" },
  { icon: "🧭", title: "Plan Your Roadmap", desc: "Get a personalized 5-year career roadmap showing what to focus on and when.", accent: "clay" },
  { icon: "👥", title: "Join the Community", desc: "Connect with other students exploring the same programs and universities.", accent: "sky" },
];

const JOURNEY = [
  { num: "01", title: "Browse the map", desc: "Explore 50+ design and art programs across Europe, filtered by country, tuition, and language." },
  { num: "02", title: "Shortlist & compare", desc: "Pin up to 4 favorites to your dashboard and line up deadlines, scholarships, and requirements." },
  { num: "03", title: "Get your roadmap", desc: "Receive a personalized 5-year plan so you know exactly what to prepare, and when." },
];

const UNIVERSITIES = [
  { code: "ECAL", name: "ECAL", loc: "Lausanne, Switzerland", tag: "Product Design", accent: "mustard" },
  { code: "DAE", name: "Design Academy Eindhoven", loc: "Eindhoven, Netherlands", tag: "Contextual Design", accent: "moss" },
  { code: "CSM", name: "Central Saint Martins", loc: "London, United Kingdom", tag: "Fashion & Textiles", accent: "clay" },
  { code: "POLI", name: "Politecnico di Milano", loc: "Milan, Italy", tag: "Communication Design", accent: "sky" },
];

const STATS = [
  { number: "50+", label: "Universities", caption: "Design & art programs tracked across Europe" },
  { number: "12", label: "Countries", caption: "From Lisbon to Helsinki" },
  { number: "300+", label: "Scholarships", caption: "Funding options mapped to each program" },
  { number: "5 yr", label: "Roadmaps", caption: "A plan built around your timeline" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-nav-logo">Unexa</div>
        <nav className="landing-nav-links">
          {["Programs", "Compare", "Roadmap", "About"].map(l => <a href="#" key={l}>{l}</a>)}
        </nav>
        <div className="landing-nav-actions">
          <button className="landing-nav-login" onClick={() => navigate("/login")}>Log in</button>
          <button className="landing-nav-cta" onClick={() => navigate("/login?mode=signup")}>Get Started →</button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-blob" aria-hidden="true" />
        <span className="landing-hero-sparkle landing-hero-sparkle-left" aria-hidden="true">✦</span>
        <span className="landing-hero-sparkle landing-hero-sparkle-right" aria-hidden="true">✧</span>
        <div className="landing-hero-grid-deco" aria-hidden="true" />

        <div className="landing-hero-inner">
          <div className="landing-hero-eyebrow-row">
            <span className="landing-hero-badge-dot">✳</span>
            <span className="landing-hero-eyebrow">Design & Art Education, Simplified</span>
          </div>

          <h1 className="landing-hero-title">
            Find your <span className="landing-hero-accent">university</span>.<br />
            Plan your future.
          </h1>

          <div className="landing-hero-bottom">
            <div className="landing-hero-trust">
              <div className="landing-hero-avatars">
                <span className="landing-hero-avatar" style={{ background: "#E8B84B" }}>A</span>
                <span className="landing-hero-avatar" style={{ background: "#7C9070" }}>M</span>
                <span className="landing-hero-avatar" style={{ background: "#C97B57" }}>S</span>
              </div>
              <p className="landing-hero-trust-text"><strong>5,000+ students</strong> planning their future with Unexa</p>
            </div>

            <div className="landing-hero-cta-block">
              <p className="landing-hero-desc">
                Discover design and art universities across Europe, compare programs side by side, and build a roadmap tailored to you.
              </p>
              <button className="landing-btn-primary" onClick={() => navigate("/login?mode=signup")}>
                Show all universities →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <div className="landing-section-head">
          <span className="landing-eyebrow">Why Unexa</span>
          <h2 className="landing-section-title">Everything you need to choose well</h2>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map(f => (
            <div className="landing-feature-card" key={f.title}>
              <div className={`landing-feature-icon landing-accent-${f.accent}`}>{f.icon}</div>
              <div className="landing-feature-title">{f.title}</div>
              <div className="landing-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-journey">
        <div className="landing-section-head">
          <span className="landing-eyebrow">The Journey</span>
          <h2 className="landing-section-title">From shortlist to acceptance letter</h2>
        </div>
        <div className="landing-journey-row">
          {JOURNEY.map((step, i) => (
            <div className="landing-journey-item" key={step.title}>
              <div className="landing-journey-num">{step.num}</div>
              <div className="landing-journey-item-title">{step.title}</div>
              <div className="landing-journey-item-desc">{step.desc}</div>
              {i < JOURNEY.length - 1 && <div className="landing-journey-divider" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured universities ── */}
      <section className="landing-universities">
        <div className="landing-section-head">
          <span className="landing-eyebrow">Where Students Are Headed</span>
          <h2 className="landing-section-title">A few favorites on the map</h2>
          <p className="landing-section-desc">
            A small sample of the design and art programs students are comparing on Unexa right now.
          </p>
        </div>
        <div className="landing-uni-grid">
          {UNIVERSITIES.map(u => (
            <div className="landing-uni-card" key={u.name}>
              <div className={`landing-uni-visual landing-accent-bg-${u.accent}`}>
                <span className="landing-uni-monogram">{u.code}</span>
              </div>
              <div className="landing-uni-body">
                <div className="landing-uni-name">{u.name}</div>
                <div className="landing-uni-loc">{u.loc}</div>
                <div className="landing-uni-tag">{u.tag}</div>
                <button className="landing-uni-link" onClick={() => navigate("/login?mode=signup")}>
                  View program →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats">
        <div className="landing-section-head">
          <span className="landing-eyebrow">Unexa at a Glance</span>
          <h2 className="landing-section-title">Our numbers, so you can plan with confidence</h2>
        </div>
        <div className="landing-stats-row">
          {STATS.map((s, i) => (
            <div className="landing-stat" key={s.label}>
              <div className="landing-stat-number">{s.number}</div>
              <div className="landing-stat-label">{s.label}</div>
              <div className="landing-stat-caption">{s.caption}</div>
              {i < STATS.length - 1 && <div className="landing-stat-divider" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="landing-testimonial">
        <div className="landing-testimonial-panel">
          <div className="landing-testimonial-mark">”</div>
          <p className="landing-testimonial-quote">
            I had eleven tabs open comparing tuition and deadlines before I found Unexa.
            Having it all in one dashboard is what actually got my applications in on time.
          </p>
          <div className="landing-testimonial-name">Elena M.</div>
          <div className="landing-testimonial-role">Product Design applicant, ECAL</div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="landing-cta-panel">
          <h2 className="landing-cta-title">Your program is out there.</h2>
          <p className="landing-cta-desc">
            Start browsing design and art universities across Europe, and build the roadmap that gets you there.
          </p>
          <button className="landing-cta-btn" onClick={() => navigate("/login?mode=signup")}>
            Get started free
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-logo">Unexa</div>
        <div className="landing-footer-links">
          <a href="#">About</a>
          <a href="#">Universities</a>
          <a href="#">Contact</a>
        </div>
        <span className="landing-footer-copy">© {new Date().getFullYear()} Unexa. All rights reserved.</span>
      </footer>
    </div>
  );
}