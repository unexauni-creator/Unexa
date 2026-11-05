import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; 

const CARDS = [
  { img: "https://madeinmarseille.net/actualites-marseille/2019/04/Cube-campus-aix.jpeg", rotate: -10 },
  { img: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Ijba_iut_montaigne_bordeaux.jpg", rotate: -4 },
  { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg/330px-Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg", rotate: 3 },
  { img: "https://cdn-s-www.bienpublic.com/images/AC513A2C-88A9-456D-972D-758F6975A8A9/NW_raw/le-campus-dijonnais-de-l-universite-de-bourgogne-accueille-plus-de-30-000-etudiants-photo-d-illustration-lbp-emma-buoncristiani-1690820597.jpg", rotate: 9 },
];

const GAP_STATS = [
  { label: "Clear cost & scholarship info", value: 82 },
  { label: "Real admission chances", value: 71 },
  { label: "Side-by-side comparison", value: 47 },
];

const HEADLINE_WORDS = "82% want clearer info on costs & scholarships".split(" ");

const RESEARCH_VIDEO_SRC = "/research-film.mp4";

const LINKEDIN_URL =
  "https://www.linkedin.com/posts/anastasiia-andriievska-136244223_unexa-uiux-ui-ugcPost-7465337400106573825-TzxU/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEFKh8UBxAs6Av--VNalFnRJGMm8XyrIoQ0";

const LINKEDIN_COMPANY_URL = "https://www.linkedin.com/company/unexauni/?viewAsMember=true";

const STACK_TOP = 110;
const SEGMENT_VH = 180;
const DWELL_FRACTION = 0.5;
const TAIL_VH = 40;
const STACK_GAP = 22;

function useIsDesktop(breakpoint = 900) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > breakpoint : true
  );

  useEffect(() => {
    function update() {
      setIsDesktop(window.innerWidth > breakpoint);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return isDesktop;
}

const PROCESS_STEPS = [
  {
    key: "research",
    type: "video",
    src: "/process-1.mp4",
    title: "Researching the space",
    text: "We studied how university and course-discovery sites look today, grouped by region — Canada, the UK, Korea — to see what actually works.",
  },
  {
    key: "references",
    type: "video",
    src: "/process-2.mp4",
    title: "Collecting references",
    text: "We pulled together the layouts and UI patterns we liked most, to shape a direction for Unexa's own design.",
  },
  {
    key: "vibecoded",
    type: "video",
    src: "/process-3.mp4",
    title: "From mockup to a live page",
    text: "After sketching the first mockup in Figma, we vibecoded it into a real, working homepage — search, filters, and university cards included.",
  },
];

const TEAM = [
  {
    key: "katia",
    photo: "/katia.jpg",
    name: "Kateryna Dmytrenko",
    linkedin: "https://www.linkedin.com/in/kateryna-dmytrenko-059a22266/",
  },
  {
    key: "anastasiia",
    photo: "/nastya.jpg",
    name: "Anastasiia Andriievska",
    linkedin: "https://www.linkedin.com/in/anastasiia-andriievska-136244223/",
  },
];

const NAV_ITEMS = [
  { id: "showcase", label: "About" },
  { id: "process", label: "Process" },
  { id: "team", label: "Team" },
];

// Sections the menu follows. "research" belongs to About, so About stays highlighted there.
// (stable array, so the section observer isn't rebuilt every render)
const NAV_IDS = ["showcase", "research", "process", "team"];
const NAV_ALIASES = { research: "showcase" };

const heySectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const heyInnerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
  },
};

const footerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const footerCtaVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
  },
};

const footerBottomRowVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 },
  },
};

const mobileRevealVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

function useSmoothScrollProgress() {
  const sectionRef = useRef(null);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    // The easing loop runs only while the value is moving and stops once it settles,
    // so the page doesn't re-render 60 times a second when nobody is scrolling.
    function tick() {
      const diff = targetRef.current - currentRef.current;
      if (Math.abs(diff) < 0.0005) {
        currentRef.current = targetRef.current;
        rafRef.current = null;
      } else {
        currentRef.current += diff * 0.12;
        rafRef.current = requestAnimationFrame(tick);
      }
      setSmoothProgress(currentRef.current);
    }

    function updateTarget() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const next = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total));
      targetRef.current = next;
      if (rafRef.current == null && next !== currentRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    updateTarget();
    const settleTimer = setTimeout(updateTarget, 300);

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget);

    return () => {
      window.removeEventListener("scroll", updateTarget);
      window.removeEventListener("resize", updateTarget);
      clearTimeout(settleTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return [sectionRef, smoothProgress];
}

// Runs fn at most once per animation frame (scroll events can fire far more often).
function rafThrottle(fn) {
  let id = null;
  const run = () => { id = null; fn(); };
  const throttled = () => { if (id == null) id = requestAnimationFrame(run); };
  throttled.cancel = () => { if (id != null) cancelAnimationFrame(id); id = null; };
  return throttled;
}

function useDocScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = rafThrottle(() => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0);
    });
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      update.cancel();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return progress;
}

