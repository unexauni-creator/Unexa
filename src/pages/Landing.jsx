import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { CitySwap, Manifesto, PosterStrip } from "../components/landing/Showcase";
import Journey from "../components/landing/Journey";
import { Deadline, Globe, PaperPlane, School, Palette as PaletteIllo } from "../components/landing/Illustrations";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom"; 

// A few of the schools on Unexa, for the running strip (replaced by the live list when the page can reach the database)
const FALLBACK_SCHOOLS = ["Beaux-arts de Paris", "Rhode Island School of Design", "Goldsmiths", "Tokyo University of the Arts", "Academy of Media Arts Cologne", "Accademia di Belle Arti di Venezia", "Berlin University of the Arts", "ArtCenter College of Design", "NABA", "Elisava", "Hongik University", "Seoul National University", "Lviv National Academy of Arts", "Brera Academy of Fine Arts", "School of Visual Arts", "Maryland Institute College of Art", "Academy of Fine Arts in Gdańsk", "Kharkiv State Academy of Design and Arts", "Sheridan College", "Łódź Film School", "Arts University Bournemouth", "University of Art and Design Offenbach"];

const CITIES = ["Paris", "Seoul", "Berlin", "Tokyo", "Venice", "London", "Kraków", "Providence"];
const MANIFESTO = "Choosing an art school abroad means forty open tabs, three languages and deadlines nobody warns you about. *Unexa puts every programme, fee and date from the schools' own websites in one calm place, so your energy goes where it matters: *your *portfolio.";

const FAQ = [
  { q: "Is Unexa free?", a: "Yes. Making an account, saving programmes, comparing them, the roadmap and the community are free for students." },
  { q: "Where does the information come from?", a: "From each school's official website. Our agent reads the pages and every detail links back to its source, so you can always check it before you apply." },
  { q: "Which schools are on Unexa?", a: "Art and design schools in Europe, North America and East Asia, from Paris and Berlin to Seoul and Providence. We add more schools every month." },
  { q: "Can I apply to a school through Unexa?", a: "No, you always apply on the school's own website. Unexa helps you choose, compare and keep every deadline and document in one plan." },
  { q: "Who can see my profile and plan?", a: "Only you. Your saved programmes, notes and roadmap live in your account. Posts you write in a community group are visible to other signed-in students." },
];

// What Unexa holds today (refreshed from the database when the page can reach it)
const FALLBACK_STATS = { schools: 42, programmes: 262, countries: 12, groups: 20 };

const FEATURES = [
  { key: "discover", eyebrow: "Discover", title: "Every programme, from the school's own website", text: "Our agent reads official sites, so deadlines, fees, languages and teachers come from the source, not from forums." },
  { key: "compare", eyebrow: "Compare", title: "Side by side, without twenty open tabs", text: "Put up to four programmes next to each other: tuition, language level, duration, scholarships." },
  { key: "plan", eyebrow: "Plan", title: "A roadmap that knows your deadlines", text: "Save a programme and its deadline lands in your plan, next to portfolio, tests, visa and housing." },
  { key: "connect", eyebrow: "Connect", title: "Students who are going through it too", text: "Groups by country, field and topic: portfolio reviews, IELTS tips, finding roommates." },
];

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

