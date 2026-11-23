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

function DateChip({ value, onChange, tone }) {
  const date = fromIso(value);
  return (
    <label className={`rm-date ${tone} ${date ? "" : "is-empty"}`}>
      <span>{date ? fmt(date, date.getFullYear() !== new Date().getFullYear()) : "Add date"}</span>
      <input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} aria-label="Due date" />
    </label>
  );
}

export default function CareerRoadmap({ savedUniversities = [], currentUser, onSelectUni, onToggleSave }) {
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
  useEffect(() => {
    document.querySelector(".rm-stepper-item.is-active")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [folder, view]);
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
      <div className="rm-panel">
        <div className="rm-scroll">
          <div className="rm-doc">
            {!tipHidden && (
              <div className="rm-callout">
                <Icon name="info" className="rm-callout-icon" />
                <div>Click any task, date or status to change it. Programmes you save on Home appear here with their deadline.</div>
                <button type="button" className="rm-callout-close" onClick={hideTip} aria-label="Hide tip">✕</button>
              </div>
            )}

            {/* widgets: progress ring, the next deadline as a sticky note, the intake */}
            <div className="rm-widgets">
              <div className="rm-widget rm-ring-card">
                <ProgressRing done={doneCount} total={list.length} />
                <div className="rm-next">
                  <div className="rm-widget-label">{nextStep ? "Your next step" : "All done"}</div>
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

            {/* views */}
            <div className="rm-views">
              <div className="community-tabs rm-tabs" role="tablist">
                <button role="tab" aria-selected={view === "list"} className={`community-tab ${view === "list" ? "active" : ""}`} onClick={() => { setView("list"); setFolder(null); }}>Steps <span className="community-tab-count">{STAGES.length}</span></button>
                <button role="tab" aria-selected={view === "board"} className={`community-tab ${view === "board" ? "active" : ""}`} onClick={() => setView("board")}>By status <span className="community-tab-count">{list.length}</span></button>
                <button role="tab" aria-selected={view === "gallery"} className={`community-tab ${view === "gallery" ? "active" : ""}`} onClick={() => setView("gallery")}>Saved programmes <span className="community-tab-count">{savedUniversities.length}</span></button>
              </div>
              <button className="rm-ghost" onClick={() => setConfirmReset(true)}>Start over</button>
            </div>

            {view === "gallery" ? (
              <div className="rm-gallery">
                {savedUniversities.map((p) => {
                  const t = list.find((x) => String(x.programId) === String(p.id));
                  const date = fromIso(t?.date);
                  const done = t?.status === "done";
                  return (
                    <div key={p.id} className="rm-gitem">
                      {/* the same programme card as on Home */}
                      <div className="uni-card-new" onClick={() => onSelectUni?.(p)}>
                        <UniImage src={p.image} name={p.name} className="uni-card-img" />
                        <div className="uni-card-glass">
                          {p.image && <img src={p.image} alt="" aria-hidden="true" className="card-glass-photo" />}
                          <div className="uni-card-glass-blur" />
                          <div className="uni-card-text">
                            <div className="uni-card-title" title={p.program}>{p.program}</div>
                            <div className="uni-card-subtitle" title={p.name}>{p.name}</div>
                          </div>
                          <button className="uni-card-save saved" onClick={(e) => { e.stopPropagation(); onToggleSave?.(p); }} aria-label="Remove from saved">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="rm-gitem-meta">
                        <span className={`rm-chip ${done ? "is-done" : ""}`}>{done ? "Applied" : "To apply"}</span>
                        {date ? <span className={`rm-pill ${dueTone(date, today, done)}`}>Deadline {fmt(date)}</span> : <span className="rm-faint">No deadline listed</span>}
                      </div>
                    </div>
                  );
                })}
                <button className="rm-gadd" onClick={() => navigate("/app")}>
                  <span>+</span>Save more programmes on Home
                </button>
              </div>
            ) : view === "list" ? (
              /* steps on the left, the chosen step's tasks and notes on the right: no clicking in and out */
              (() => {
                const activeId = folder ?? currentStage?.id ?? STAGES[0].id;
                const st = STAGES.find((x) => x.id === activeId);
                const items = list.filter((t) => t.stage === activeId).sort(byDate);
                const done = items.filter((t) => t.status === "done").length;
                return (
                  <div className="rm-split">
                    <nav className="rm-stepper" aria-label="Steps">
                      {STAGES.map((s2, n) => {
                        const its = list.filter((t) => t.stage === s2.id);
                        const d = its.filter((t) => t.status === "done").length;
                        const complete = its.length > 0 && d === its.length;
                        return (
                          <button key={s2.id} type="button" aria-current={s2.id === activeId ? "step" : undefined}
                            className={`rm-stepper-item ${s2.id === activeId ? "is-active" : ""} ${complete ? "is-complete" : ""}`}
                            onClick={() => setFolder(s2.id)}>
                            <span className="rm-stepper-num">{complete ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg> : n + 1}</span>
                            <span className="rm-stepper-text">
                              <span className="rm-stepper-name">{s2.label}</span>
                              <span className="rm-stepper-meta">{currentStage?.id === s2.id ? "You are here · " : ""}{d}/{its.length} done</span>
                            </span>
                          </button>
                        );
                      })}
                    </nav>

                    <div className="rm-stage-page">
                      <div className="rm-stage-head">
                        <span className="rm-stage-badge"><Icon name={st.id} /></span>
                        <div className="rm-stage-head-text">
                          <div className="rm-stage-kicker">Step {STAGES.indexOf(st) + 1} of {STAGES.length}</div>
                          <h2 className="rm-stage-title">{st.label}</h2>
                          <p className="rm-stage-about">{st.about}</p>
                        </div>
                        <div className="rm-stage-progress">
                          <ProgressRing done={done} total={items.length} />
                          <span>{done} of {items.length} done</span>
                        </div>
                      </div>
                      <section className="rm-card">
                        <div className="rm-card-head">Tasks <span>{items.length}</span></div>
                        <div className="rm-task-list">
                          {items.map((t) => renderRow(t))}
                        </div>
                        <button className="rm-add" onClick={() => add({ stage: activeId })}>+ Add a task</button>
                      </section>
                      <section className="rm-card rm-notes-card">
                        <div className="rm-card-head">Notes</div>
                        <textarea
                          className="rm-notes"
                          value={notes[activeId] ?? ""}
                          onChange={(e) => writeNote(activeId, e.target.value)}
                          placeholder="Ideas, links, questions for the school…"
                          rows={Math.max(4, (notes[activeId] ?? "").split("\n").length + 1)}
                        />
                      </section>
                      {STAGES.indexOf(st) < STAGES.length - 1 && (
                        <button type="button" className="rm-next-step" onClick={() => setFolder(STAGES[STAGES.indexOf(st) + 1].id)}>
                          Next step: {STAGES[STAGES.indexOf(st) + 1].label}
                          <svg className="rm-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
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
