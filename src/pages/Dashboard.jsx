import { useNavigate } from "react-router-dom";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import UniImage from "../components/UniImage.jsx";

const ROW_LABELS = [
  { key: "scholarshipsText", label: "Scholarship", info: null },
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

export default function Dashboard({
  comparedUniversities = [],
  onRemove,
  historyUniversities = [],
  onRestore,
  onDeleteHistory,
  maxCompare = 4,
}) {
  const navigate = useNavigate();

  const unis = comparedUniversities;
  const count = unis.length;
  const isFull = count === maxCompare;
  const isLocked = count === 1;

  const [showMaxPopup, setShowMaxPopup] = useState(false);
  const [scrolledX, setScrolledX] = useState(false); // the criteria column gets a background only while columns slide under it

  useEffect(() => {
    if (isFull) {
      setShowMaxPopup(true);
      const timer = setTimeout(() => setShowMaxPopup(false), 4000);
      return () => clearTimeout(timer);
    }
    setShowMaxPopup(false);
  }, [isFull]);

  function removeUni(id) {
    onRemove?.(id);
  }

  const history = (
    <ComparisonHistory
      items={historyUniversities}
      canAdd={count < maxCompare}
      onRestore={onRestore}
      onDelete={onDeleteHistory}
    />
  );

  if (count === 0) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div className="dash-title">Dashboard</div>
          <div className="dash-desc-block">
            <p className="dash-desc-sub">
              Compare selected universities side by side.
              <br />
              You can add up to {maxCompare} universities to find the one that fits you best.
            </p>
          </div>
        </div>
        <div className="dash-panel">
          <div className="compare-empty">
            <div className="compare-empty-icon" />
            <div className="compare-empty-title">No universities added</div>
            <div className="compare-empty-desc">Go to Home and open a university card, then click "Compare to others" to add it here.</div>
            <button className="dash-warning-btn" style={{ marginTop: 16 }} onClick={() => navigate("/app")}>Browse universities →</button>
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

        {/* Header row */}
        <div className="dash-table-row dash-header-row">
          <div className="dash-table-label-cell dash-corner-cell">
            {/* a diagonal line splits the corner: "Universities" above it, "Criteria" below */}
            <svg className="dash-corner-svg" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
              <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="dash-corner-top">Universities</span>
            <span className="dash-corner-bottom">Criteria</span>
          </div>
          {unis.map(u => (
            <div key={u.id} className="dash-table-cell dash-uni-header">
              <div className="dash-uni-card">
                <UniImage src={u.image} name={u.name} className="dash-uni-card-img" />
                <div className="dash-uni-card-glass">
                  {u.image && <img src={u.image} alt="" aria-hidden="true" className="card-glass-photo" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                  <div className="dash-uni-card-info">
                    <div className="dash-uni-card-program" title={u.program}>{u.program}</div>
                    <div className="dash-uni-card-name" title={u.name}>{u.name}</div>
                  </div>
                </div>
                <button className="dash-remove-btn" onClick={() => removeUni(u.id)} aria-label={`Remove ${u.name}`}>
                  <span className="dash-remove-icon" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Data rows: a block of their own, apart from the universities row */}
        <div className="dash-table-body">
        {ROW_LABELS.map(row => (
          <div key={row.key} className="dash-table-row">
            <div className="dash-table-label-cell">
              {row.label}
              {row.info && <InfoTooltip text={row.info} />}
            </div>
            {unis.map(u => (
              <div key={u.id} className="dash-table-cell">
                {u[row.key] || "—"}
              </div>
            ))}
          </div>
        ))}
        </div>

      </div>
    </div>
    </div>
  );

  const header = (
    <div className="dashboard-header">
      <div className="dash-title">Dashboard</div>
      <div className="dash-desc-block">
        <p className="dash-desc-sub">
          {count === 1
            ? "Compare selected universities side by side."
            : `Compare ${count} selected universities side by side.`}
          <br />
          You can add up to {maxCompare} universities to find the one that fits you best.
        </p>
      </div>
    </div>
  );

  const maxPopup = showMaxPopup && createPortal(
    <div className="dash-max-popup">
      <span>✓ Maximum reached — you can compare up to {maxCompare} universities. Remove one to add another.</span>
    </div>,
    document.body
  );

  if (isLocked) {
    return (
      <div className="dashboard-page">
        <div className="dash-locked-wrap">
          <div className="dash-locked-content">
            {header}
            {table}
          </div>
          <div className="dash-warning-overlay">
            <div className="dash-warning">
              <span className="dash-warning-icon" />
              <div className="dash-warning-title">Add at least one more university</div>
              <div className="dash-warning-desc">You need a minimum of 2 universities to start comparing. Go back to Home and add another one.</div>
              <button className="dash-warning-btn" onClick={() => navigate("/app")}>Add university →</button>
            </div>
          </div>
        </div>
        {history}
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {header}
      {maxPopup}
      {table}
      {history}
    </div>
  );
}