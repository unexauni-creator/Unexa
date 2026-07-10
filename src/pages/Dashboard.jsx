import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";

const mockUniversities = [
  {
    id: 1,
    name: "Aix-Marseille Université",
    program: "Graphic Design",
    scholarship: "Merit Award",
    submissionPeriod: "September 2026",
    duration: "36 months",
    language: "English / French",
    minLanguage: "IELTS 6.0 / DELF B2",
    minCGPA: "CGPA 3.0",
    tuition: "$8,500/yr",
    image: "https://madeinmarseille.net/actualites-marseille/2019/04/Cube-campus-aix.jpeg",
  },
  {
    id: 2,
    name: "Université Bordeaux",
    program: "Graphic Design",
    scholarship: "International Grant",
    submissionPeriod: "April 2026",
    duration: "36 months",
    language: "English / French",
    minLanguage: "IELTS 6.5 / DELF B2",
    minCGPA: "CGPA 3.2",
    tuition: "$7,200/yr",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Ijba_iut_montaigne_bordeaux.jpg",
  },
  {
    id: 3,
    name: "Université Rennes 2",
    program: "Graphic Design",
    scholarship: "Need-Based Aid",
    submissionPeriod: "April 2026",
    duration: "36 months",
    language: "English / French",
    minLanguage: "IELTS 5.5 / DELF B1",
    minCGPA: "CGPA 2.8",
    tuition: "$6,000/yr",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg/330px-Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg",
  },
];

const ROW_LABELS = [
  { label: "Scholarship", info: null },
  { label: "Submission period", info: null },
  { label: "Duration of study", info: null },
  { label: "Language", info: null },
  { label: "Min. language", info: null },
  { label: "Min. CGPA", info: "CGPA (Cumulative Grade Point Average) is a measure of your overall academic performance. Most universities require a minimum CGPA to ensure students can handle the academic workload of the program." },
  { label: "Tuition fees", info: null },
];

function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  function handleMouseEnter() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
    setVisible(true);
  }

  function handleMouseLeave() {
    setVisible(false);
  }

  return (
    <span className="dash-info-wrap">
      <button
        ref={btnRef}
        className="dash-info-btn"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img src="/info-circle.svg" alt="info" className="dash-info-icon" />
      </button>
      {visible && (
        <div
          className="dash-tooltip"
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="dash-tooltip-text">{text}</div>
        </div>
      )}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [removed, setRemoved] = useState([]);

  const unis = mockUniversities.filter(u => !removed.includes(u.id));
  const count = unis.length;

  const rows = [
    unis.map(u => u.scholarship),
    unis.map(u => u.submissionPeriod),
    unis.map(u => u.duration),
    unis.map(u => u.language),
    unis.map(u => u.minLanguage),
    unis.map(u => u.minCGPA),
    unis.map(u => u.tuition),
  ];

  if (count === 0) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div className="dash-title">Compare Dashboard</div>
          <div className="dash-desc-block">
            <p className="dash-desc-main">Not sure which university is right for you?</p>
            <p className="dash-desc-sub">Add universities from the Home page and compare them side by side — scholarships, tuition, language requirements, deadlines and more. You can compare between 2 and 4 universities at once to make the best decision for your future.</p>
          </div>
        </div>
        <div className="compare-empty">
          <div className="compare-empty-icon">⚖️</div>
          <div className="compare-empty-title">No universities added yet</div>
          <div className="compare-empty-desc">Go to Home, open any university card and click "Compare to others" to add it here.</div>
          <button className="detail-btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/")}>Browse Universities</button>
        </div>
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div className="dash-title">Compare Dashboard</div>
          <div className="dash-desc-block">
            <p className="dash-desc-main">Not sure which university is right for you?</p>
            <p className="dash-desc-sub">Add universities from the Home page and compare them side by side. You can compare between 2 and 4 universities at once to make the best decision for your future.</p>
          </div>
        </div>
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
              <button
                className="dash-remove-btn"
                style={{ position: "static", marginLeft: "auto" }}
                onClick={() => setRemoved(r => [...r, u.id])}
              >✕</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dash-title">Compare Dashboard</div>
        <div className="dash-desc-block">
          <p className="dash-desc-main">Not sure which university is right for you?</p>
          <p className="dash-desc-sub">
            Compare {count} selected universit{count === 1 ? "y" : "ies"} side by side — scholarships, tuition fees, language requirements, application deadlines and more. You can add up to 4 universities to find the one that fits you best.
          </p>
        </div>
      </div>

      {count === 4 && (
        <div className="dash-max-banner">
          <span>✓ Maximum reached — you can compare up to 4 universities. Remove one to add another.</span>
        </div>
      )}

      <div className="dash-table">

        {/* Header row */}
        <div className="dash-table-row dash-header-row">
          <div className="dash-table-label-cell dash-corner-cell">
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
              <button className="dash-remove-btn" onClick={() => setRemoved(r => [...r, u.id])}>✕</button>
            </div>
          ))}
        </div>

        {/* Data rows */}
        {ROW_LABELS.map((row, rowIdx) => (
          <div key={row.label} className="dash-table-row">
            <div className="dash-table-label-cell">
              {row.label}
              {row.info && <InfoTooltip text={row.info} />}
            </div>
            {unis.map(u => (
              <div key={u.id} className="dash-table-cell">
                {rows[rowIdx][unis.indexOf(u)]}
              </div>
            ))}
          </div>
        ))}

      </div>
    </div>
  );
}