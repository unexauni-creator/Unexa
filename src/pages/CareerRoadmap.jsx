import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import UniImage from "../components/UniImage.jsx";
import { STAGES, buildPlan, daysBetween, fmt, programChecklist } from "../lib/roadmap.js";
import { loadRoadmap, saveProgress, saveStartYear } from "../lib/roadmapStore.js";
import "../styles/roadmap-plan.css";

// Personal application plan: what to do and by when, from the saved programmes and the chosen intake.
const INTAKES = ["Fall 2027", "Spring 2028", "Fall 2028", "2029 or later", "Not sure yet"];

function Check({ checked, onChange, label }) {
  return (
    <button type="button" className={`rm-check ${checked ? "is-on" : ""}`} onClick={onChange} aria-pressed={checked} aria-label={label}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
    </button>
  );
}

function dueLabel(date, today) {
  const d = daysBetween(today, date);
  if (d < 0) return { text: `${-d} days late`, tone: "late" };
  if (d === 0) return { text: "Today", tone: "soon" };
  if (d <= 14) return { text: `In ${d} days`, tone: "soon" };
  return { text: fmt(date), tone: "" };
}

export default function CareerRoadmap({ savedUniversities = [], currentUser }) {
  const navigate = useNavigate();
  const userId = currentUser?.id;
  const today = useMemo(() => new Date(), []);
  const [startYear, setStartYear] = useState(null);
  const [progress, setProgress] = useState({});
  const [inAccount, setInAccount] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!userId) { setLoaded(true); return; }
    let cancelled = false;
    loadRoadmap(userId)
      .then((r) => { if (!cancelled) { setStartYear(r.startYear); setProgress(r.progress || {}); setInAccount(r.inAccount); } })
      .catch((e) => console.error("Couldn't load the roadmap:", e.message))
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, [userId]);

  const plan = useMemo(() => buildPlan({ programs: savedUniversities, startYear, today }), [savedUniversities, startYear, today]);

  function toggle(key) {
    setProgress((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next[key]) delete next[key];
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (userId) saveProgress(userId, next, inAccount).catch((e) => console.error("Couldn't save the roadmap:", e.message));
      }, 400);
      return next;
    });
  }

  async function changeIntake(value) {
    setStartYear(value);
    if (userId) saveStartYear(userId, value).catch((e) => console.error("Couldn't save the intake:", e.message));
  }

  const stepKey = (s) => `step:${s.id}`;
  const itemKey = (p, i) => `p:${p.id}:${i.id}`;
  const stepsDone = plan.steps.filter((s) => progress[stepKey(s)]).length;
  const upNext = plan.steps.filter((s) => !progress[stepKey(s)]).slice(0, 3);
  const nextDeadline = plan.deadlines.find((d) => !progress[`p:${d.program.id}:submitted`]) ?? null;

  // timeline from this month to the start month
  const months = [];
  for (let d = new Date(today.getFullYear(), today.getMonth(), 1); d <= plan.start && months.length < 36; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(d);
  const span = Math.max(1, daysBetween(months[0] ?? today, plan.start));
  const pos = (date) => `${Math.min(100, Math.max(0, (daysBetween(months[0] ?? today, date) / span) * 100))}%`;

  return (
    <div className="rm-page">
      <header className="rm-header">
        <div>
          <h1 className="rm-title">Roadmap</h1>
          <p className="rm-desc">Your plan from today to your first day at school: what to do, and by when.</p>
        </div>
        <label className="rm-intake">
          <span>I want to start</span>
          <select value={startYear ?? "Not sure yet"} onChange={(e) => changeIntake(e.target.value)}>
            {INTAKES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      </header>

      <div className="rm-panel">
        <div className="rm-scroll">
          {!plan.startKnown && loaded && (
            <div className="rm-note">Pick when you want to start (top right), and the dates below will fit your intake. For now they assume about 8 months after the first deadline.</div>
          )}

          {/* summary */}
          <section className="rm-summary">
            <div className="rm-card rm-countdown">
              <div className="rm-card-label">Next deadline</div>
              {nextDeadline ? (
                <>
                  <div className="rm-big">{Math.max(0, daysBetween(today, nextDeadline.deadline.date))}<span> days</span></div>
                  <div className="rm-countdown-prog">{nextDeadline.program.program}</div>
                  <div className="rm-muted">{nextDeadline.program.name} · {fmt(nextDeadline.deadline.date)}{nextDeadline.deadline.expected ? " (expected)" : ""}</div>
                </>
              ) : (
                <div className="rm-muted">{savedUniversities.length ? "Your saved programmes don't list a deadline yet. Check their official pages." : "Save programmes on Home to see their deadlines here."}</div>
              )}
            </div>

            <div className="rm-card rm-next">
              <div className="rm-card-label">Up next</div>
              {upNext.length ? upNext.map((s) => {
                const due = dueLabel(s.date, today);
                return (
                  <div key={s.id} className="rm-next-row">
                    <Check checked={false} onChange={() => toggle(stepKey(s))} label={`Mark "${s.title}" done`} />
                    <span className="rm-next-title">{s.title}</span>
                    <span className={`rm-due ${due.tone}`}>{due.text}</span>
                  </div>
                );
              }) : <div className="rm-muted">Everything is done. Good luck!</div>}
            </div>

            <div className="rm-card rm-progress">
              <div className="rm-card-label">Your progress</div>
              <div className="rm-big">{stepsDone}<span> of {plan.steps.length} steps</span></div>
              <div className="rm-stages">
                {STAGES.map((st) => {
                  const all = plan.steps.filter((s) => s.stage === st.id);
                  const done = all.filter((s) => progress[stepKey(s)]).length;
                  return (
                    <div key={st.id} className={`rm-stage ${all.length && done === all.length ? "is-done" : done ? "is-part" : ""}`} title={`${st.label}: ${done} of ${all.length}`}>
                      <span className="rm-stage-bar" />
                      <span className="rm-stage-label">{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* timeline */}
          <section className="rm-card rm-timeline-card">
            <div className="rm-section-head">
              <h2>Timeline</h2>
              <span className="rm-muted">Today → {fmt(plan.start)}</span>
            </div>
            <div className="rm-timeline-scroll">
              <div className="rm-timeline" style={{ "--months": months.length }}>
                <div className="rm-axis" />
                <div className="rm-today" style={{ left: pos(today) }}><span>Today</span></div>
                {plan.steps.map((s) => (
                  <div key={s.id} className={`rm-tick ${progress[stepKey(s)] ? "is-done" : ""} ${s.id === "start" ? "is-start" : ""}`} style={{ left: pos(s.date) }} title={`${s.title} · ${fmt(s.date)}`} />
                ))}
                {plan.deadlines.map(({ program, deadline }) => (
                  <div key={program.id} className="rm-deadline" style={{ left: pos(deadline.date) }} title={`${program.program} · ${fmt(deadline.date)}`}>
                    <UniImage src={program.image} name={program.name} className="rm-deadline-img" />
                    <span>{fmt(deadline.date, false)}</span>
                  </div>
                ))}
                <div className="rm-months">
                  {months.map((m) => (
                    <span key={m.toISOString()} style={{ left: pos(m) }}>{m.toLocaleDateString("en-GB", { month: "short" })}{m.getMonth() === 0 ? ` ${m.getFullYear()}` : ""}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="rm-columns">
            {/* all steps */}
            <section className="rm-card rm-steps">
              <div className="rm-section-head"><h2>Your steps</h2><span className="rm-muted">{stepsDone} done</span></div>
              {plan.steps.map((s) => {
                const done = !!progress[stepKey(s)];
                const due = dueLabel(s.date, today);
                return (
                  <div key={s.id} className={`rm-step ${done ? "is-done" : ""}`}>
                    <Check checked={done} onChange={() => toggle(stepKey(s))} label={`${done ? "Unmark" : "Mark"} "${s.title}"`} />
                    <div className="rm-step-text">
                      <div className="rm-step-title">{s.title}</div>
                      <div className="rm-step-hint">{s.hint}</div>
                    </div>
                    <span className={`rm-due ${done ? "" : due.tone}`}>{done ? "Done" : due.text}</span>
                  </div>
                );
              })}
            </section>

            {/* per programme */}
            <section className="rm-programs">
              {savedUniversities.length === 0 ? (
                <div className="rm-card rm-empty">
                  <div className="rm-empty-title">No saved programmes yet</div>
                  <p className="rm-muted">Tap the bookmark on any programme on Home. Its deadline and what it asks for will appear here.</p>
                  <button className="rm-btn" onClick={() => navigate("/app")}>Browse programmes →</button>
                </div>
              ) : savedUniversities.map((p) => {
                const d = plan.deadlines.find((x) => x.program.id === p.id)?.deadline;
                const items = programChecklist(p);
                const done = items.filter((i) => progress[itemKey(p, i)]).length;
                return (
                  <article key={p.id} className="rm-card rm-program">
                    <div className="rm-program-photo">
                      <UniImage src={p.image} name={p.name} className="rm-program-img" />
                      <div className="rm-program-glass">
                        {p.image && <img src={p.image} alt="" aria-hidden="true" className="card-glass-photo" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                        <div className="rm-program-name">{p.program}</div>
                        <div className="rm-program-school">{p.name}</div>
                      </div>
                    </div>
                    <div className="rm-program-meta">
                      <div><span className="rm-muted">Deadline</span><strong>{d ? `${fmt(d.date)}${d.expected ? " (expected)" : ""}` : "Not listed"}</strong></div>
                      <div><span className="rm-muted">Ready</span><strong>{done} of {items.length}</strong></div>
                    </div>
                    {p.applicationDeadline && d?.expected && <div className="rm-source">School says: “{p.applicationDeadline}”</div>}
                    <div className="rm-items">
                      {items.map((i) => {
                        const on = !!progress[itemKey(p, i)];
                        return (
                          <div key={i.id} className={`rm-item ${on ? "is-done" : ""}`}>
                            <Check checked={on} onChange={() => toggle(itemKey(p, i))} label={`${on ? "Unmark" : "Mark"} "${i.label}"`} />
                            <span>{i.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    {p.website && <a className="rm-link" href={p.website} target="_blank" rel="noopener noreferrer">Official page ↗</a>}
                  </article>
                );
              })}
            </section>
          </div>
          <p className="rm-foot">Dates marked “expected” are based on last year's deadlines. Always check the school's official page.</p>
        </div>
      </div>
    </div>
  );
}
