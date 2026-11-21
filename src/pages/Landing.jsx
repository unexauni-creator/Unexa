import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { Manifesto, PosterStrip } from "../components/landing/Showcase";
import Journey from "../components/landing/Journey";
import Hero from "../components/landing/Hero";
import Screen from "../components/landing/Screen";
import { CountryBars, CountryChips, DegreeSplit, GroupTicker } from "../components/landing/StatCharts";
import Mascot from "../components/Mascot";
import { Globe, PaperPlane } from "../components/landing/Illustrations";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom"; 

// A few of the schools on Unexa, for the running strip (replaced by the live list when the page can reach the database)
const FALLBACK_SCHOOLS = ["Beaux-arts de Paris", "Rhode Island School of Design", "Goldsmiths", "Tokyo University of the Arts", "Academy of Media Arts Cologne", "Accademia di Belle Arti di Venezia", "Berlin University of the Arts", "ArtCenter College of Design", "NABA", "Elisava", "Hongik University", "Seoul National University", "Lviv National Academy of Arts", "Brera Academy of Fine Arts", "School of Visual Arts", "Maryland Institute College of Art", "Academy of Fine Arts in Gdańsk", "Kharkiv State Academy of Design and Arts", "Sheridan College", "Łódź Film School", "Arts University Bournemouth", "University of Art and Design Offenbach"];

const MANIFESTO = "Choosing an art school abroad means forty open tabs, three languages and deadlines nobody warns you about. *Unexa puts every programme, fee and date from the schools' own websites in one calm place, so your energy goes where it matters: *your *portfolio.";

const FAQ = [
  { q: "Is Unexa free?", a: "Yes. Making an account, saving programmes, comparing them, the roadmap and the community are free for students." },
  { q: "Where does the information come from?", a: "From each school's official website. Our agent reads the pages and every detail links back to its source, so you can always check it before you apply." },
  { q: "Which schools are on Unexa?", a: "Art and design schools in Europe, North America and East Asia, from Paris and Berlin to Seoul and Providence. We add more schools every month." },
  { q: "Can I apply to a school through Unexa?", a: "No, you always apply on the school's own website. Unexa helps you choose, compare and keep every deadline and document in one plan." },
  { q: "Who can see my profile and plan?", a: "Only you. Your saved programmes, notes and roadmap live in your account. Posts you write in a community group are visible to other signed-in students." },
];

// What Unexa holds today (refreshed from the database when the page can reach it)
const FALLBACK_STATS = {
  schools: 42, programmes: 262, countries: 12, groups: 20,
  byCountry: { Germany: 6, Spain: 5, "United Kingdom": 5, Ukraine: 5, Italy: 5, Poland: 4, "United States": 4, France: 3, "South Korea": 2, Canada: 1, Japan: 1, China: 1 },
  byDegree: { Bachelor: 114, Master: 111, "Bachelor & Master": 18, "Short & foundation": 8, Other: 11 },
  groupNames: ["Portfolio Reviews", "IELTS & Language Tests", "Scholarships & Funding", "Visa & Moving Abroad", "Housing & Roommates", "Graphic Design", "Fine Arts", "Film & Animation", "Studying in France", "Studying in Italy", "Studying in East Asia"],
};
// programmes' degree text, grouped into the few levels the chart shows
function degreeGroup(d) {
  if (!d) return "Other";
  const b = /bachelor|undergrad/i.test(d), m = /master|postgrad/i.test(d);
  if (b && m) return "Bachelor & Master";
  if (b) return "Bachelor";
  if (m) return "Master";
  if (/short|summer|foundation/i.test(d)) return "Short & foundation";
  return "Other";
}

