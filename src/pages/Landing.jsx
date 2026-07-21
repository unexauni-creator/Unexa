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
        <div className="landing-hero-eyebrow">Design & Art Education, Simplified</div>
        <h1 className="landing-hero-title">Find your university.<br />Plan your future.</h1>
        <p className="landing-hero-desc">
          Discover design and art universities across Europe, compare programs side by side,
          and build a career roadmap tailored to you — all in one place.
        </p>
        <div className="landing-hero-actions">
          <button className="landing-hero-btn-primary" onClick={() => navigate("/login?mode=signup")}>
            Get Started — it's free
          </button>
          <button className="landing-hero-btn-secondary" onClick={() => navigate("/login")}>
            I already have an account
          </button>
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