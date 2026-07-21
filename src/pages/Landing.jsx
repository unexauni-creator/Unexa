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