// Hero: lines rise in one after another
const heroContainer = { hidden: {}, visible: (delay = 0.05) => ({ transition: { staggerChildren: 0.12, delayChildren: delay } }) };
const heroItem = { hidden: { opacity: 0, y: 26, filter: "blur(6px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.85, ease: EASE } } };


// Real numbers from the database; falls back to the last known ones
function useLiveStats() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, p, g] = await Promise.all([
          supabase.from("universities").select("country, name"),
          supabase.from("specialties").select("id", { count: "exact", head: true }),
          supabase.from("community_groups").select("id", { count: "exact", head: true }),
        ]);
        if (cancelled || u.error || !u.data?.length) return;
        setStats({
          schools: u.data.length,
          countries: new Set(u.data.map((x) => x.country)).size,
          programmes: p.count || FALLBACK_STATS.programmes,
          groups: g.count || FALLBACK_STATS.groups,
          names: u.data.map((x) => x.name.replace(/\s*\(.*?\)\s*/g, " ").replace(/,.*$/, "").trim()).filter((n) => n.length <= 40),
        });
      } catch { /* keep the fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return stats;
}

function StatTile({ Illo, tone, value, label, note, start, delay }) {
  const n = useCountUp(value, start, delay, 1400);
  return (
    <motion.div className={`ux-stat ${tone}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE, delay: delay / 1000 }}>
      <div className="ux-stat-illo" aria-hidden="true"><Illo /></div>
      <strong>{n}</strong>
      <span className="ux-stat-label">{label}</span>
      <span className="ux-stat-note">{note}</span>
    </motion.div>
  );
}

// Small live replicas of the app, one per feature; each one moves a little once it is on screen
function MockDiscover() {
  return (
    <div className="fm fm-discover">
      <TypingSearch />
      <div className="fm-discover-illo"><School /></div>
      <motion.span className="fm-float-tag t1" animate={{ y: [0, -10, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>Deadline · 15 Jan</motion.span>
      <motion.span className="fm-float-tag t2" animate={{ y: [0, 10, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}>€2,000 / year</motion.span>
      <motion.span className="fm-float-tag t3" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>IELTS 6.5</motion.span>
    </div>
  );
}

// Types a few real searches one after another, like someone using Unexa
const QUERIES = ["graphic design in Italy", "film school, English-taught", "painting under €2,000 / year", "illustration MA in London"];
function TypingSearch() {
  const [text, setText] = useState("");
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!live) return undefined;
    let q = 0, n = 0, dir = 1, t;
    const tick = () => {
      const full = QUERIES[q];
      n += dir;
      setText(full.slice(0, n));
      let wait = dir > 0 ? 55 + Math.random() * 60 : 22;
      if (dir > 0 && n === full.length) { dir = -1; wait = 1600; }
      else if (dir < 0 && n === 0) { dir = 1; q = (q + 1) % QUERIES.length; wait = 350; }
      t = setTimeout(tick, wait);
    };
    t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, [live]);
  return (
    <motion.div className="fm-search" onViewportEnter={() => setLive(true)} onViewportLeave={() => setLive(false)}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <span>{text}<i className="fm-caret" aria-hidden="true" /></span>
    </motion.div>
  );
}

function MockCompare() {
  const rows = [["Tuition", 0], ["Language", 1], ["Duration", 2]];
  const cells = { Tuition: ["€430", "£9,535", "$62k"], Language: ["French B2", "IELTS 6.5", "TOEFL 93"], Duration: ["5 yrs", "3 yrs", "4 yrs"] };
  const best = { Tuition: 0, Language: 2, Duration: 1 };
  const [lit, setLit] = useState(-1);
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!live) return undefined;
    let i = 0;
    const t = setInterval(() => { setLit(i < rows.length ? i : i < rows.length + 3 ? rows.length - 1 : -1); i = (i + 1) % (rows.length + 4); }, 650);
    return () => clearInterval(t);
  }, [live, rows.length]);
  return (
    <motion.div className="fm fm-compare" onViewportEnter={() => setLive(true)} onViewportLeave={() => setLive(false)} viewport={{ amount: 0.5 }}>
      <span className="fm-example">Example</span>
      <div className="fm-row fm-head"><span /><span>Paris</span><span>London</span><span>Providence</span></div>
      {rows.map(([label], r) => (
        <div key={label} className="fm-row">
          <span>{label}</span>
          {cells[label].map((c, i) => <span key={i} className={r <= lit && best[label] === i ? "is-best" : ""}>{c}</span>)}
        </div>
      ))}
    </motion.div>
  );
}

function MockPlan() {
  const C = 2 * Math.PI * 34;
  return (
    <div className="fm fm-plan">
      <div className="fm-ring">
        <svg viewBox="0 0 84 84">
          <circle cx="42" cy="42" r="34" />
          <motion.circle cx="42" cy="42" r="34" className="fill" strokeDasharray={C}
            initial={{ strokeDashoffset: C }} whileInView={{ strokeDashoffset: C * 0.6 }} viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.2 }} />
        </svg>
        <span>40%</span>
      </div>
      <motion.div className="fm-sticky" initial={{ opacity: 0, y: -30, rotate: 8 }} whileInView={{ opacity: 1, y: 0, rotate: -3 }}
        viewport={{ once: true, amount: 0.6 }} transition={{ type: "spring", stiffness: 140, damping: 12, delay: 0.5 }}>
        <span>📌 Next deadline</span><b>69 <small>days left</small></b><em>MA Art Education</em>
      </motion.div>
    </div>
  );
}

function MockConnect() {
  // a question appears, someone is typing, then their reply replaces the dots
  const [phase, setPhase] = useState(0);
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!live) return undefined;
    const steps = [[1, 300], [2, 1000], [3, 2300], [0, 6200]];
    let timers = [];
    const run = () => { timers = steps.map(([ph, at]) => setTimeout(() => setPhase(ph), at)); timers.push(setTimeout(run, 6600)); };
    run();
    return () => timers.forEach(clearTimeout);
  }, [live]);
  const pop = { initial: { opacity: 0, y: 16, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, transition: { duration: 0.5, ease: EASE } };
  return (
    <motion.div className="fm fm-connect" onViewportEnter={() => setLive(true)} onViewportLeave={() => setLive(false)} viewport={{ amount: 0.5 }}>
      <AnimatePresence>
        {phase >= 1 && <motion.div key="q" className="fm-post" {...pop}><span className="fm-av">LM</span><div><b>Lina · Portfolio Reviews</b><p>How many sketchbook pages did you send?</p></div></motion.div>}
        {phase === 2 && <motion.div key="t" className="fm-typing" {...pop}><span /><span /><span /></motion.div>}
        {phase === 3 && <motion.div key="r" className="fm-post is-reply" {...pop}><span className="fm-av two">KD</span><div><b>Kateryna</b><p>Three, plus 15 finished works 👍</p></div></motion.div>}
      </AnimatePresence>
    </motion.div>
  );
}

const MOCKS = { discover: MockDiscover, compare: MockCompare, plan: MockPlan, connect: MockConnect };

const FEATURE_EXTRA = {
  discover: { facts: ["Fees", "Deadlines", "Language", "Teachers", "Housing"], Illo: null },
  compare: { facts: ["Up to 4 programmes", "Best for you", "Your priorities"], Illo: null },
  plan: { facts: ["Portfolio", "Tests", "Visa", "Housing"], Illo: Deadline },
  connect: { facts: ["Portfolio reviews", "IELTS tips", "Roommates"], Illo: PaperPlane },
};

function StackCard({ f, i, total, progress }) {
  const Mock = MOCKS[f.key];
  const extra = FEATURE_EXTRA[f.key];
  // cards underneath shrink a little as the next ones slide over them
  const scale = useTransform(progress, [i / total, 1], [1, 1 - (total - 1 - i) * 0.035]);
  return (
    <li className="ux-stack-item" style={{ top: `calc(var(--stack-top) + ${i} * var(--stack-step))` }}>
      <motion.article className={`ux-stack-card c-${f.key}`} style={{ scale }}>
        <div className="ux-stack-media">
          {extra.Illo && <div className="ux-stack-illo"><extra.Illo /></div>}
          <Mock />
        </div>
        <div className="ux-stack-text">
          <span className="ux-stack-n">{String(i + 1).padStart(2, "0")} · {f.eyebrow}</span>
          <h3>{f.title}</h3>
          <p>{f.text}</p>
          <ul className="ux-stack-facts">{extra.facts.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </motion.article>
    </li>
  );
}

function FeatureStack() {
  const listRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start start", "end end"] });
  return (
    <section className="ux-stack" id="features">
      <motion.div className="landing-section-head" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={mobileRevealVariants}>
        <SectionTag n="02">What's inside</SectionTag>
        <BlurWords lines={["Everything in one place,", "from first search to first day"]} />
      </motion.div>
      <ul className="ux-stack-list" ref={listRef}>
        {FEATURES.map((f, i) => <StackCard key={f.key} f={f} i={i} total={FEATURES.length} progress={scrollYProgress} />)}
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
  // a colour, not opacity: opacity tied to scroll is handed to the browser, which measured it wrong here
  const shade = useTransform(scrollYProgress, (p) => `rgba(43,31,24,${(Math.min(1, Math.max(0, p)) * 0.72).toFixed(3)})`);
  const sink = useTransform(scrollYProgress, [0, 1], [1, 0.93]);
  // over the brown footer the light fade under the menu would show as a grey band, so switch it off
  useMotionValueEvent(scrollYProgress, "change", (p) => { document.documentElement.toggleAttribute("data-footer-open", p > 0.35); });
  useEffect(() => () => document.documentElement.removeAttribute("data-footer-open"), []);
  return (
    <footer className="ux-reveal">
      <motion.div className="ux-reveal-panel" style={{ scale: sink }}>
        {children}
        <motion.div className="ux-reveal-shade" style={{ backgroundColor: shade }} aria-hidden="true" />
      </motion.div>
      <div className="ux-reveal-ears" aria-hidden="true" />
      <div className="ux-reveal-under" ref={underRef}>
        <motion.div className="ux-reveal-inner" style={{ y, opacity }}>
          <div className="ux-reveal-top">
            <span className="ux-reveal-tag">Find your art school <i aria-hidden="true">✳</i></span>
            <nav className="ux-reveal-links" aria-label="Footer">
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#team">Team</a>
              <a href="#faq">Questions</a>
              <a href="/login">Log in</a>
              <a href="/signup">Create account</a>
            </nav>
            <button type="button" className="ux-reveal-totop" onClick={onTop}>Back to top <span aria-hidden="true">↑</span></button>
          </div>
          <motion.div className="ux-reveal-word" style={{ scale: wordScale }} aria-hidden="true">Unexa</motion.div>
          <div className="ux-reveal-bottom">
            <span>© 2026 Unexa · Built by Kateryna & Anastasiia</span>
            <div className="ux-reveal-pills">
              <a href={LINKEDIN_COMPANY_URL} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              <a href={TEAM[0].linkedin} target="_blank" rel="noopener noreferrer">Kateryna ↗</a>
              <a href={TEAM[1].linkedin} target="_blank" rel="noopener noreferrer">Anastasiia ↗</a>
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
        <motion.section className="landing-hero" id="showcase" variants={heroContainer} initial="hidden" animate="visible" custom={withIntro ? INTRO_HOLD + 0.45 : 0.05}>
          <motion.div className="landing-hero-kicker" variants={heroItem}>
            <span className="landing-live-dot" aria-hidden="true" /> {liveStats.schools} art & design schools · {liveStats.countries} countries
          </motion.div>
          <h1 className="landing-hero-title ux-hero-title">
            <motion.span className="landing-hero-line" variants={heroItem}>
              Study art & design <span className="landing-hero-accent">✳</span>
            </motion.span>
            <motion.span className="landing-hero-line" variants={heroItem}>
              in <CitySwap cities={CITIES} delay={withIntro ? INTRO_HOLD + 1.2 : 1.2} />
            </motion.span>
          </h1>
          <motion.p className="landing-hero-desc" variants={heroItem}>
            Built for students still figuring out where to study next. Discover programmes across the world,
            compare them side by side, and plan every step: deadlines, portfolio, tests and housing.
          </motion.p>
          <motion.div className="landing-hero-ctas" variants={heroItem}>
            <a className="landing-btn landing-btn-primary" href="#features">Learn more <span aria-hidden="true">↓</span></a>
          </motion.div>
          <motion.div className="ux-proof" variants={heroItem}>
            <span>Data from <b>{liveStats.schools} schools'</b> official websites, checked every month</span>
          </motion.div>
        </motion.section>

      </div>

      <PosterStrip />

      <Manifesto text={MANIFESTO} />

      {/* live numbers, as illustrated tiles */}
      <section className="ux-stats">
        <motion.div className="landing-section-head" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={mobileRevealVariants}
          onViewportEnter={() => setStatsInView(true)}>
          <SectionTag n="01">Unexa today</SectionTag>
          <BlurWords lines={["Real schools, real data"]} />
          <p className="ux-stats-sub">Every number comes straight from our database and grows as our agent reads more school websites.</p>
        </motion.div>
        <div className="ux-stats-grid">
          <StatTile Illo={School} tone="t-sand" value={liveStats.schools} label="schools" note="art & design schools, data from their official sites" start={statsInView} delay={0} />
          <StatTile Illo={PaletteIllo} tone="t-rose" value={liveStats.programmes} label="programmes" note="with deadlines, fees, languages and teachers" start={statsInView} delay={120} />
          <StatTile Illo={Globe} tone="t-sky" value={liveStats.countries} label="countries" note="across Europe, North America and East Asia" start={statsInView} delay={240} />
          <StatTile Illo={PaperPlane} tone="t-lav" value={liveStats.groups} label="student groups" note="by country, field and topic" start={statsInView} delay={360} />
        </div>
      </section>

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
      <FeatureStack />

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
            <div className="ux-footer-illo" aria-hidden="true">
              <div className="ux-footer-globe"><Globe /></div>
              <div className="ux-footer-plane"><PaperPlane /></div>
            </div>
            <h2 className="footer-cta-title">Find your art school</h2>
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