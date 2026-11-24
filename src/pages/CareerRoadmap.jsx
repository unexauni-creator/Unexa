import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import UniImage from "../components/UniImage.jsx";
import { STAGES, buildPlan, daysBetween, fmt, fromIso, newId, seedTasks, withProgramTasks } from "../lib/roadmap.js";
import { loadRoadmap, saveProgress, saveStartYear } from "../lib/roadmapStore.js";
import "../styles/roadmap-plan.css";

// Roadmap: a Notion-like page. A few properties on top, then the student's own to-do list
// (seeded from the application plan), shown as a list grouped by stage or as a board by status.
const INTAKES = ["Fall 2027", "Spring 2028", "Fall 2028", "2029 or later", "Not sure yet"];
const STATUSES = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "done", label: "Done" },
];

function dueTone(date, today, done) {
  if (!date || done) return "";
  const d = daysBetween(today, date);
  return d < 0 ? "late" : d <= 14 ? "soon" : "";
}

function Check({ checked, onChange, label }) {
  return (
    <button type="button" className={`rm-check ${checked ? "is-on" : ""}`} onClick={onChange} aria-pressed={checked} aria-label={label}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
    </button>
  );
}

// Text that looks like plain text and turns into an input on click, like a Notion block.
function EditableText({ value, onChange, placeholder, className, autoFocus }) {
  return (
    <input
      className={`rm-edit ${className ?? ""}`}
      value={value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
    />
  );
}

// A small menu instead of the browser's own select: frosted glass, a check next to the chosen option.
// options: strings, or { value, label } when what is shown differs from what is saved
function Dropdown({ value, options, onChange, className = "", label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className={`rm-dd ${className}`} ref={ref}>
      <button type="button" className={`rm-dd-btn ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={label}>
        {opts.find((o) => o.value === value)?.label ?? value}
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5l3.5 3.5 3.5-3.5" /></svg>
      </button>
      {open && (
        <div className="rm-dd-menu" role="listbox">
          {opts.map((o) => (
            <button key={o.value} type="button" role="option" aria-selected={o.value === value} className={`rm-dd-opt ${o.value === value ? "is-on" : ""}`} onClick={() => { onChange(o.value); setOpen(false); }}>
              <span>{o.label}</span>
              {o.value === value && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Circular progress, like a dashboard gauge.
function ProgressRing({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="rm-ring" role="img" aria-label={`${pct}% done`}>
      <svg viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} className="rm-ring-track" />
        <circle cx="42" cy="42" r={r} className="rm-ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <span>{pct}%</span>
    </div>
  );
}

// six stops on a gentle wave (viewBox 1000 × 200), alternating low and high like a path over hills
const PATH_POINTS = [[70, 140], [242, 70], [414, 140], [586, 70], [758, 140], [930, 70]];
const PATH_D = PATH_POINTS.reduce((d, [x, y], i) => {
  if (i === 0) return `M ${x} ${y}`;
  const [px, py] = PATH_POINTS[i - 1];
  const mx = (px + x) / 2;
  return `${d} C ${mx} ${py}, ${mx} ${y}, ${x} ${y}`;
}, "");

const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s.id, label: s.label }));
const STAGE_OPTIONS = STAGES.map((s) => ({ value: s.id, label: s.label }));

// thin line icons, the same weight as the sidebar icons, instead of emoji
const ICON_PATHS = {
  research: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
  portfolio: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.6-.7 1.6-1.5 0-1.2-1-1.4-1-2.5 0-.9.7-1.5 1.6-1.5h2.1a3.2 3.2 0 0 0 3.2-3.2C19.5 7 16.2 3.5 12 3.5z" /><circle cx="7.8" cy="11" r="1" /><circle cx="10.5" cy="7.6" r="1" /><circle cx="14.8" cy="8" r="1" /></>,
  tests: <><path d="M7 3.5h7l4 4v13H7z" /><path d="M14 3.5v4h4" /><path d="M9.8 13.5l1.8 1.8 3.4-3.6" /></>,
  apply: <><path d="M20.5 3.5L3.5 10.6l6.8 2.6 2.6 6.8z" /><path d="M10.3 13.2l4.4-4.4" /></>,
  visa: <><rect x="5.5" y="3.5" width="13" height="17" rx="2" /><circle cx="12" cy="10.5" r="3" /><path d="M9 16.5h6" /></>,
  start: <><path d="M2.5 9.5L12 5l9.5 4.5L12 14z" /><path d="M6.5 11.5v4.2c1.4 1.3 3.4 2 5.5 2s4.1-.7 5.5-2v-4.2" /><path d="M21.5 9.5v5" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  flag: <><path d="M5.5 21V4" /><path d="M5.5 4.5h11l-2 4 2 4h-11" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
};
function Icon({ name, className = "" }) {
  return <svg className={`rm-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">{ICON_PATHS[name]}</svg>;
}

// A small calendar in the app's style instead of the browser's date picker.
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function DateChip({ value, onChange, tone }) {
  const date = fromIso(value);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false); // open above the chip when there is no room below
  const [month, setMonth] = useState(() => { const d = date ?? new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  function toggle() {
    if (!open) {
      const d = date ?? new Date();
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      const r = ref.current?.getBoundingClientRect();
      setUp(Boolean(r && window.innerHeight - r.bottom < 360 && r.top > 360));
    }
    setOpen((o) => !o);
  }
  function pick(d) { onChange(d ? toIso(d) : ""); setOpen(false); }

  // the days of the shown month, starting on Monday, with blanks before the 1st
  const first = month.getDay() === 0 ? 6 : month.getDay() - 1;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const todayIso = toIso(new Date());

  return (
    <div className={`rm-cal ${open ? "open" : ""}`} ref={ref}>
      <button type="button" className={`rm-date ${tone} ${date ? "" : "is-empty"}`} onClick={toggle} aria-haspopup="dialog" aria-expanded={open} aria-label={date ? `Due ${fmt(date)}, change date` : "Add a due date"}>
        {date ? fmt(date, date.getFullYear() !== new Date().getFullYear()) : "Add date"}
      </button>
      {open && (
        <div className={`rm-cal-pop ${up ? "is-up" : ""}`} role="dialog" aria-label="Choose a date">
          <div className="rm-cal-head">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <span>{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="rm-cal-grid">
            {WEEKDAYS.map((w) => <span key={w} className="rm-cal-wd">{w}</span>)}
            {cells.map((d, i) => d ? (
              <button key={i} type="button" onClick={() => pick(d)}
                className={`rm-cal-day ${toIso(d) === value ? "is-on" : ""} ${toIso(d) === todayIso ? "is-today" : ""}`}
                aria-pressed={toIso(d) === value}>
                {d.getDate()}
              </button>
            ) : <span key={i} />)}
          </div>
          <div className="rm-cal-foot">
            <button type="button" onClick={() => pick(new Date())}>Today</button>
            {date && <button type="button" onClick={() => pick(null)}>Remove date</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CareerRoadmap({ savedUniversities = [], currentUser }) {
  const navigate = useNavigate();
  const userId = currentUser?.id;
  const today = useMemo(() => new Date(), []);
  const [startYear, setStartYear] = useState(null);
  const [tasks, setTasks] = useState(null); // null until loaded
  const [inAccount, setInAccount] = useState(true);
  const [view, setView] = useState("list");
  const [folder, setFolder] = useState(null); // the stage folder that is open, or null for all folders
  const [notes, setNotes] = useState({}); // free notes written inside each folder
  const [justAdded, setJustAdded] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [stageFilter, setStageFilter] = useState(null); // board: show only one stage's tasks
  // on phones the steps are a row you swipe: keep the chosen one in view
  const [noteDraft, setNoteDraft] = useState(null); // text being edited, or null when notes are just shown
  const [noteSaved, setNoteSaved] = useState(false);
  const [undo, setUndo] = useState(null); // the task just deleted, so it can come back
  const [confirmReset, setConfirmReset] = useState(false);
  const [tipHidden, setTipHidden] = useState(() => { try { return localStorage.getItem("unexa_rm_tip") === "hidden"; } catch { return false; } });
  useEffect(() => {
    if (!undo) return undefined;
    const t = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(t);
  }, [undo]);
  const saveTimer = useRef(null);

  const plan = useMemo(() => buildPlan({ programs: savedUniversities, startYear, today }), [savedUniversities, startYear, today]);

  useEffect(() => {
    let cancelled = false;
    const done = (r) => {
      if (cancelled) return;
      setStartYear(r.startYear);
      setInAccount(r.inAccount);
      const saved = r.progress?.version === 2 ? r.progress.tasks : null;
      setNotes(r.progress?.notes ?? {});
      latest.current = { ...latest.current, notes: r.progress?.notes ?? {} };
      setTasks(saved ?? "seed");
    };
    if (!userId) done({ startYear: null, progress: {}, inAccount: false });
    else loadRoadmap(userId).then(done).catch((e) => { console.error("Couldn't load the roadmap:", e.message); done({ startYear: null, progress: {}, inAccount: false }); });
    return () => { cancelled = true; };
  }, [userId]);

  // first visit: build the list from the plan; later visits: add "Apply" tasks for newly saved programmes
  useEffect(() => {
    if (tasks === null) return;
    const base = tasks === "seed" ? seedTasks(plan) : tasks;
    const next = withProgramTasks(base, plan, savedUniversities);
    if (next !== tasks) commit(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, plan, savedUniversities]);

  // tasks and notes are saved together, a moment after the last change
  const latest = useRef({ tasks: [], notes: {} });
  function persist() {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (userId) saveProgress(userId, { version: 2, ...latest.current }, inAccount).catch((e) => console.error("Couldn't save the roadmap:", e.message));
    }, 500);
  }
  function commit(next) {
    setTasks(next);
    latest.current = { ...latest.current, tasks: next };
    persist();
  }
  function writeNote(stageId, text) {
    const next = { ...latest.current.notes, [stageId]: text };
    setNotes(next);
    latest.current = { ...latest.current, notes: next };
    persist();
  }

  const list = Array.isArray(tasks) ? tasks : [];
  const update = (id, patch) => commit(list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id) => {
    const index = list.findIndex((t) => t.id === id);
    if (index < 0) return;
    setUndo({ task: list[index], index });
    commit(list.filter((t) => t.id !== id));
  };
  function restore() {
    if (!undo) return;
    const next = [...list];
    next.splice(Math.min(undo.index, next.length), 0, undo.task);
    commit(next);
    setUndo(null);
  }
  function hideTip() {
    setTipHidden(true);
    try { localStorage.setItem("unexa_rm_tip", "hidden"); } catch { /* private mode */ }
  }
  function add(fields) {
    const t = { id: newId(), title: "", note: "", date: "", stage: "research", status: "todo", ...fields };
    setJustAdded(t.id);
    commit([...list, t]);
  }
  function resetPlan() {
    commit(withProgramTasks(seedTasks(plan), plan, savedUniversities));
    setConfirmReset(false);
    setFolder(null);
  }
  async function changeIntake(value) {
    setStartYear(value);
    if (userId) saveStartYear(userId, value).catch((e) => console.error("Couldn't save the intake:", e.message));
  }

  const byDate = (a, b) => (a.date || "9999").localeCompare(b.date || "9999");
  const doneCount = list.filter((t) => t.status === "done").length;
  const nextDeadline = list
    .filter((t) => t.programId && t.status !== "done" && t.date)
    .sort(byDate)[0];
  const program = (t) => savedUniversities.find((p) => String(p.id) === String(t.programId));
  // the one thing to do now: the earliest open task of the earliest stage that still has work
  const stageIndex = (t) => Math.max(0, STAGES.findIndex((st) => st.id === t.stage));
  const nextStep = list.filter((t) => t.status !== "done" && t.title.trim())
    .sort((a, b) => stageIndex(a) - stageIndex(b) || byDate(a, b))[0];
  const currentStage = nextStep ? STAGES[stageIndex(nextStep)] : null;
  const lateCount = list.filter((t) => t.status !== "done" && dueTone(fromIso(t.date), today, false) === "late").length;

  // the step shown in the path and the card below it
  const activeId = folder ?? currentStage?.id ?? STAGES[0].id;
  const st = STAGES.find((x) => x.id === activeId);
  const items = list.filter((t) => t.stage === activeId).sort(byDate);
  const done = items.filter((t) => t.status === "done").length;
  function openStep(id) {
    setFolder(id);
    setView("list");
    setNoteDraft(null);
  }
  function saveNote() {
    writeNote(activeId, noteDraft ?? "");
    setNoteDraft(null);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2200);
  }

  // a plain function, not a component: a component defined here would be re-created on every keystroke and lose focus
  function renderRow(t) {
    const done = t.status === "done";
    const p = t.programId ? program(t) : null;
    return (
      <div key={t.id} className={`rm-row ${done ? "is-done" : ""}`}>
        <Check checked={done} onChange={() => update(t.id, { status: done ? "todo" : "done" })} label={done ? "Mark as not done" : "Mark as done"} />
        <div className="rm-row-main">
          <div className="rm-row-title">
            {p && <UniImage src={p.image} name={p.name} className="rm-row-thumb" />}
            <EditableText value={t.title} onChange={(v) => update(t.id, { title: v })} placeholder="Write a task…" autoFocus={t.id === justAdded} />
          </div>
          <EditableText className="rm-row-note" value={t.note ?? ""} onChange={(v) => update(t.id, { note: v })} placeholder="Add a note" />
        </div>
        <Dropdown className={`rm-dd-status is-${t.status ?? "todo"}`} label="Status" value={t.status ?? "todo"} options={STATUS_OPTIONS} onChange={(v) => update(t.id, { status: v })} />
        <DateChip value={t.date} onChange={(v) => update(t.id, { date: v })} tone={dueTone(fromIso(t.date), today, done)} />
        <button className="rm-row-del" onClick={() => remove(t.id)} aria-label="Delete task" title="Delete">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="rm-page">
      <header className="rm-header">
        <h1 className="rm-title">Roadmap</h1>
        <p className="rm-desc">Everything to do before you start art school, in order.<br />Tick tasks off as you go.</p>
      </header>
      <div className="rm-top">
            {!tipHidden && (
              <div className="rm-callout">
                <Icon name="info" className="rm-callout-icon" />
                <div>Click any task, date or status to change it. Programmes you save on Home appear here with their deadline.</div>
                <button type="button" className="rm-callout-close" onClick={hideTip} aria-label="Hide tip">✕</button>
              </div>
            )}

            {/* the path at the top: six stops on a gentle wave; click one to open that step */}
            <div className="rm-path">
              <div className="rm-path-badge"><span>Step {STAGES.indexOf(st) + 1}{currentStage?.id === activeId ? " · you are here" : ""}</span>{st.label}</div>
              <div className="rm-path-inner">
                <svg className="rm-path-line" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="rm-path-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c9a58f" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#c9a58f" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="rm-path-area" d={`${PATH_D} L${PATH_POINTS[PATH_POINTS.length - 1][0]},200 L${PATH_POINTS[0][0]},200 Z`} fill="url(#rm-path-fill)" />
                  <path d={PATH_D} />
                  <path className="rm-path-progress" d={PATH_D} pathLength="1" strokeDasharray={`${currentStage ? STAGES.indexOf(currentStage) / (STAGES.length - 1) : 1} 1`} />
                </svg>
                {STAGES.map((s2, n) => {
                  const its = list.filter((t) => t.stage === s2.id);
                  const d = its.filter((t) => t.status === "done").length;
                  const complete = its.length > 0 && d === its.length;
                  const [x, y] = PATH_POINTS[n];
                  const active = s2.id === activeId && view === "list";
                  return (
                    <div key={s2.id} className="rm-path-stop" style={{ left: `${x / 10}%`, top: `${y / 2}%` }}>
                      <button type="button" aria-current={active ? "step" : undefined} aria-label={`Step ${n + 1}: ${s2.label}, ${d} of ${its.length} done`} title={`${n + 1}. ${s2.label} · ${d}/${its.length} done`}
                        className={`rm-path-dot ${active ? "is-active" : ""} ${complete ? "is-complete" : ""}`} onClick={() => openStep(s2.id)}>
                        {complete ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.5l2.5 2.5L12 5.5" /></svg> : <span>{n + 1}</span>}
                      </button>
                    </div>
                  );
                })}
                {/* chart axes: numbers on the left, months along the bottom */}
                <div className="rm-path-grid" aria-hidden="true">
                  {[100, 75, 50, 25, 0].map((v, i) => (
                    <div key={v} className="rm-path-gridline" style={{ top: `${i * 25}%` }}><span>{v}</span></div>
                  ))}
                </div>
                <div className="rm-path-axis" aria-hidden="true">
                  {(() => {
                    const dates = list.map((t) => t.date).filter(Boolean).sort();
                    const start = new Date(today.getFullYear(), today.getMonth(), 1);
                    const last = dates.length ? fromIso(dates[dates.length - 1]) : new Date(today.getFullYear() + 1, today.getMonth(), 1);
                    const months = [];
                    for (let d = new Date(start); d <= last && months.length < 36; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(d);
                    if (months.length < 2) months.push(new Date(start.getFullYear(), start.getMonth() + 1, 1));
                    const step = Math.ceil(months.length / 7);
                    const shown = months.filter((_, i) => i % step === 0);
                    return shown.map((d, i) => {
                      const x = 7 + (86 * i) / Math.max(1, shown.length - 1);
                      const newYear = i === 0 || i === shown.length - 1 || d.getMonth() < step;
                      return (
                        <span key={d.toISOString()} className="rm-path-month" style={{ left: `${x}%` }}>
                          {d.toLocaleDateString("en-GB", { month: "short" })}{newYear ? <em>{d.getFullYear()}</em> : null}
                        </span>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* widgets: next step, next deadline, start date */}
            <div className="rm-widgets">
              <div className="rm-widget rm-ring-card">
                <ProgressRing done={doneCount} total={list.length} />
                <div className="rm-next">
                  <div className="rm-widget-label"><Icon name={currentStage?.id ?? "start"} />{nextStep ? "Your next step" : "All done"}</div>
                  {nextStep ? (
                    <>
                      <div className="rm-next-title">{nextStep.title}</div>
                      <div className="rm-faint">
                        Step {stageIndex(nextStep) + 1} of {STAGES.length}: {currentStage.label}
                        {nextStep.date ? ` · by ${fmt(fromIso(nextStep.date), false)}` : ""}
                      </div>
                      <button type="button" className="rm-next-done" onClick={() => update(nextStep.id, { status: "done" })}>✓ Mark as done</button>
                    </>
                  ) : (
                    <div className="rm-faint">You finished every task. Good luck with your studies!</div>
                  )}
                  {lateCount > 0 && <div className="rm-late-note">{lateCount} task{lateCount === 1 ? " is" : "s are"} past its date</div>}
                </div>
              </div>

              <div className={`rm-sticker ${nextDeadline ? dueTone(fromIso(nextDeadline.date), today, false) : "empty"}`}>
                                <div className="rm-sticker-label"><Icon name="flag" />Your next application closes in</div>
                {nextDeadline ? (
                  <>
                    {(() => { const d = Math.max(0, daysBetween(today, fromIso(nextDeadline.date))); return <div className="rm-sticker-days">{d}<span> day{d === 1 ? "" : "s"}</span></div>; })()}
                    <div className="rm-sticker-title">{nextDeadline.title.replace(/^Apply: /, "")}{program(nextDeadline) ? ` · ${program(nextDeadline).name}` : ""}</div>
                    <div className="rm-sticker-date">Apply by {fmt(fromIso(nextDeadline.date))}</div>
                  </>
                ) : (
                  <div className="rm-sticker-title">{savedUniversities.length ? "Your schools haven't published deadlines yet. They'll show up here." : "No deadlines yet. Save a programme on Home and its deadline shows up here."}</div>
                )}
              </div>

              <div className="rm-widget rm-start-card">
                <div className="rm-widget-label"><Icon name="calendar" />I want to start</div>
                <Dropdown value={startYear ?? "Not sure yet"} options={INTAKES} onChange={changeIntake} />
                <div className="rm-faint">{!startYear || startYear === "Not sure yet" ? "Pick a start date and every task gets a due date." : `Task dates are planned for ${startYear}.`}</div>
              </div>
            </div>
      </div>

      <div className="rm-stack">
      {/* views: tabs sit on top of the panel, like Community */}
      <div className="rm-views">
        <div className="community-tabs rm-tabs" role="tablist">
          <button role="tab" aria-selected={view === "list"} className={`community-tab ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>Steps <span className="community-tab-count">{STAGES.length}</span></button>
          <button role="tab" aria-selected={view === "board"} className={`community-tab ${view === "board" ? "active" : ""}`} onClick={() => setView("board")}>By status <span className="community-tab-count">{list.length}</span></button>
        </div>
        <button className="rm-ghost" onClick={() => setConfirmReset(true)}>Start over</button>
      </div>
      <div className="rm-panel">
        <div className="rm-scroll">
          <div className="rm-doc">

            {view === "list" ? (
              /* steps on the left, the chosen step's tasks and notes on the right: no clicking in and out */
              (() => {
                return (
                  <>
                    {/* the chosen step */}
                    <section className="rm-card rm-detail">
                      <div className="rm-detail-head">
                        <div>
                          <div className="rm-detail-kicker">Step {STAGES.indexOf(st) + 1} of {STAGES.length}</div>
                          <h2 className="rm-detail-title">{st.label}</h2>
                          <p className="rm-detail-about">{st.about}</p>
                        </div>
                        <span className="rm-detail-count">{done} of {items.length} done</span>
                      </div>
                      <div className="rm-detail-body">
                      <div className="rm-detail-tasks">
                      <div className="rm-task-list">
                        {items.map((t) => renderRow(t))}
                      </div>
                      <div className="rm-detail-foot">
                        <button className="rm-add" onClick={() => add({ stage: activeId })}>+ Add a task</button>
                        {STAGES.indexOf(st) < STAGES.length - 1 && (
                          <button type="button" className="rm-next-step" onClick={() => openStep(STAGES[STAGES.indexOf(st) + 1].id)}>
                            Next: {STAGES[STAGES.indexOf(st) + 1].label}
                            <svg className="rm-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                          </button>
                        )}
                      </div>
                      </div>
                      {/* notes for this step: shown, edited and saved here, beside the tasks */}
                      <div className="rm-notes-block">
                        <div className="rm-notes-head">
                          <span>Notes</span>
                          {noteSaved && <em className="rm-saved">✓ Saved</em>}
                          {noteDraft === null && notes[activeId]?.trim() && (
                            <button type="button" className="rm-link-btn" onClick={() => setNoteDraft(notes[activeId] ?? "")}>Edit</button>
                          )}
                        </div>
                        {noteDraft !== null ? (
                          <>
                            <textarea
                              className="rm-notes"
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Ideas, links, questions for the school…"
                              rows={Math.max(4, noteDraft.split("\n").length + 1)}
                              autoFocus
                            />
                            <div className="rm-notes-actions">
                              <button type="button" className="rm-modal-keep" onClick={() => setNoteDraft(null)}>Cancel</button>
                              <button type="button" className="rm-save-btn" onClick={saveNote}>Save notes</button>
                            </div>
                          </>
                        ) : notes[activeId]?.trim() ? (
                          <p className="rm-notes-text" onClick={() => setNoteDraft(notes[activeId])}>{notes[activeId]}</p>
                        ) : (
                          <button type="button" className="rm-notes-empty" onClick={() => setNoteDraft("")}>+ Write notes for this step: ideas, links, questions for the school</button>
                        )}
                      </div>
                      </div>
                    </section>
                  </>
                );
              })()
            ) : (
              <>
              <div className="rm-stage-filter" role="group" aria-label="Show tasks of one stage">
                <button type="button" className={!stageFilter ? "is-on" : ""} onClick={() => setStageFilter(null)}>All stages</button>
                {STAGES.map((st) => (
                  <button key={st.id} type="button" className={`${st.color} ${stageFilter === st.id ? "is-on" : ""}`} onClick={() => setStageFilter(stageFilter === st.id ? null : st.id)}>
                    <Icon name={st.id} />{st.label}<span>{list.filter((t) => t.stage === st.id).length}</span>
                  </button>
                ))}
              </div>
              <div className="rm-board">
                {STATUSES.map((s) => {
                  const items = list.filter((t) => (t.status ?? "todo") === s.id && (!stageFilter || t.stage === stageFilter)).sort(byDate);
                  return (
                    <section
                      key={s.id}
                      className={`rm-col ${dragId ? "can-drop" : ""}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { if (dragId) update(dragId, { status: s.id }); setDragId(null); }}
                    >
                      <div className="rm-col-head">
                        <span className={`rm-dot ${s.id}`} />{s.label}<span className="rm-group-count">{items.length}</span>
                      </div>
                      {items.map((t) => {
                        const p = t.programId ? program(t) : null;
                        return (
                          <div key={t.id} className={`rm-card-task ${t.status === "done" ? "is-done" : ""}`} draggable onDragStart={() => setDragId(t.id)} onDragEnd={() => setDragId(null)}>
                            {p && <UniImage src={p.image} name={p.name} className="rm-card-thumb" />}
                            <EditableText value={t.title} onChange={(v) => update(t.id, { title: v })} placeholder="Write a task…" autoFocus={t.id === justAdded} className="rm-card-title" />
                            <div className="rm-card-meta">
                              {(() => { const st = STAGES.find((x) => x.id === t.stage) ?? STAGES[0]; return <Dropdown className="rm-dd-tag" label="Stage" value={st.id} options={STAGE_OPTIONS} onChange={(v) => update(t.id, { stage: v })} />; })()}
                              <Dropdown className={`rm-dd-status is-${t.status ?? "todo"}`} label="Status" value={t.status ?? "todo"} options={STATUS_OPTIONS} onChange={(v) => update(t.id, { status: v })} />
                              <DateChip value={t.date} onChange={(v) => update(t.id, { date: v })} tone={dueTone(fromIso(t.date), today, t.status === "done")} />
                              <button className="rm-row-del" onClick={() => remove(t.id)} aria-label="Delete task" title="Delete">
                                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <button className="rm-add" onClick={() => add({ status: s.id, stage: stageFilter ?? "research" })}>+ Add a task</button>
                    </section>
                  );
                })}
              </div>
              <p className="rm-hint">Drag a card to another column, or change its status on the card.</p>
              </>
            )}

            {savedUniversities.length === 0 && (
              <p className="rm-hint">Save a programme on Home (the bookmark on its card) and an “Apply” task with its deadline appears here. <button className="rm-link-btn" onClick={() => navigate("/app")}>Go to Home →</button></p>
            )}
            <p className="rm-hint">Some deadlines are based on last year until the school publishes new ones. Check the school's page before you apply.</p>
          </div>
        </div>
      </div>
      </div>

      {undo && (
        <div className="rm-toast" role="status">
          Task deleted
          <button type="button" onClick={restore}>Undo</button>
        </div>
      )}

      {confirmReset && (
        <div className="rm-modal-back" onClick={() => setConfirmReset(false)}>
          <div className="rm-modal" role="dialog" aria-modal="true" aria-labelledby="rm-reset-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="rm-reset-title">Start your plan over?</h3>
            <p>Your list goes back to the suggested tasks. Tasks you added, notes and ticked boxes will be lost. This can't be undone.</p>
            <div className="rm-modal-actions">
              <button type="button" className="rm-modal-keep" onClick={() => setConfirmReset(false)} autoFocus>Keep my plan</button>
              <button type="button" className="rm-modal-reset" onClick={resetPlan}>Start over</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