// Each feature shows the real screen of the app, filled with real programmes from the database
const FEATURES = [
  { key: "discover", eyebrow: "Discover", screen: "/preview/home", label: "unexa.app/home",
    title: "Every creative programme in one search", text: "Painting, design, film, architecture. Filter by country, language and budget, and see what fits you first.",
    facts: ["Official sites only", "“For you” picks", "Updated monthly"] },
  { key: "detail", eyebrow: "Know before you apply", screen: "/preview/detail", label: "unexa.app/programme",
    title: "The facts you actually need", text: "Tuition, deadlines, language level, documents and scholarships, each linked to the school's own page.",
    facts: ["Fees & deadlines", "Documents & visa", "Teachers & housing"] },
  { key: "compare", eyebrow: "Compare", screen: "/preview/dashboard", label: "unexa.app/dashboard",
    title: "See which one fits you best", text: "Put up to four programmes side by side. Tell Unexa what matters to you and it shows your best match.",
    facts: ["Side by side", "Your priorities", "Best for you"] },
  { key: "plan", eyebrow: "Plan", screen: "/preview/roadmap", label: "unexa.app/roadmap",
    title: "Never miss a deadline", text: "Saved programmes turn into a plan: portfolio, tests, application, visa and housing, with the next date always on top.",
    facts: ["Deadline countdown", "Your own tasks", "Notes in folders"] },
];

// shown in the Questions section; until it is set, the section points to LinkedIn
const CONTACT_EMAIL = "";
const LINKEDIN_COMPANY_URL = "https://www.linkedin.com/company/unexauni/?viewAsMember=true";

const TEAM = [
  {
    key: "katia",
    photo: "/katia-640.jpg",
    name: "Kateryna Dmytrenko",
    linkedin: "https://www.linkedin.com/in/kateryna-dmytrenko-059a22266/",
  },
  {
    key: "anastasiia",
    photo: "/nastya-640.jpg",
    name: "Anastasiia Andriievska",
    linkedin: "https://www.linkedin.com/in/anastasiia-andriievska-136244223/",
  },
];

const NAV_ITEMS = [
  { id: "showcase", label: "About" },
  { id: "features", label: "Features" },
  { id: "team", label: "Team" },
];

// Sections the menu follows. "research" belongs to About, so About stays highlighted there.
// (stable array, so the section observer isn't rebuilt every render)
const NAV_IDS = ["showcase", "features", "how", "team"];
const NAV_ALIASES = { how: "features" };

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

const mobileRevealVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

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

const EASE = [0.22, 1, 0.36, 1];



