// "How it works" as tabs that switch on their own: the steps on the left with a progress bar,
// a live scene on the right that changes with each step. Hover pauses, a click jumps to a step.
import { useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Deadline, OfferLetter, Sketchbook } from "./Illustrations";
import Screen from "./Screen";

const EASE = [0.22, 1, 0.36, 1];
const STEP_MS = 5200;

const pop = (i) => ({ initial: { opacity: 0, y: 14, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.5, ease: EASE, delay: 0.25 + i * 0.18 } });

// the real onboarding of Unexa, picking a few fields by itself
function SceneLove() {
  return (
    <div className="jr-scene jr-onb">
      <Screen src="/preview/onboarding" label="unexa.app/onboarding" w={720} h={620} />
    </div>
  );
}

function SceneMatch() {
  const rows = [["Painting - Visual Arts Design", "Accademia di Belle Arti di Venezia", 94], ["Fine Arts (DNSAP)", "Beaux-arts de Paris", 88], ["Graphic Design Bachelor's Program", "Rhode Island School of Design", 81]];
  return (
    <div className="jr-scene jr-match">
      <div className="jr-illo"><Sketchbook /></div>
      <div className="jr-card">
        <b>For you <small>picked from your answers</small></b>
        {rows.map(([p, s, m], i) => (
          <motion.div key={p} className="jr-row" {...pop(i)}>
            <div><strong>{p}</strong><span>{s}</span></div>
            <div className="jr-meter"><motion.i initial={{ width: 0 }} animate={{ width: `${m}%` }} transition={{ duration: 1.1, ease: EASE, delay: 0.45 + i * 0.18 }} /><em>{m}%</em></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SceneCompare() {
  const prefs = [["Low tuition", 3], ["Easy language entry", 2], ["Scholarships", 2], ["Time to apply", 1]];
  return (
    <div className="jr-scene jr-compare">
      <div className="jr-card">
        <b>What matters to you</b>
        {prefs.map(([label, n], i) => (
          <motion.div key={label} className="jr-pref" {...pop(i)}>
            <span>{label}</span>
            <span className="jr-dots">{[0, 1, 2].map((d) => <motion.i key={d} className={d < n ? "on" : ""} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.15 + d * 0.06 }} />)}</span>
          </motion.div>
        ))}
      </div>
      <motion.div className="jr-best" initial={{ opacity: 0, y: 24, rotate: 4 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ type: "spring", stiffness: 160, damping: 14, delay: 1.2 }}>
        <span>✳ Best for you</span>
        <strong>Beaux-arts de Paris</strong>
        <em>Fine Arts · lowest tuition</em>
      </motion.div>
    </div>
  );
}

function ScenePlan() {
  const tasks = [["Portfolio · 15 works", true], ["IELTS 6.5", true], ["Application · 15 Jan", false], ["Visa & housing", false]];
  return (
    <div className="jr-scene jr-plan">
      <div className="jr-illo"><Deadline /></div>
      <div className="jr-card">
        <b>Your plan <small>2 of 4 done</small></b>
        {tasks.map(([t, done], i) => (
          <motion.div key={t} className={`jr-task${done ? " done" : ""}`} {...pop(i)}>
            <motion.i initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.55 + i * 0.18, type: "spring", stiffness: 300, damping: 15 }}>{done ? "✓" : ""}</motion.i>{t}
          </motion.div>
        ))}
      </div>
      <div className="jr-illo jr-illo-2"><OfferLetter /></div>
    </div>
  );
}

const STEPS = [
  { title: "Tell us what you love", text: "Eight quick questions: fields, countries, language, budget and when you want to start.", Scene: SceneLove, bg: "#F3DCD2" },
  { title: "Get programmes picked for you", text: "“For you” ranks every programme by how well it fits you, and tells you why.", Scene: SceneMatch, bg: "#EFE3D3" },
  { title: "Compare what matters to you", text: "Put favourites side by side and choose your priorities: Unexa shows which programme is best for you.", Scene: SceneCompare, bg: "#DCE6EC" },
  { title: "Plan it and apply", text: "Every deadline, test and document in one plan, from portfolio to visa. You apply on the school's own site.", Scene: ScenePlan, bg: "#E2DEEA" },
];

export default function Journey() {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35 });
  const running = inView && !hover;
  const { Scene, bg } = STEPS[active];
  return (
    <div className="jr" ref={ref} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <ol className="jr-steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className={i === active ? "is-active" : ""}>
            <button type="button" onClick={() => setActive(i)} aria-current={i === active ? "step" : undefined}>
              <span className="jr-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="jr-t">{s.title}</span>
            </button>
            <AnimatePresence initial={false}>
              {i === active && (
                <motion.div key="body" className="jr-body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
                  <p>{s.text}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {/* the bar fills while this step is shown; when it is full, the next step starts */}
            <span className="jr-bar">
              {i === active && (
                <i key={active} style={{ animationDuration: `${STEP_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                  onAnimationEnd={() => setActive((a) => (a + 1) % STEPS.length)} />
              )}
            </span>
          </li>
        ))}
      </ol>
      <motion.div className="jr-stage" animate={{ backgroundColor: bg }} transition={{ duration: 0.6, ease: EASE }}>
        <AnimatePresence mode="wait">
          <motion.div key={active} className="jr-stage-in" initial={{ opacity: 0, y: 24, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -18, filter: "blur(6px)" }} transition={{ duration: 0.45, ease: EASE }}>
            <span className="jr-example">Example</span>
            <Scene />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