function useCountUp(target, start, delay = 0, duration = 1000) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!start) return;

    let raf;
    let timeout;

    function animate() {
      let startTime = null;
      function step(ts) {
        if (startTime === null) startTime = ts;
        const p = Math.min(1, (ts - startTime) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(eased * target));
        if (p < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }

    timeout = setTimeout(animate, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [start, target, delay, duration]);

  return display;
}

function GapStat({ label, value, start, delay }) {
  const display = useCountUp(value, start, delay);
  // tallest bar (82%) = min(346px, 38vh); the others keep the same proportions
  const barRatio = (190 + value * 1.9) / 346;

  return (
    <div className="research-zoom-stat-bar" style={{ height: `calc(${barRatio.toFixed(3)} * min(346px, 38vh))` }}>
      <div className="research-zoom-stat-label">{label}</div>
      <div className="research-zoom-stat-value">{display}%</div>
    </div>
  );
}

function useMobileWordReveal(totalWords, active) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= totalWords) clearInterval(interval);
    }, 90);
    return () => clearInterval(interval);
  }, [active, totalWords]);

  return count;
}

function useVideoStack(count) {
  const wrapperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [layerProgress, setLayerProgress] = useState(() =>
    Array.from({ length: count }, (_, i) => (i === 0 ? 1 : 0))
  );

  useEffect(() => {
    const update = rafThrottle(function () {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const segmentPx = (window.innerHeight * SEGMENT_VH) / 100;
      const scrolled = Math.max(0, -rect.top);

      const progress = Array.from({ length: count }, (_, i) => {
        if (i === 0) return 1;
        const segmentStart = (i - 1) * segmentPx;
        const raw = (scrolled - segmentStart) / segmentPx;
        const adjusted = (raw - DWELL_FRACTION) / (1 - DWELL_FRACTION);
        return Math.max(0, Math.min(1, adjusted));
      });
      // re-render only when a layer actually moved
      setLayerProgress(prev =>
        prev.length === progress.length && prev.every((v, i) => Math.abs(v - progress[i]) < 0.001) ? prev : progress
      );

      let idx = 0;
      for (let i = 1; i < count; i++) {
        if (progress[i] > 0.5) idx = i;
      }
      setActiveIndex(idx);
    });

    update();
    const settleTimer = setTimeout(update, 300);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      update.cancel();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      clearTimeout(settleTimer);
    };
  }, [count]);

  return [wrapperRef, activeIndex, layerProgress];
}

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const elements = ids.map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      function (entries) {
        const visible = entries
          .filter(function (entry) {
            return entry.isIntersecting;
          })
          .sort(function (a, b) {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          });
        if (visible.length) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
    return function () {
      observer.disconnect();
    };
  }, [ids]);

  return active;
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return function () {
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return scrolled;
}

function NavLink({ item, isActive, onClick }) {
  const linkClass = isActive ? "landing-nav-link is-active" : "landing-nav-link";
  return (
    <a href={"#" + item.id} className={linkClass} onClick={onClick}>
      {item.label}
    </a>
  );
}

