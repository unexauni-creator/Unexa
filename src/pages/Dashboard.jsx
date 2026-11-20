import { useNavigate } from "react-router-dom";
import { useState, useRef, useLayoutEffect, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import UniImage from "../components/UniImage.jsx";
import UniversityDetail from "./UniversityDetail.jsx";
import { supabase } from "../lib/supabaseClient";
import { mapSpecialty } from "../lib/mapSpecialty.js";
import { CRITERIA, DEFAULT_WEIGHTS, rankPrograms } from "../lib/compareScore.js";

// which "Best for you" criterion a table row shows, so its best value can be highlighted
const ROW_CRITERION = { scholarshipsText: "scholarships", applicationDeadline: "deadline", duration: "duration", minLanguageLevel: "language", minCGPA: "grades", tuition: "cost" };
const WEIGHTS_KEY = "unexa_compare_weights";
const LEVELS = ["Off", "Low", "Medium", "High"];

const ROW_LABELS = [
  { key: "scholarshipsText", label: "Scholarship", info: null },
  { key: "applicationDeadline", label: "Application deadline", info: null },
  { key: "submissionPeriod", label: "Submission period", info: null },
  { key: "duration", label: "Duration of study", info: null },
  { key: "language", label: "Language", info: null },
  { key: "minLanguageLevel", label: "Min. language", info: null },
  { key: "minCGPA", label: "Min. CGPA", info: "CGPA (Cumulative Grade Point Average) is a measure of your overall academic performance. Most universities require a minimum CGPA to ensure students can handle the academic workload of the program." },
  { key: "tuition", label: "Tuition fees", info: null },
];

function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);
  const btnRef = useRef(null);
  const tooltipRef = useRef(null);

  function handleMouseEnter() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const tooltipWidth = Math.min(300, window.innerWidth - 32);
      let left = rect.left;
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
      if (left < 16) left = 16;
      setPos({ top: rect.bottom + 8, left });
    }
    setReady(false);
    setVisible(true);
  }

  useLayoutEffect(() => {
    if (visible && btnRef.current && tooltipRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current.offsetHeight;
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top;
      if (spaceBelow >= tooltipHeight + 8 || spaceBelow >= spaceAbove) {
        top = rect.bottom + 8;
      } else {
        top = Math.max(8, rect.top - tooltipHeight - 8);
      }

      let left = rect.left;
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
      if (left < 16) left = 16;

      setPos({ top, left });
      setReady(true);
    }
  }, [visible]);

  return (
    <span className="dash-info-wrap">
      <button ref={btnRef} className="dash-info-btn" onMouseEnter={handleMouseEnter} onMouseLeave={() => setVisible(false)}>
        <img src="/info-circle.svg" alt="info" className="dash-info-icon" />
      </button>
      {visible && createPortal(
        <div ref={tooltipRef} className="dash-tooltip" style={{ top: pos.top, left: pos.left, opacity: ready ? 1 : 0 }}
          onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
          <div className="dash-tooltip-text">{text}</div>
        </div>,
        document.body
      )}
    </span>
  );
}

