import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom"; 

// Photos of schools that are on Unexa (from their official sites / Wikimedia Commons)
const CARDS = [
  { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Paris_6_-_ENSBA_01.jpg/1280px-Paris_6_-_ENSBA_01.jpg", rotate: -11, label: "Paris" },
  { img: "https://www.manchester.ac.uk/study/international/oxford-road-campus-shot-v2.webp", rotate: -5, label: "Manchester" },
  { img: "https://www.geidai.ac.jp/english/wp-content/uploads/2024/10/H8A2884-Pano-scaled.jpg", rotate: 0, label: "Tokyo" },
  { img: "https://www.khm.de/0305947792a0a44929398403f2461c9e.slideshow/AC26_Kamoona_slideshow.jpeg?v=2", rotate: 5, label: "Cologne" },
  { img: "https://www.accademiavenezia.it/upload/eventi/crop/Mostra_Extra_Ordinario_Workshop_VII_Edizione.jpg", rotate: 11, label: "Venice" },
];

// A few of the schools on Unexa, for the running strip (replaced by the live list when the page can reach the database)
const FALLBACK_SCHOOLS = ["Beaux-arts de Paris", "Rhode Island School of Design", "Goldsmiths", "Tokyo University of the Arts", "Academy of Media Arts Cologne", "Accademia di Belle Arti di Venezia", "Berlin University of the Arts", "ArtCenter College of Design", "NABA", "Elisava", "Hongik University", "Seoul National University", "Lviv National Academy of Arts", "Brera Academy of Fine Arts", "School of Visual Arts", "Maryland Institute College of Art", "Academy of Fine Arts in Gdańsk", "Kharkiv State Academy of Design and Arts", "Sheridan College", "Łódź Film School", "Arts University Bournemouth", "University of Art and Design Offenbach"];

const STEPS = [
  { n: "01", title: "Tell us what you love", text: "Eight quick questions: fields, countries, language, budget and when you want to start." },
  { n: "02", title: "Get programmes picked for you", text: "“For you” ranks every programme by how well it fits, and tells you why." },
  { n: "03", title: "Compare, plan, apply", text: "Put favourites side by side, then follow a plan with every deadline, from portfolio to visa." },
];

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

function StatTile({ value, label, note, start, delay }) {
  const n = useCountUp(value, start, delay, 1400);
  return (
    <div className="landing-number">
      <strong>{n}</strong>
      <span className="landing-number-label">{label}</span>
      {note && <span className="landing-number-note">{note}</span>}
    </div>
  );
}

// Small live replicas of the app, one per feature; each one moves a little once it is on screen
function MockDiscover() {
  const cards = [
    { img: CARDS[2].img, title: "Global Arts", school: "Tokyo University of the Arts" },
    { img: CARDS[4].img, title: "Painting - Visual Arts Design", school: "Accademia di Belle Arti di Venezia" },
    { img: CARDS[0].img, title: "Fine Arts (DNSAP)", school: "Beaux-arts de Paris" },
  ];
  return (
    <div className="fm fm-discover">
      {cards.map((c, i) => (
        <motion.div
          key={c.title}
          className="fm-uni"
          style={{ zIndex: i }}
          initial={{ opacity: 0, y: 50, rotate: 0, x: 0 }}
          whileInView={{ opacity: 1, y: [-12, -12, 6][i], rotate: [-7, 7, 0][i], x: [-90, 90, 0][i], scale: [0.88, 0.88, 1][i] }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.12 }}
        >
          {/* the same card as on Home */}
          <div className="uni-card-new">
            <img src={c.img} alt="" className="uni-card-img" />
            <div className="uni-card-glass">
              <img src={c.img} alt="" aria-hidden="true" className="card-glass-photo" />
              <div className="uni-card-glass-blur" />
              <div className="uni-card-text">
                <div className="uni-card-title">{c.title}</div>
                <div className="uni-card-subtitle">{c.school}</div>
              </div>
              <span className="uni-card-save"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg></span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MockCompare() {
  const rows = [["Tuition", 0], ["Language", 1], ["Duration", 2]];
  const cells = { Tuition: ["€430", "£9,535", "$62k"], Language: ["French B2", "IELTS 6.5", "TOEFL 93"], Duration: ["5 yrs", "3 yrs", "4 yrs"] };
  const best = { Tuition: 0, Language: 2, Duration: 1 };
  const [lit, setLit] = useState(-1);
  return (
    <motion.div className="fm fm-compare" onViewportEnter={() => {
      let i = 0;
      const t = setInterval(() => { setLit(i); i += 1; if (i > rows.length) clearInterval(t); }, 550);
    }} viewport={{ once: true, amount: 0.6 }}>
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
  function play() {
    setPhase(1);
    setTimeout(() => setPhase(2), 700);
    setTimeout(() => setPhase(3), 2000);
  }
  const pop = { initial: { opacity: 0, y: 16, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, transition: { duration: 0.5, ease: EASE } };
  return (
    <motion.div className="fm fm-connect" onViewportEnter={() => phase === 0 && play()} viewport={{ once: true, amount: 0.6 }}>
      <AnimatePresence>
        {phase >= 1 && <motion.div key="q" className="fm-post" {...pop}><span className="fm-av">LM</span><div><b>Lina · Portfolio Reviews</b><p>How many sketchbook pages did you send?</p></div></motion.div>}
        {phase === 2 && <motion.div key="t" className="fm-typing" {...pop}><span /><span /><span /></motion.div>}
        {phase === 3 && <motion.div key="r" className="fm-post is-reply" {...pop}><span className="fm-av two">KD</span><div><b>Kateryna</b><p>Three, plus 15 finished works 👍</p></div></motion.div>}
      </AnimatePresence>
    </motion.div>
  );
}

const MOCKS = { discover: MockDiscover, compare: MockCompare, plan: MockPlan, connect: MockConnect };

// "How it works": the line between the three steps draws itself as you scroll
function HowItWorks() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const draw = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  return (
    <section className="landing-how" ref={ref} id="how">
      <motion.div className="landing-section-head" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={mobileRevealVariants}>
        <SectionTag n="03">How it works</SectionTag>
        <BlurWords lines={["From “where do I even start”", "to a plan, in three steps"]} />
      </motion.div>
      <div className="landing-how-steps">
        <svg className="landing-how-line" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
          <path d="M20 20 C 250 -10, 400 50, 500 20 S 760 -10, 980 20" className="track" />
          <motion.path d="M20 20 C 250 -10, 400 50, 500 20 S 760 -10, 980 20" className="ink" style={{ pathLength: draw }} />
        </svg>
        {STEPS.map((st, i) => (
          <motion.div key={st.n} className="landing-how-step"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: EASE, delay: i * 0.15 }}>
            <span className="landing-how-n">{st.n}</span>
            <h3>{st.title}</h3>
            <p>{st.text}</p>
          </motion.div>
        ))}
      </div>
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

// The hero shows the real Unexa home in a browser window; it tilts back into place as you scroll,
// and three pieces of the app float around it at different speeds.

// Shows a page of the app at its real size (1440×900) and scales it down to the box,
// so the preview looks exactly like Unexa on every screen.
function ScaledScreen({ src }) {
  const box = useRef(null);
  const [scale, setScale] = useState(0.7);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1440));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="hero-screen" ref={box}>
      <iframe src={src} title="Unexa home" tabIndex={-1} aria-hidden="true" style={{ transform: `scale(${scale})` }} />
    </div>
  );
}

function HeroApp({ progress, delay = 0 }) {
  const rotateX = useTransform(progress, [0, 1], [14, 0]);
  const scale = useTransform(progress, [0, 1], [0.92, 1]);
  const y = useTransform(progress, [0, 1], [0, -30]);
  const floatA = useTransform(progress, [0, 1], [0, -90]);
  const floatB = useTransform(progress, [0, 1], [0, -40]);
  const floatC = useTransform(progress, [0, 1], [0, -130]);
  return (
    <div className="hero-stage">
      <motion.div className="hero-window" style={{ rotateX, scale, y }}
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE, delay: delay + 0.35 }}>
        <div className="hero-chrome"><i /><i /><i /><span>unexa.app</span></div>
        <ScaledScreen src="/preview/home" />
      </motion.div>

      <motion.div className="hero-float hero-float-sticky" style={{ y: floatA }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: EASE, delay: delay + 0.9 }}>
        <span>📌 Next deadline</span><b>69 <small>days left</small></b><em>MA Art Education</em>
      </motion.div>
      <motion.div className="hero-float hero-float-ring" style={{ y: floatB }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: EASE, delay: delay + 1.05 }}>
        <svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" /><circle cx="42" cy="42" r="34" className="fill" /></svg>
        <div><b>40%</b><span>of your plan done</span></div>
      </motion.div>
      <motion.div className="hero-float hero-float-compare" style={{ y: floatC }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: EASE, delay: delay + 1.2 }}>
        <span className="dot" /> Comparing <b>3 programmes</b>
      </motion.div>
    </div>
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
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const fanSpread = useSpring(useTransform(heroScroll, [0, 0.45], [0, 1]), { stiffness: 90, damping: 22, mass: 0.4 });
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
          <h1 className="landing-hero-title">
            <motion.span className="landing-hero-line" variants={heroItem}>
              Built for students still <span className="landing-hero-accent">✳</span>
            </motion.span>
            <motion.span className="landing-hero-line" variants={heroItem}>figuring out where to study next</motion.span>
          </h1>
          <motion.p className="landing-hero-desc" variants={heroItem}>
            Discover design & art programmes across the world, compare them side by side,
            and plan every step: deadlines, portfolio, tests and housing.
          </motion.p>
          <motion.div className="landing-hero-ctas" variants={heroItem}>
            <a className="landing-btn landing-btn-primary" href="#features">Learn more <span aria-hidden="true">↓</span></a>
          </motion.div>
        </motion.section>

        <HeroApp progress={fanSpread} delay={withIntro ? INTRO_HOLD + 0.5 : 0} />
      </div>

      {/* live numbers */}
      <motion.section
        className="landing-numbers"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={mobileRevealVariants}
        onViewportEnter={() => setStatsInView(true)}
      >
        <div className="landing-numbers-head">
          <SectionTag n="01">Unexa today</SectionTag>
          <p>Every number below comes straight from our database, updated as our agent reads more school websites.</p>
        </div>
        <div className="landing-numbers-grid">
          <StatTile value={liveStats.schools} label="schools" note="art & design schools with data from their official sites" start={statsInView} delay={0} />
          <StatTile value={liveStats.programmes} label="programmes" note="with deadlines, fees, languages and teachers" start={statsInView} delay={120} />
          <StatTile value={liveStats.countries} label="countries" note="across Europe, North America and East Asia" start={statsInView} delay={240} />
          <StatTile value={liveStats.groups} label="student groups" note="by country, field and topic" start={statsInView} delay={360} />
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

      {/* what's inside: a bento of the four things you can do */}
      <section className="landing-features" id="features">
        <motion.div className="landing-section-head" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={mobileRevealVariants}>
          <SectionTag n="02">What's inside</SectionTag>
          <BlurWords lines={["Everything in one place,", "from first search to first day"]} />
        </motion.div>
        <div className="landing-bento">
          {FEATURES.map((f, i) => {
            const Mock = MOCKS[f.key];
            return (
              <motion.article
                key={f.key}
                className={`landing-feature f-${f.key}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, ease: EASE, delay: (i % 2) * 0.1 }}
              >
                <div className="landing-feature-mock"><Mock /></div>
                <div className="landing-feature-text">
                  <div className="landing-feature-eyebrow">{String(i + 1).padStart(2, "0")} · {f.eyebrow}</div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

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

      <Faq />

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
          <div className="footer-cta-eyebrow">Free for students</div>
          <h2 className="footer-cta-title">Find your art school</h2>
          <p className="footer-cta-desc">
            Make an account, tell us what you'd love to study, and get programmes picked for you, with every deadline in your plan.
          </p>
          <div className="footer-cta-buttons">
            <button type="button" className="landing-btn landing-btn-primary" onClick={goToSignup}>Create free account <span aria-hidden="true">↗</span></button>
            <button type="button" className="landing-btn landing-btn-outline" onClick={goToLogin}>Log in</button>
          </div>
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
    </motion.div>
    </>
  );
}