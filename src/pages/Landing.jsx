import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: "🎓",
    title: "Discover Universities",
    desc: "Browse design and art programs across Europe, filtered by country, tuition, language, and more.",
  },
  {
    icon: "⚖️",
    title: "Compare Side by Side",
    desc: "Add up to 4 universities to your dashboard and compare scholarships, deadlines, and requirements at a glance.",
  },
  {
    icon: "🧭",
    title: "Plan Your Roadmap",
    desc: "Get a personalized 5-year career roadmap showing what to focus on and when.",
  },
  {
    icon: "👥",
    title: "Join the Community",
    desc: "Connect with other students exploring the same programs and universities.",
  },
];

const HERO_IMAGES = [
  "https://madeinmarseille.net/actualites-marseille/2019/04/Cube-campus-aix.jpeg",
  "https://upload.wikimedia.org/wikipedia/commons/8/8f/Ijba_iut_montaigne_bordeaux.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg/330px-Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg",
];

const JOURNEY = [
  {
    mark: "①",
    title: "Browse the map",
    desc: "Explore 50+ design and art programs across Europe, filtered by country, tuition, and language.",
  },
  {
    mark: "②",
    title: "Shortlist & compare",
    desc: "Pin up to 4 favorites to your dashboard and line up deadlines, scholarships, and requirements.",
  },
  {
    mark: "③",
    title: "Get your roadmap",
    desc: "Receive a personalized 5-year plan so you know exactly what to prepare, and when.",
  },
];

const UNIVERSITIES = [
  { code: "CH", name: "ECAL", loc: "Lausanne, Switzerland", tag: "Product Design", color: "#B5654F" },
  { code: "NL", name: "Design Academy Eindhoven", loc: "Eindhoven, Netherlands", tag: "Contextual Design", color: "#7C9070" },
  { code: "UK", name: "Central Saint Martins", loc: "London, United Kingdom", tag: "Fashion & Textiles", color: "#AC8876" },
  { code: "IT", name: "Politecnico di Milano", loc: "Milan, Italy", tag: "Communication Design", color: "#C4956A" },
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
        <div className="landing-logo">Unexa</div>
        <div className="landing-nav-actions">
          <button className="landing-nav-login" onClick={() => navigate("/login")}>Log in</button>
          <button className="landing-nav-cta" onClick={() => navigate("/login?mode=signup")}>Get Started</button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-text">
          <div className="landing-hero-eyebrow">Design & Art Education, Simplified</div>
          <h1 className="landing-hero-title">Find your university.<br />Plan your future.</h1>
          <div className="landing-hero-side">
            <p className="landing-hero-desc">
              Discover design and art universities across Europe, compare programs side by side,
              and build a career roadmap tailored to you — all in one place.
            </p>
            <button className="landing-hero-btn-primary" onClick={() => navigate("/login?mode=signup")}>
              Show all universities
            </button>
          </div>
        </div>

        <div className="landing-hero-strip">
          <div className="landing-hero-moon" />
          <div className="landing-hero-photo">
            <img src={HERO_IMAGES[0]} alt="" />
          </div>
          <div className="landing-hero-moon landing-hero-moon-pair" />
          <div className="landing-hero-photo">
            <img src={HERO_IMAGES[1]} alt="" />
          </div>
          <div className="landing-hero-badge">
            <svg viewBox="0 0 200 200" className="landing-hero-badge-ring">
              <defs>
                <path id="badgeCircle" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
              </defs>
              <text>
                <textPath href="#badgeCircle">
                  UNEXA · DESIGN & ART UNIVERSITIES · UNEXA · DESIGN & ART UNIVERSITIES ·
                </textPath>
              </text>
            </svg>
            <div className="landing-hero-badge-center">
              <div className="landing-hero-badge-number">50+</div>
              <div className="landing-hero-badge-label">universities</div>
            </div>
          </div>
          <div className="landing-hero-photo">
            <img src={HERO_IMAGES[2]} alt="" />
          </div>
          <div className="landing-hero-moon" />
        </div>

        <div className="landing-hero-scroll">
          <span>↓</span>
          <span>Scroll to see more</span>
          <span>↓</span>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        {FEATURES.map(f => (
          <div className="landing-feature-card" key={f.title}>
            <div className="landing-feature-icon">{f.icon}</div>
            <div className="landing-feature-title">{f.title}</div>
            <div className="landing-feature-desc">{f.desc}</div>
          </div>
        ))}
      </section>

      {/* ── How it works ── */}
      <section className="landing-journey">
        <div className="landing-section-head">
          <span className="landing-eyebrow">The Journey</span>
          <h2 className="landing-section-title">From shortlist to acceptance letter</h2>
        </div>
        <div className="landing-journey-path">
          {JOURNEY.map(step => (
            <div className="landing-journey-step" key={step.title}>
              <div className="landing-journey-connector" />
              <div className="landing-journey-stamp">{step.mark}</div>
              <div className="landing-journey-step-title">{step.title}</div>
              <div className="landing-journey-step-desc">{step.desc}</div>
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
              <div className="landing-uni-flag" style={{ background: u.color }}>{u.code}</div>
              <div>
                <div className="landing-uni-name">{u.name}</div>
                <div className="landing-uni-loc">{u.loc}</div>
              </div>
              <div className="landing-uni-tag">{u.tag}</div>
              <button className="landing-uni-link" onClick={() => navigate("/login?mode=signup")}>
                View program →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats">
        <div className="landing-stats-row">
          {STATS.map(s => (
            <div className="landing-stat" key={s.label}>
              <div className="landing-stat-circle">
                <div className="landing-stat-number">{s.number}</div>
                <div className="landing-stat-label">{s.label}</div>
              </div>
              <div className="landing-stat-caption">{s.caption}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="landing-testimonial">
        <div className="landing-testimonial-card">
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
          <div className="landing-cta-ring" />
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