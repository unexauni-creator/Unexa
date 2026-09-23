import { useNavigate } from "react-router-dom";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";

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

export default function Dashboard({ comparedUniversities = [], onRemove, maxCompare = 4 }) {
  const navigate = useNavigate();

  const unis = comparedUniversities;
  const count = unis.length;
  const isFull = count === maxCompare;
  const isLocked = count === 1;

  const [showMaxPopup, setShowMaxPopup] = useState(false);

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
        <div className="compare-empty">
          <div className="compare-empty-icon" />
          <div className="compare-empty-title">No universities added</div>
          <div className="compare-empty-desc">Go to Home and open a university card, then click "Compare to others" to add it here.</div>
          <button className="detail-btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/app")}>Browse Universities</button>
        </div>
      </div>
    );
  }

  const table = (
    <div className="dash-table-scroll">
      <div className={`dash-table${isFull ? " dash-table-full" : ""}`} style={{ "--uni-count": count }}>

        {/* Header row */}
        <div className="dash-table-row dash-header-row">
          <div className="dash-table-label-cell dash-corner-cell">
            <svg className="dash-corner-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="dash-corner-top">Universities</span>
            <span className="dash-corner-bottom">Criteria</span>
          </div>
          {unis.map(u => (
            <div key={u.id} className="dash-table-cell dash-uni-header">
              <img src={u.image} alt={u.name} className="dash-uni-card-img" />
              <div className="dash-uni-card-info">
                <div className="dash-uni-card-name">{u.name}</div>
                <div className="dash-uni-card-program">{u.program}</div>
              </div>
              <button className="dash-remove-btn" onClick={() => removeUni(u.id)}>
                <span className="dash-remove-icon" />
              </button>
            </div>
          ))}
        </div>

        {/* Data rows */}
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
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {header}
      {maxPopup}
      {table}
    </div>
  );
}