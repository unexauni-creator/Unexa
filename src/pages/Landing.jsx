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

      <section className="landing-features">
        {FEATURES.map(f => (
          <div className="landing-feature-card" key={f.title}>
            <div className="landing-feature-icon">{f.icon}</div>
            <div className="landing-feature-title">{f.title}</div>
            <div className="landing-feature-desc">{f.desc}</div>
          </div>
        ))}
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Unexa. All rights reserved.</span>
      </footer>
    </div>
  );
}