// Real numbers from the database; falls back to the last known ones
function useLiveStats() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, p, g] = await Promise.all([
          supabase.from("universities").select("country, name"),
          supabase.from("specialties").select("degree"),
          supabase.from("community_groups").select("name"),
        ]);
        if (cancelled || u.error || !u.data?.length) return;
        const byCountry = {};
        u.data.forEach((x) => { byCountry[x.country] = (byCountry[x.country] ?? 0) + 1; });
        const byDegree = { Bachelor: 0, Master: 0, "Bachelor & Master": 0, "Short & foundation": 0, Other: 0 };
        (p.data ?? []).forEach((x) => { byDegree[degreeGroup(x.degree)] += 1; });
        setStats({
          schools: u.data.length,
          countries: Object.keys(byCountry).length,
          programmes: p.data?.length || FALLBACK_STATS.programmes,
          groups: g.data?.length || FALLBACK_STATS.groups,
          byCountry,
          byDegree: p.data?.length ? byDegree : FALLBACK_STATS.byDegree,
          groupNames: g.data?.length ? g.data.map((x) => x.name) : FALLBACK_STATS.groupNames,
          names: u.data.map((x) => x.name.replace(/\s*\(.*?\)\s*/g, " ").replace(/,.*$/, "").trim()).filter((n) => n.length <= 40),
        });
      } catch { /* keep the fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return stats;
}

function StatTile({ value, label, note, start, delay, dark, children }) {
  const n = useCountUp(value, start, delay, 1400);
  return (
    <motion.div className={`ux-stat${dark ? " is-dark" : ""}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: EASE, delay: delay / 1000 }}>
      <div className="ux-stat-top">
        <strong>{n}</strong>
        <div><span className="ux-stat-label">{label}</span><span className="ux-stat-note">{note}</span></div>
      </div>
      <div className="ux-stat-chart">{children}</div>
    </motion.div>
  );
}

function StackCard({ f, i, total, progress, onSignup }) {
  // cards underneath shrink a little as the next ones slide over them
  const scale = useTransform(progress, [i / total, 1], [1, 1 - (total - 1 - i) * 0.03]);
  return (
    <li className="ux-stack-item" style={{ top: `calc(var(--stack-top) + ${i} * var(--stack-step))` }}>
      <motion.article className="ux-stack-card" style={{ scale }}>
        <div className="ux-stack-text">
          <span className="ux-stack-n">{String(i + 1).padStart(2, "0")} · {f.eyebrow}</span>
          <h3>{f.title}</h3>
          <p>{f.text}</p>
          <ul className="ux-stack-facts">{f.facts.map((x) => <li key={x}>{x}</li>)}</ul>
          <button type="button" className="ux-stack-cta" onClick={onSignup}>Start for free <span aria-hidden="true">→</span></button>
        </div>
        <div className="ux-stack-media"><Screen src={f.screen} label={f.label} /></div>
      </motion.article>
    </li>
  );
}

function FeatureStack({ onSignup }) {
  const listRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start start", "end end"] });
  return (
    <section className="ux-stack" id="features">
      <motion.div className="landing-section-head" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={mobileRevealVariants}>
        <SectionTag n="02">What's inside</SectionTag>
        <BlurWords lines={["Everything you need,", "from first search to first day"]} />
      </motion.div>
      <ul className="ux-stack-list" ref={listRef}>
        {FEATURES.map((f, i) => <StackCard key={f.key} f={f} i={i} total={FEATURES.length} progress={scrollYProgress} onSignup={onSignup} />)}
      </ul>
    </section>
  );
}

// "How it works": the line between the three steps draws itself as you scroll
function HowItWorks() {
  return (
    <section className="landing-how" id="how">
      <motion.div className="landing-section-head" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={mobileRevealVariants}>
        <SectionTag n="03">How it works</SectionTag>
        <BlurWords lines={["From “where do I even start”", "to a plan, in four steps"]} />
      </motion.div>
      <Journey />
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="landing-faq" id="faq">
      <motion.div className="landing-faq-head" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={mobileRevealVariants}>
        <SectionTag n="05">Questions</SectionTag>
        <BlurWords lines={["Good to know"]} />
        <p className="landing-faq-contact">
          Still have a question? {CONTACT_EMAIL
            ? <>Write to us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, we answer every message.</>
            : <>Message us on <a href={LINKEDIN_COMPANY_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a>, we answer every message.</>}
        </p>
      </motion.div>
      <div className="landing-faq-list">
        {FAQ.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className={`landing-faq-item${isOpen ? " is-open" : ""}`}>
              <button type="button" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                <span>{f.q}</span>
                <motion.span className="landing-faq-plus" animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3, ease: EASE }} aria-hidden="true">+</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} style={{ overflow: "hidden" }}>
                    <p>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Footer like a page lifting off: the light panel with "Find your art school" has rounded bottom
// corners and scrolls away, uncovering a layer in Unexa brown that rises to meet it.
function FooterReveal({ children, onTop }) {
  const underRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: underRef, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-45%", "0%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [0.2, 0.85, 1]);
  const wordScale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const [pulse, setPulse] = useState(0); // the mascot hops when you point at it
  // over the brown footer the light fade under the menu would show as a grey band, so switch it off
  useMotionValueEvent(scrollYProgress, "change", (p) => { document.documentElement.toggleAttribute("data-footer-open", p > 0.35); });
  useEffect(() => () => document.documentElement.removeAttribute("data-footer-open"), []);
  return (
    <footer className="ux-reveal">
      <div className="ux-reveal-panel">{children}</div>
      <div className="ux-reveal-ears" aria-hidden="true" />
      <div className="ux-reveal-under" ref={underRef}>
        <motion.div className="ux-reveal-inner" style={{ y, opacity }}>
          <span className="ux-reveal-tag">Find your art school <i aria-hidden="true">✳</i></span>
          <div className="ux-reveal-head">
            <motion.div className="ux-reveal-word" style={{ scale: wordScale }} aria-hidden="true">Unexa</motion.div>
            <button type="button" className="ux-reveal-totop" onClick={onTop}>Back to top <span aria-hidden="true">↑</span></button>
          </div>
          <div className="ux-reveal-mascot" onMouseEnter={() => setPulse((n) => n + 1)}>
            <Mascot size={340} pulse={pulse} />
          </div>
          <div className="ux-reveal-foot">
            <nav className="ux-reveal-links" aria-label="Footer">
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#team">Team</a>
              <a href="#faq">Questions</a>
              <a href="/login">Log in</a>
              <a href="/signup">Create account</a>
            </nav>
          <div className="ux-reveal-bottom">
            <span>© 2026 Unexa · Built by Kateryna & Anastasiia</span>
            <div className="ux-reveal-pills">
              <a href={LINKEDIN_COMPANY_URL} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              <a href={TEAM[0].linkedin} target="_blank" rel="noopener noreferrer">Kateryna ↗</a>
              <a href={TEAM[1].linkedin} target="_blank" rel="noopener noreferrer">Anastasiia ↗</a>
            </div>
          </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

// ── Intro: "✳ Unexa" appears letter by letter from blur, then the page rises over it like a curtain.
// Shown once per visit (sessionStorage), so going back to the landing doesn't replay it.
const INTRO_KEY = "unexa_intro_seen";
const INTRO_HOLD = 1.5; // seconds the logo stays before the page rises

function Intro() {
  const letters = "Unexa".split("");
  return (
    <motion.div className="landing-intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} aria-hidden="true">
      <div className="landing-intro-logo">
        <motion.span className="landing-intro-star" initial={{ opacity: 0, rotate: -90, scale: 0.6 }} animate={{ opacity: 1, rotate: 90, scale: 1 }} transition={{ duration: 1.4, ease: EASE }}>✳</motion.span>
        <span className="landing-intro-word">
          {letters.map((l, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: 14, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease: EASE, delay: 0.15 + i * 0.07 }}>{l}</motion.span>
          ))}
        </span>
      </div>
    </motion.div>
  );
}

// Headings appear word by word, each sharpening out of a soft blur
function BlurWords({ lines, className, as = "h2" }) {
  const Tag = motion[as];
  let k = 0;
  return (
    <Tag className={className} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.6 }} transition={{ staggerChildren: 0.06 }}>
      {lines.map((line, li) => (
        <span key={li} className="blur-line">
          {line.split(" ").map((w) => (
            <motion.span key={k++} className="blur-word" variants={{ hidden: { opacity: 0, y: 18, filter: "blur(10px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } } }}>
              {w}&nbsp;
            </motion.span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

// Numbered label above each section: "01 — Features"
function SectionTag({ n, children }) {
  return (
    <motion.div className="section-tag" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, ease: EASE }}>
      <span>{n}</span><i aria-hidden="true" />{children}
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const docProgress = useDocScrollProgress();
  const heroRef = useRef(null);
  const liveStats = useLiveStats();
  const [statsInView, setStatsInView] = useState(false);
  const [withIntro] = useState(() => { try { return !sessionStorage.getItem(INTRO_KEY); } catch { return false; } });
  const [introOn, setIntroOn] = useState(withIntro);
  const [curtainDone, setCurtainDone] = useState(!withIntro);
  useEffect(() => {
    if (!withIntro) return;
    try { sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* private mode */ }
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => setIntroOn(false), (INTRO_HOLD + 1.0) * 1000);
    return () => { clearTimeout(t); document.body.style.overflow = ""; };
  }, [withIntro]);

  const observedSection = useActiveSection(NAV_IDS);
  const activeSection = NAV_ALIASES[observedSection] ?? observedSection;
  const navScrolled = useScrolled();
  const navPillClass = `landing-nav-pill${navScrolled ? " is-scrolled" : ""}${mobileNavOpen ? " is-open" : ""}`;

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

  return (
    <>
    <MotionConfig reducedMotion="user">
    <AnimatePresence>{introOn && <Intro key="intro" />}</AnimatePresence>
    <motion.div
      className="landing-curtain"
      initial={withIntro ? { y: "100vh", borderTopLeftRadius: 40, borderTopRightRadius: 40 } : false}
      animate={{ y: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      transition={{ duration: 1.05, ease: [0.76, 0, 0.24, 1], delay: INTRO_HOLD }}
      onAnimationComplete={() => { setCurtainDone(true); document.body.style.overflow = ""; }}
      style={curtainDone ? { transform: "none" } : undefined}
    >
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

      <div ref={heroRef} className="landing-hero-wrap">
        <Hero delay={withIntro ? INTRO_HOLD + 0.4 : 0} onSignup={goToSignup} />
      </div>

      <Manifesto text={MANIFESTO} />

      <PosterStrip />

      {/* live numbers, as illustrated tiles */}
      {/* the count-up starts as soon as any part of the section shows, so a fast scroll never leaves it at 0 */}
      <motion.section className="ux-stats" onViewportEnter={() => setStatsInView(true)} viewport={{ once: true, amount: 0.05 }}>
        <motion.div className="landing-section-head" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={mobileRevealVariants}>
          <SectionTag n="01">Unexa today</SectionTag>
          <BlurWords lines={["Real schools, real data"]} />
          <p className="ux-stats-sub">Every number comes straight from our database and grows as our agent reads more school websites.</p>
        </motion.div>
        <div className="ux-stats-grid">
          <StatTile dark value={liveStats.schools} label="schools" note="data from their official sites" start={statsInView} delay={0}>
            <CountryBars byCountry={liveStats.byCountry ?? FALLBACK_STATS.byCountry} />
          </StatTile>
          <StatTile value={liveStats.programmes} label="programmes" note="with fees, deadlines and requirements" start={statsInView} delay={120}>
            <DegreeSplit byDegree={liveStats.byDegree ?? FALLBACK_STATS.byDegree} />
          </StatTile>
          <StatTile value={liveStats.countries} label="countries" note="across Europe, North America and East Asia" start={statsInView} delay={240}>
            <CountryChips countries={Object.keys(liveStats.byCountry ?? FALLBACK_STATS.byCountry)} />
          </StatTile>
          <StatTile value={liveStats.groups} label="student groups" note="by country, field and topic" start={statsInView} delay={360}>
            <GroupTicker groups={liveStats.groupNames ?? FALLBACK_STATS.groupNames} />
          </StatTile>
        </div>
      </motion.section>

      {/* the schools, running */}
      <section className="landing-marquee" aria-label="Some of the schools on Unexa">
        <div className="landing-marquee-label">Programmes from schools like</div>
        <div className="landing-marquee-track">
          <div className="landing-marquee-row">
            {[...(liveStats.names ?? FALLBACK_SCHOOLS), ...(liveStats.names ?? FALLBACK_SCHOOLS)].map((n, i) => (
              <span key={i}>{n}<i aria-hidden="true">✳</i></span>
            ))}
          </div>
        </div>
      </section>

      {/* what's inside: big cards that stack on top of each other as you scroll */}
      <FeatureStack onSignup={goToSignup} />

      <HowItWorks />

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
            <SectionTag n="04">The team</SectionTag>
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
                  <img src={member.photo} alt={member.name} loading="lazy" decoding="async" />
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

      <Faq />

      <FooterReveal onTop={scrollToTop}>
        <motion.div
          className="landing-footer"
          id="launch"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={footerVariants}
        >
          <motion.div className="footer-cta" variants={footerCtaVariants}>
            <div className="footer-cta-eyebrow">Free for students</div>
            <h2 className="footer-cta-title">
              Find your art school
              {/* beside the title on desktop; on small screens it sits in the space after "school" */}
              <span className="ux-footer-illo" aria-hidden="true">
                <span className="ux-footer-globe"><Globe /></span>
                <span className="ux-footer-plane"><PaperPlane /></span>
              </span>
            </h2>
            <p className="footer-cta-desc">
              Make an account, tell us what you'd love to study, and get programmes picked for you, with every deadline in your plan.
            </p>
            <div className="footer-cta-buttons">
              <button type="button" className="landing-btn landing-btn-primary" onClick={goToSignup}>Create free account <span aria-hidden="true">↗</span></button>
              <button type="button" className="landing-btn landing-btn-outline" onClick={goToLogin}>Log in</button>
            </div>
          </motion.div>
        </motion.div>
      </FooterReveal>
    </div>
    </motion.div>
    </MotionConfig>
    </>
  );
}