export default function Landing() {
  const isDesktop = useIsDesktop(900);
  const navigate = useNavigate();
  const [zoomRef, progress] = useSmoothScrollProgress();
  const [videoStackRef, activeStep, layerProgress] = useVideoStack(PROCESS_STEPS.length);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileStatsInView, setMobileStatsInView] = useState(false);
  const docProgress = useDocScrollProgress();
  const researchVideoRef = useRef(null);
  const processVideoRefs = useRef([]);

  const observedSection = useActiveSection(NAV_IDS);
  const activeSection = NAV_ALIASES[observedSection] ?? observedSection;
  const navScrolled = useScrolled();
  const navPillClass = `landing-nav-pill${navScrolled ? " is-scrolled" : ""}${mobileNavOpen ? " is-open" : ""}`;

  const rawEased = progress * progress * (3 - 2 * progress);
  const scale = isDesktop ? 0.55 + rawEased * 0.7 : 1;
  const radius = isDesktop ? 30 - rawEased * 10 : 24;
  const headingOpacity = isDesktop ? Math.max(0, 1 - progress / 0.5) : 1;
  // the video fades out completely (0.78 → 0.88) before the stats fade in (0.88 → 1), so they never overlap
  const folderOpacity = isDesktop ? Math.max(0, 1 - Math.max(0, (progress - 0.78) / 0.1)) : 1;
  const textOpacity = isDesktop ? Math.min(1, Math.max(0, (progress - 0.88) / 0.12)) : 1;

  const mobileWordCount = useMobileWordReveal(HEADLINE_WORDS.length, mobileStatsInView);
  const wordRevealFraction = isDesktop
    ? Math.max(0, Math.min(1, (progress - 0.88) / 0.12))
    : 1;
  const revealedWordCount = isDesktop
    ? Math.round(wordRevealFraction * HEADLINE_WORDS.length)
    : mobileWordCount;

  const folderVisualStyle = isDesktop
    ? { transform: `scale(${scale})`, borderRadius: `${radius}px`, opacity: folderOpacity }
    : { opacity: 1, borderRadius: "24px" };

  const activeProcessStep = PROCESS_STEPS[activeStep];
  const videoStackHeight =
    (PROCESS_STEPS.length - 1) * SEGMENT_VH + 100 + TAIL_VH;

  const videoPinStyle = isDesktop ? { top: `${STACK_TOP}px` } : undefined;

  useEffect(() => {
    const video = researchVideoRef.current;
    if (!video) return;

    if (!isDesktop) {
      if (video.paused) {
        video.play().catch(() => {});
      }
      return;
    }

    if (progress > 0.02) {
      if (video.paused) {
        video.play().catch(() => {});
      }
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [progress, isDesktop]);

  useEffect(() => {
    PROCESS_STEPS.forEach((step, i) => {
      const el = processVideoRefs.current[i];
      if (!el || step.type !== "video") return;
      if (i === activeStep) {
        if (el.paused) {
          el.currentTime = 0;
          el.play().catch(() => {});
        }
      } else if (!el.paused) {
        el.pause();
      }
    });
  }, [activeStep]);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  function goToLogin() {
    navigate("/login");
  }

  function goToSignup() {
    navigate("/signup");
  }

  const processTextBlock = (
    <>
      <div className="landing-hero-eyebrow process-eyebrow">
        Our process <span className="process-step-count">{activeStep + 1} / {PROCESS_STEPS.length}</span>
      </div>
      <div key={activeStep} className="process-active-text">
        <h2 className="process-title">{activeProcessStep.title}</h2>
        <p className="process-desc">{activeProcessStep.text}</p>
      </div>
      <div className="process-progress">
        {PROCESS_STEPS.map((s, i) => (
          <span key={s.key} className={`process-progress-dot${i === activeStep ? " is-active" : ""}`} />
        ))}
      </div>
    </>
  );

  const HeadingWrap = isDesktop ? "div" : motion.div;
  const FolderWrap = isDesktop ? "div" : motion.div;
  const TextWrap = isDesktop ? "div" : motion.div;

  const headingMobileProps = !isDesktop
    ? { initial: "hidden", whileInView: "visible", viewport: { once: true, amount: 0.3 }, variants: mobileRevealVariants }
    : {};
  const folderMobileProps = !isDesktop
    ? { initial: "hidden", whileInView: "visible", viewport: { once: true, amount: 0.2 }, variants: mobileRevealVariants }
    : {};
  const textMobileProps = !isDesktop
    ? {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.15 },
        variants: mobileRevealVariants,
        onViewportEnter: () => setMobileStatsInView(true),
      }
    : {};

  const statsShouldStart = isDesktop ? textOpacity > 0.05 : mobileStatsInView;

  return (
    <div className="landing-page">
      <div className="scroll-progress-bar" style={{ transform: `scaleX(${docProgress})` }} />

      {!mobileNavOpen && (
        <div
          className={`scroll-blur-stack${navScrolled ? " is-visible" : ""}`}
          aria-hidden="true"
        >
          <div className="scroll-blur-layer scroll-blur-layer-1" />
          <div className="scroll-blur-layer scroll-blur-layer-2" />
          <div className="scroll-blur-layer scroll-blur-layer-3" />
          <div className="scroll-blur-layer scroll-blur-layer-4" />
          <div className="scroll-blur-layer scroll-blur-layer-5" />
        </div>
      )}

      <header className="landing-nav">
        <div className={navPillClass}>
          <div className="landing-nav-top-row">
            <img src="/Unexa Logo.svg" alt="Unexa" className="landing-logo-img" />

            <nav className="landing-nav-links">
              {NAV_ITEMS.map(function (item) {
                return <NavLink key={item.id} item={item} isActive={activeSection === item.id} />;
              })}
            </nav>

            <div className="landing-nav-auth">
              <button type="button" className="landing-nav-signup" onClick={goToSignup}>
                Create account
              </button>
              <button type="button" className="landing-nav-cta" onClick={goToLogin}>
                Log in <span aria-hidden="true">↗</span>
              </button>
            </div>

            <button
              type="button"
              className={`landing-nav-hamburger${mobileNavOpen ? " is-open" : ""}`}
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileNavOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <div className={`landing-nav-mobile-panel${mobileNavOpen ? " is-open" : ""}`}>
            <nav className="landing-nav-mobile-links">
              {NAV_ITEMS.map(function (item) {
                return (
                  <NavLink
                    key={item.id}
                    item={item}
                    isActive={activeSection === item.id}
                    onClick={closeMobileNav}
                  />
                );
              })}
              <button
                type="button"
                className="landing-nav-mobile-signup"
                onClick={() => { closeMobileNav(); goToSignup(); }}
              >
                Create account
              </button>
              <button
                type="button"
                className="landing-nav-mobile-cta"
                onClick={() => { closeMobileNav(); goToLogin(); }}
              >
                Log in <span aria-hidden="true">↗</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="landing-nav-spacer" aria-hidden="true" />

      <div
        className={`landing-nav-overlay${mobileNavOpen ? " is-open" : ""}`}
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      <section className="landing-hero" id="showcase">
        <h1 className="landing-hero-title">
          Built for students still <span className="landing-hero-accent">✳</span>
          <br />
          figuring out where to study next
        </h1>
        <p className="landing-hero-desc">
          We're building a way to discover design & art programs across the world, compare them
          side by side, and plan every step — application deadlines, portfolio prep, and beyond.
        </p>
      </section>

      <section className="landing-cards-fan">
        {CARDS.map((c, i) => (
          <div key={c.img} className="landing-fan-card" style={{ "--rotate": `${c.rotate}deg`, "--delay": `${i * 0.15}s` }}>
            <img src={c.img} alt="" />
          </div>
        ))}
      </section>

      <section className="research-zoom-section" ref={zoomRef} id="research">
        <div className="research-zoom-sticky">
          <div className="research-zoom-fade">
            <HeadingWrap className="research-zoom-heading" style={{ opacity: headingOpacity }} {...headingMobileProps}>
              <div className="landing-hero-eyebrow research-eyebrow">User research</div>
              <h2 className="research-title">We asked. Students answered.</h2>
              <p className="research-sub">
                Before building further, we ran a short survey with design & art students on LinkedIn
                to understand what they actually struggle with when choosing a university.
              </p>
            </HeadingWrap>

            <FolderWrap className="folder-visual" style={folderVisualStyle} {...folderMobileProps}>
              <div className="folder-back" />
              <div className="folder-video-slot">
                <video
                  className="folder-video"
                  src={RESEARCH_VIDEO_SRC}
                  ref={researchVideoRef}
                  muted
                  loop
                  playsInline
                />
              </div>
            </FolderWrap>
          </div>

          <TextWrap className="research-zoom-text" style={{ opacity: textOpacity }} {...textMobileProps}>
            <div className="research-zoom-main">
              <div className="research-zoom-copy">
                <div className="landing-hero-eyebrow research-zoom-eyebrow">The biggest gap</div>
                <h2 className="research-zoom-title">
                  {HEADLINE_WORDS.map((word, i) => (
                    <span key={i} className={`reveal-word${i < revealedWordCount ? " is-revealed" : ""}`}>
                      {word}{" "}
                    </span>
                  ))}
                </h2>
                <p className="research-zoom-desc">
                  It's the single most-requested thing missing from university research today —
                  and exactly what we're building Unexa to solve.
                </p>
              </div>

              <div className="research-zoom-stats">
                {GAP_STATS.map((s, i) => (
                  <GapStat key={s.label} label={s.label} value={s.value} start={statsShouldStart} delay={i * 220} />
                ))}
              </div>
            </div>

            <a className="linkedin-card" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="View the Unexa survey post on LinkedIn">
              <img src="/unexapost.png" alt="Unexa LinkedIn survey results post" className="linkedin-card-image" />
              <div className="linkedin-card-info">
                <span className="linkedin-card-cta">
                  View post <span className="linkedin-card-arrow" aria-hidden="true">↗</span>
                </span>
              </div>
            </a>
          </TextWrap>
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="process-sticky-col">
          {processTextBlock}
        </div>

        <div
          className="process-video-stack"
          ref={videoStackRef}
          style={{ height: `${videoStackHeight}vh` }}
        >
          <div className="process-pin-mobile-group">
            <div className="process-mobile-text">
              {processTextBlock}
            </div>

            <div className="process-video-pin" style={videoPinStyle}>
              {PROCESS_STEPS.map((step, i) => {
                const p = layerProgress[i] ?? (i === 0 ? 1 : 0);
                const restOffset = i * STACK_GAP;
                const translateY = `calc(${(1 - p) * 100}% + ${restOffset}px)`;
                return (
                  <div
                    key={step.key}
                    className="process-video-frame"
                    style={{ zIndex: i + 1, transform: `translateY(${translateY})` }}
                  >
                    {step.type === "video" ? (
                      <video
                        className={`process-video-el${step.key === "vibecoded" ? " process-video-el--full-frame" : ""}`}
                        src={step.src}
                        ref={(el) => (processVideoRefs.current[i] = el)}
                        preload={i === 0 ? "auto" : "metadata"}
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img className="process-video-el" src={step.src} alt={step.title} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <motion.section
        className="hey-section"
        id="team"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={heySectionVariants}
      >
        <motion.div className="hey-inner" variants={heyInnerVariants}>
          <div className="hey-left">
            <h2 className="hey-title">Hey!</h2>
            <p className="hey-lead">
              We're Kateryna & Anastasiia, the two designers building Unexa.
            </p>
            <div className="hey-body">
              <p>
                Unexa started because we couldn't find a good way to compare design & art university
                programs across Europe. So we set out to build the tool we wished existed.
              </p>
              <p>
                From the first Figma sketch to the working homepage you've been scrolling through,
                this project has been the two of us — designing, researching, and building it together.
              </p>
            </div>
          </div>

          <div className="hey-photos">
            {TEAM.map((member) => (
              <div className="hey-photo-card" key={member.key}>
                <div className="hey-photo">
                  <img src={member.photo} alt={member.name} />
                </div>
                <div className="hey-photo-name">{member.name.split(" ")[0]}</div>
                <a className="hey-photo-link" href={member.linkedin} target="_blank" rel="noopener noreferrer">
                  See on LinkedIn <span aria-hidden="true">↗</span>
                </a>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      <motion.footer
        className="landing-footer"
        id="launch"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={footerVariants}
      >
        <div className="footer-top-row">
          <div className="footer-copyright">
            <span aria-hidden="true">©</span> 2026
          </div>
          <button type="button" className="footer-backtotop" onClick={scrollToTop}>
            BACK TO TOP <span className="footer-backtotop-btn" aria-hidden="true">↑</span>
          </button>
        </div>

        <motion.div className="footer-cta" variants={footerCtaVariants}>
          <div className="footer-cta-eyebrow">Coming soon</div>
          <h2 className="footer-cta-title">Don't miss our launch</h2>
          <p className="footer-cta-desc">
            We're still building — follow along on LinkedIn to see progress and be the first to know when Unexa goes live.
          </p>
        </motion.div>

        <motion.div className="footer-bottom-row" variants={footerBottomRowVariants}>
          <div className="footer-pills">
            <a className="footer-pill" href={LINKEDIN_COMPANY_URL} target="_blank" rel="noopener noreferrer">Unexa</a>
            <a className="footer-pill" href={TEAM[0].linkedin} target="_blank" rel="noopener noreferrer">Kateryna</a>
            <a className="footer-pill" href={TEAM[1].linkedin} target="_blank" rel="noopener noreferrer">Anastasiia</a>
          </div>
          <div className="footer-credit">Built by Kateryna & Anastasiia</div>
        </motion.div>
      </motion.footer>
    </div>
  );
}