import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";

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
  const btnRef = useRef(null);

  function handleMouseEnter() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
    }
    setVisible(true);
  }

  return (
    <span className="dash-info-wrap">
      <button ref={btnRef} className="dash-info-btn" onMouseEnter={handleMouseEnter} onMouseLeave={() => setVisible(false)}>
        <img src="/info-circle.svg" alt="info" className="dash-info-icon" />
      </button>
      {visible && (
        <div className="dash-tooltip" style={{ top: pos.top, left: pos.left }}
          onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
          <div className="dash-tooltip-text">{text}</div>
        </div>
      )}
    </span>
  );
}

export default function Dashboard({ comparedUniversities = [], onRemove, maxCompare = 4 }) {
  const navigate = useNavigate();

  const unis = comparedUniversities;
  const count = unis.length;

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
          <div className="compare-empty-icon">⚖️</div>
          <div className="compare-empty-title">No universities added</div>
          <div className="compare-empty-desc">Go to Home and open a university card, then click "Compare to others" to add it here.</div>
          <button className="detail-btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/")}>Browse Universities</button>
        </div>
      </div>
    );
  }

  if (count === 1) {
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
        <div className="dash-narrow-wrap">
          <div className="dash-warning">
            <span className="dash-warning-icon">⚠️</span>
            <div>
              <div className="dash-warning-title">Add at least one more university</div>
              <div className="dash-warning-desc">You need a minimum of 2 universities to start comparing. Go back to Home and add another one.</div>
            </div>
            <button className="dash-warning-btn" onClick={() => navigate("/")}>Add university →</button>
          </div>
          <div className="dash-single-preview">
            {unis.map(u => (
              <div key={u.id} className="dash-single-card">
                <img src={u.image} alt={u.name} className="dash-single-img" />
                <div className="dash-single-info">
                  <div className="dash-uni-card-name" style={{ fontSize: 15 }}>{u.name}</div>
                  <div className="dash-uni-card-program">{u.program}</div>
                </div>
                <button className="dash-remove-btn" style={{ position: "static", marginLeft: "auto" }}
                  onClick={() => removeUni(u.id)}>
                  <span className="dash-remove-icon" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dash-title">Dashboard</div>
        <div className="dash-desc-block">
          <p className="dash-desc-sub">
            Compare {count} selected universities side by side.
            <br />
            You can add up to {maxCompare} universities to find the one that fits you best.
          </p>
        </div>
      </div>

      {count === maxCompare && (
        <div className="dash-max-banner">
          <span>✓ Maximum reached — you can compare up to {maxCompare} universities. Remove one to add another.</span>
        </div>
      )}

      <div className="dash-table-scroll">
        <div className="dash-table" style={{ "--uni-count": count }}>

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
    </div>
  );
}