// Universities removed from the comparison. Laid out like the table above: a small photo,
// the programme and the university, plus two actions — add back, or delete for good.
function ComparisonHistory({ items, canAdd, onRestore, onDelete }) {
  if (!items.length) return null;

  return (
    <section className="dash-history" aria-label="Comparison history">
      <div className="dash-history-header">
        <h2 className="dash-history-title">History</h2>
        <span className="dash-history-count">{items.length}</span>
        <span className="dash-history-sub">Universities you removed from the comparison</span>
      </div>

      <div className="dash-panel dash-history-panel">
        <div className="dash-history-table">
          <div className="dash-history-row dash-history-headrow">
            <span className="dash-history-col-program">Programme</span>
            <span className="dash-history-col-name">University</span>
          </div>

          {items.map(u => (
            <div key={u.id} className="dash-history-row">
              <UniImage src={u.image} name={u.name} className="dash-history-img" />
              <div className="dash-history-program" title={u.program || u.name}>{u.program || u.name}</div>
              <div className="dash-history-name" title={u.name}>{u.name}</div>
              <div className="dash-history-actions">
                <button
                  type="button"
                  className="dash-history-add"
                  onClick={() => onRestore?.(u)}
                  disabled={!canAdd}
                  title={canAdd ? "Add back to the comparison" : "The comparison is full — remove one first"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span className="dash-history-add-label">Add to compare</span>
                </button>
                <button
                  type="button"
                  className="dash-history-delete"
                  onClick={() => onDelete?.(u.id)}
                  aria-label={`Delete ${u.name} from history`}
                  title="Delete from history"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Search over all programmes, to add one to the comparison without going back to Home
function AddSearch({ compared, onAdd, maxCompare }) {
  const [all, setAll] = useState(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open || all) return;
    supabase.from("specialties").select("*, universities(*)")
      .then(({ data, error }) => { if (error) throw error; setAll((data ?? []).map(mapSpecialty)); })
      .catch(() => { setAll([]); setLoadError(true); });
  }, [open, all]);
  useEffect(() => {
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const full = compared.length >= maxCompare;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = (all ?? [])
    .filter((p) => !compared.some((c) => c.id === p.id))
    .filter((p) => !words.length || words.every((w) => `${p.program} ${p.name} ${p.desc}`.toLowerCase().includes(w)))
    .slice(0, 8);
  return (
    <div className="dash-add" ref={box}>
      <div className={`dash-add-input${open ? " is-open" : ""}`}>
        <img src="/search-normal.svg" alt="" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={full ? `Remove one to add another (max ${maxCompare})` : "Add a programme: search by name, school or city…"}
          disabled={full}
          aria-label="Add a programme to compare"
        />
      </div>
      {open && !full && (
        <div className="dash-add-menu">
          {all === null && <div className="dash-add-empty">Loading programmes…</div>}
          {loadError && <div className="dash-add-empty">Couldn't load programmes. Check your connection and try again.</div>}
          {all && !loadError && results.length === 0 && <div className="dash-add-empty">No programmes match “{q}”.</div>}
          {results.map((p) => (
            <button key={p.id} type="button" className="dash-add-item" onClick={() => { onAdd?.(p); setQ(""); setOpen(false); }}>
              <UniImage src={p.image} name={p.name} className="dash-add-thumb" />
              <span><b>{p.program}</b><small>{p.name} · {p.desc}</small></span>
              <i aria-hidden="true">+</i>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// "Best for you": priorities the student picks, the winner and the ranking
function BestForYou({ ranking, weights, onOpen, onTest }) {
  const [top, ...rest] = ranking.ranked;
  return (
    <section className="dash-best">
      <div className="dash-best-main">
        <div className="dash-best-kicker">🏆 Best for you</div>
        {top && ranking.used.length > 0 ? (
          <button type="button" className="dash-best-winner" onClick={() => onOpen(top.program)}>
            <UniImage src={top.program.image} name={top.program.name} className="dash-best-img" />
            <span className="dash-best-text">
              <b>{top.program.program}</b>
              <small>{top.program.name}</small>
              {top.reasons.length > 0 && <span className="dash-best-reasons">{top.reasons.map((r) => <em key={r}>✓ {r}</em>)}</span>}
            </span>
            <span className="dash-best-match"><strong>{top.match}%</strong><small>match</small></span>
          </button>
        ) : (
          <p className="dash-best-none">Turn on at least one priority that your programmes have data for.</p>
        )}
        {rest.length > 0 && ranking.used.length > 0 && (
          <ol className="dash-best-rest">
            {rest.map((r, i) => (
              <li key={r.program.id}>
                <span className="dash-best-pos">{i + 2}</span>
                <span className="dash-best-name">{r.program.program}<small>{r.program.name}</small></span>
                <span className="dash-best-bar"><i style={{ width: `${r.match}%` }} /></span>
                <span className="dash-best-pct">{r.match}%</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="dash-best-prefs">
        <div className="dash-best-prefs-title">What matters to you</div>
        <div className="dash-best-chips">
          {CRITERIA.filter((c) => weights[c.id] > 0).sort((a, b) => weights[b.id] - weights[a.id]).map((c) => (
            <span key={c.id} className={`dash-chip w${weights[c.id]}`}>{c.label}<em>{LEVELS[weights[c.id]]}</em></span>
          ))}
        </div>
        <button type="button" className="dash-test-btn" onClick={onTest}>
          <span aria-hidden="true">✦</span> Take the 1-minute test
        </button>
        <p className="dash-best-note">Six quick questions about what matters most to you. The ranking above updates from your answers. Scores use only what schools publish; a missing field never counts for or against a programme.</p>
      </div>
    </section>
  );
}

// "What matters to you?": one question per criterion, four answers each
const QUESTIONS = {
  cost: { q: "How much does a low tuition fee matter to you?", hint: "We compare yearly tuition across currencies." },
  scholarships: { q: "Do you need a programme that offers scholarships?", hint: "Programmes whose school lists scholarships score higher." },
  language: { q: "How important is an easy language requirement?", hint: "For example a lower IELTS, TOEFL or B1/B2 level." },
  grades: { q: "How important is a low grade (GPA) requirement?", hint: "Useful if your grades are not at the top of your class." },
  deadline: { q: "How much does having more time to apply matter?", hint: "Programmes with a later deadline score higher." },
  duration: { q: "Would you prefer a shorter programme?", hint: "Shorter programmes cost less in total and finish sooner." },
};
const ANSWERS = [
  { v: 0, label: "Not at all", sub: "Leave it out" },
  { v: 1, label: "A little", sub: "Nice to have" },
  { v: 2, label: "Quite a lot", sub: "Important" },
  { v: 3, label: "A lot", sub: "One of my top priorities" },
];

function PriorityTest({ weights, onDone, onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ ...weights });
  const c = CRITERIA[step];
  const last = step === CRITERIA.length - 1;
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  function pick(v) {
    const next = { ...answers, [c.id]: v };
    setAnswers(next);
    if (!last) setTimeout(() => setStep((s) => s + 1), 220); // move on by itself after a short beat
  }
  return createPortal(
    <div className="dash-test-root" role="dialog" aria-modal="true" aria-label="What matters to you">
      <div className="dash-drawer-backdrop" onClick={onClose} />
      <div className="dash-test">
        <button type="button" className="dash-drawer-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="dash-test-progress"><i style={{ width: `${((step + 1) / CRITERIA.length) * 100}%` }} /></div>
        <div className="dash-test-step">Question {step + 1} of {CRITERIA.length}</div>
        <h3 key={c.id} className="dash-test-q">{QUESTIONS[c.id].q}</h3>
        <p className="dash-test-hint">{QUESTIONS[c.id].hint}</p>
        <div className="dash-test-answers">
          {ANSWERS.map((a) => (
            <button key={a.v} type="button" className={`dash-test-answer${answers[c.id] === a.v ? " on" : ""}`} onClick={() => pick(a.v)}>
              <span className="dash-test-dots" aria-hidden="true">{[1, 2, 3].map((d) => <i key={d} className={d <= a.v ? "on" : ""} />)}</span>
              <b>{a.label}</b><small>{a.sub}</small>
            </button>
          ))}
        </div>
        <div className="dash-test-nav">
          <button type="button" className="dash-test-back" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← Back</button>
          {last
            ? <button type="button" className="dash-warning-btn" onClick={() => onDone(answers)}>Show my best match →</button>
            : <button type="button" className="dash-test-back" onClick={() => setStep((s) => s + 1)}>Skip →</button>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Dashboard({ comparedUniversities = [], onRemove, maxCompare = 4, onAdd, savedUniversities, onToggleSave, onAddToCompare, historyUniversities = [], onRestore, onDeleteHistory }) {
  const navigate = useNavigate();

  const unis = comparedUniversities;
  const count = unis.length;
  const isFull = count === maxCompare;

  const [showMaxPopup, setShowMaxPopup] = useState(false);
  const [scrolledX, setScrolledX] = useState(false); // the criteria column gets a background only while columns slide under it
  const [openUni, setOpenUni] = useState(null); // programme shown in the side panel
  const [testOpen, setTestOpen] = useState(false); // the "what matters to you" test
  const [weights, setWeights] = useState(() => {
    try { return { ...DEFAULT_WEIGHTS, ...JSON.parse(localStorage.getItem(WEIGHTS_KEY) || "{}") }; } catch { return DEFAULT_WEIGHTS; }
  });
  function setWeight(id, v) {
    setWeights((w) => { const next = { ...w, [id]: v }; try { localStorage.setItem(WEIGHTS_KEY, JSON.stringify(next)); } catch { /* private mode */ } return next; });
  }
  const ranking = useMemo(() => rankPrograms(unis, weights), [unis, weights]);
  const winnerId = count >= 2 && ranking.used.length ? ranking.ranked[0]?.program.id : null;

  useEffect(() => {
    if (isFull) {
      setShowMaxPopup(true);
      const timer = setTimeout(() => setShowMaxPopup(false), 4000);
      return () => clearTimeout(timer);
    }
    setShowMaxPopup(false);
  }, [isFull]);

  // the side panel closes with Escape
  useEffect(() => {
    if (!openUni) return;
    const esc = (e) => { if (e.key === "Escape") setOpenUni(null); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [openUni]);

  const history = (
    <ComparisonHistory
      items={historyUniversities}
      canAdd={count < maxCompare}
      onRestore={onRestore}
      onDelete={onDeleteHistory}
    />
  );

  const header = (
    <div className="dashboard-header dash-header-row-top">
      <div>
        <div className="dash-title">Dashboard</div>
        <p className="dash-desc-sub">
          {count >= 2 ? `Compare ${count} programmes side by side.` : "Compare programmes side by side."}
          <br />
          You can add up to {maxCompare} to find the one that fits you best.
        </p>
      </div>
      <AddSearch compared={unis} onAdd={onAdd} maxCompare={maxCompare} />
    </div>
  );

  if (count === 0) {
    return (
      <div className="dashboard-page">
        {header}
        <div className="dash-panel">
          <div className="compare-empty">
            <div className="compare-empty-icon" />
            <div className="compare-empty-title">No programmes added yet</div>
            <div className="compare-empty-desc">Search above to add programmes, or open one on Home and press “Compare to others”.</div>
            <button className="dash-warning-btn" style={{ marginTop: 16 }} onClick={() => navigate("/app")}>Browse programmes →</button>
          </div>
        </div>
        {history}
      </div>
    );
  }

  const table = (
    <div className="dash-panel">
    <div className={`dash-table-scroll${scrolledX ? " is-scrolled" : ""}`} onScroll={(e) => setScrolledX(e.currentTarget.scrollLeft > 0)}>
      <div className={`dash-table${isFull ? " dash-table-full" : ""}`} style={{ "--uni-count": count }}>

        {/* Header row: the programmes; a click opens the details on the right */}
        <div className="dash-table-row dash-header-row">
          <div className="dash-table-label-cell dash-corner-cell">
            <span className="dash-corner-only">Universities</span>
          </div>
          {unis.map(u => (
            <div key={u.id} className="dash-table-cell dash-uni-header">
              <div className={`dash-uni-card${u.id === winnerId ? " is-winner" : ""}`} role="button" tabIndex={0}
                onClick={() => setOpenUni(u)} onKeyDown={(e) => { if (e.key === "Enter") setOpenUni(u); }} aria-label={`Open ${u.program}`}>
                <UniImage src={u.image} name={u.name} className="dash-uni-card-img" />
                {u.id === winnerId && <span className="dash-winner-badge">🏆 Best match</span>}
                <div className="dash-uni-card-glass">
                  {u.image && <img src={u.image} alt="" aria-hidden="true" className="card-glass-photo" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                  <div className="dash-uni-card-info">
                    <div className="dash-uni-card-program" title={u.program}>{u.program}</div>
                    <div className="dash-uni-card-name" title={u.name}>{u.name}</div>
                  </div>
                </div>
                <button className="dash-remove-btn" onClick={(e) => { e.stopPropagation(); onRemove?.(u.id); }} aria-label={`Remove ${u.name}`}>
                  <span className="dash-remove-icon" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-table-body">
        {ROW_LABELS.map(row => {
          const bestIds = count >= 2 ? ranking.best[ROW_CRITERION[row.key]] : null;
          return (
            <div key={row.key} className="dash-table-row">
              <div className="dash-table-label-cell">
                {row.label}
                {row.info && <InfoTooltip text={row.info} />}
              </div>
              {unis.map(u => (
                <div key={u.id} className={`dash-table-cell${u[row.key] && bestIds?.includes(u.id) ? " is-best" : ""}`}>
                  {u[row.key] || "—"}
                </div>
              ))}
            </div>
          );
        })}
        </div>

      </div>
    </div>
    </div>
  );

  const maxPopup = showMaxPopup && createPortal(
    <div className="dash-max-popup">
      <span>✓ Maximum reached — you can compare up to {maxCompare} programmes. Remove one to add another.</span>
    </div>,
    document.body
  );

  // the programme's own page, sliding in from the right
  const sidePanel = openUni && createPortal(
    <div className="dash-drawer-root" role="dialog" aria-modal="true" aria-label={openUni.program}>
      <div className="dash-drawer-backdrop" onClick={() => setOpenUni(null)} />
      <aside className="dash-drawer">
        <button type="button" className="dash-drawer-close" onClick={() => setOpenUni(null)} aria-label="Close">✕</button>
        <UniversityDetail
          uni={openUni}
          onBack={() => setOpenUni(null)}
          savedUniversities={savedUniversities}
          onToggleSave={onToggleSave}
          comparedUniversities={unis}
          onAddToCompare={onAddToCompare}
        />
      </aside>
    </div>,
    document.body
  );

  return (
    <div className="dashboard-page">
      {header}
      {maxPopup}
      {count === 1 && <div className="dash-hint">Add one more programme with the search above to start comparing.</div>}
      <div className="dash-scroll-area">
        {table}
        {count >= 2 && <BestForYou ranking={ranking} weights={weights} onOpen={setOpenUni} onTest={() => setTestOpen(true)} />}
        {history}
      </div>
      {sidePanel}
      {testOpen && <PriorityTest weights={weights} onDone={(w) => { Object.entries(w).forEach(([k, v]) => setWeight(k, v)); setTestOpen(false); }} onClose={() => setTestOpen(false)} />}
    </div>
  );
}
