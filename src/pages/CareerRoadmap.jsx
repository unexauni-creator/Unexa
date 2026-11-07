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

function DateChip({ value, onChange, tone }) {
  const date = fromIso(value);
  return (
    <label className={`rm-date ${tone} ${date ? "" : "is-empty"}`}>
      <span>{date ? fmt(date, date.getFullYear() !== new Date().getFullYear()) : "Add date"}</span>
      <input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} aria-label="Due date" />
    </label>
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
  const [closed, setClosed] = useState({}); // collapsed groups
  const [justAdded, setJustAdded] = useState(null);
  const [dragId, setDragId] = useState(null);
  const saveTimer = useRef(null);

  const plan = useMemo(() => buildPlan({ programs: savedUniversities, startYear, today }), [savedUniversities, startYear, today]);

  useEffect(() => {
    let cancelled = false;
    const done = (r) => {
      if (cancelled) return;
      setStartYear(r.startYear);
      setInAccount(r.inAccount);
      const saved = r.progress?.version === 2 ? r.progress.tasks : null;
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

  function commit(next) {
    setTasks(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (userId) saveProgress(userId, { version: 2, tasks: next }, inAccount).catch((e) => console.error("Couldn't save the roadmap:", e.message));
    }, 500);
  }

  const list = Array.isArray(tasks) ? tasks : [];
  const update = (id, patch) => commit(list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id) => commit(list.filter((t) => t.id !== id));
  function add(fields) {
    const t = { id: newId(), title: "", note: "", date: "", stage: "research", status: "todo", ...fields };
    setJustAdded(t.id);
    commit([...list, t]);
  }
  function resetPlan() {
    if (window.confirm("Replace your list with a fresh plan? Your own tasks and changes will be lost.")) commit(withProgramTasks(seedTasks(plan), plan, savedUniversities));
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
        {view === "list" && t.status === "doing" && <span className="rm-status-tag">In progress</span>}
        <DateChip value={t.date} onChange={(v) => update(t.id, { date: v })} tone={dueTone(fromIso(t.date), today, done)} />
        <button className="rm-row-del" onClick={() => remove(t.id)} aria-label="Delete task" title="Delete">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="rm-page">
      <div className="rm-panel">
        <div className="rm-scroll">
          <div className="rm-doc">
            <div className="rm-icon" aria-hidden="true">🗺️</div>
            <h1 className="rm-title">Roadmap</h1>
            <p className="rm-desc">Your plan to get into art school. Every line is yours: click to rename it, change the date, add your own tasks.</p>

            {/* properties, like a Notion page */}
            <div className="rm-props">
              <div className="rm-prop">
                <span className="rm-prop-name">Start</span>
                <select className="rm-prop-select" value={startYear ?? "Not sure yet"} onChange={(e) => changeIntake(e.target.value)}>
                  {INTAKES.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="rm-prop">
                <span className="rm-prop-name">Next deadline</span>
                {nextDeadline ? (
                  <span className="rm-prop-value">
                    {fmt(fromIso(nextDeadline.date))} · {nextDeadline.title.replace(/^Apply: /, "")}
                    <span className={`rm-pill ${dueTone(fromIso(nextDeadline.date), today, false)}`}>{Math.max(0, daysBetween(today, fromIso(nextDeadline.date)))} days</span>
                  </span>
                ) : (
                  <span className="rm-prop-value rm-faint">{savedUniversities.length ? "No deadline listed for your programmes" : "Save programmes on Home to see deadlines"}</span>
                )}
              </div>
              <div className="rm-prop">
                <span className="rm-prop-name">Progress</span>
                <span className="rm-prop-value">
                  <span className="rm-bar"><span style={{ width: `${list.length ? (doneCount / list.length) * 100 : 0}%` }} /></span>
                  {doneCount} of {list.length} done
                </span>
              </div>
            </div>

            {/* views */}
            <div className="rm-views">
              <div className="rm-view-tabs" role="tablist">
                <button role="tab" aria-selected={view === "list"} className={view === "list" ? "active" : ""} onClick={() => setView("list")}>☰ List</button>
                <button role="tab" aria-selected={view === "board"} className={view === "board" ? "active" : ""} onClick={() => setView("board")}>▦ Board</button>
              </div>
              <button className="rm-ghost" onClick={resetPlan}>Reset plan</button>
            </div>

            {view === "list" ? (
              <div className="rm-groups">
                {STAGES.map((st) => {
                  const items = list.filter((t) => t.stage === st.id).sort(byDate);
                  const open = !closed[st.id];
                  return (
                    <section key={st.id} className="rm-group">
                      <button className="rm-group-head" onClick={() => setClosed((c) => ({ ...c, [st.id]: open }))} aria-expanded={open}>
                        <span className={`rm-caret ${open ? "open" : ""}`}>▸</span>
                        <span className="rm-group-name">{st.label}</span>
                        <span className="rm-group-count">{items.filter((t) => t.status === "done").length}/{items.length}</span>
                      </button>
                      {open && (
                        <div className="rm-group-body">
                          {items.map((t) => renderRow(t))}
                          <button className="rm-add" onClick={() => add({ stage: st.id })}>+ New task</button>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="rm-board">
                {STATUSES.map((s) => {
                  const items = list.filter((t) => (t.status ?? "todo") === s.id).sort(byDate);
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
                              <span className="rm-stage-tag">{STAGES.find((x) => x.id === t.stage)?.label}</span>
                              <DateChip value={t.date} onChange={(v) => update(t.id, { date: v })} tone={dueTone(fromIso(t.date), today, t.status === "done")} />
                              <button className="rm-row-del" onClick={() => remove(t.id)} aria-label="Delete task" title="Delete">
                                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <button className="rm-add" onClick={() => add({ status: s.id })}>+ New</button>
                    </section>
                  );
                })}
              </div>
            )}

            {savedUniversities.length === 0 && (
              <p className="rm-hint">Tip: save programmes on Home (the bookmark on a card), and an “Apply” task with their deadline appears here. <button className="rm-link-btn" onClick={() => navigate("/app")}>Go to Home →</button></p>
            )}
            <p className="rm-hint">Dates from schools marked “based on last year” are estimates. Always check the school's official page.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
