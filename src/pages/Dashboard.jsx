import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
    score: 7.2,
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
    score: 8.0,
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
    score: 6.5,
  },
];

const METRICS = [
  { key: "affordability", label: "Affordability", scores: [7.2, 8.5, 9.5] },
  { key: "scholarship", label: "Scholarship", scores: [8.8, 7.0, 6.0] },
  { key: "language", label: "Language Access", scores: [7.8, 6.5, 9.0] },
  { key: "ranking", label: "Academic Ranking", scores: [9.0, 7.5, 6.5] },
  { key: "acceptance", label: "Acceptance Rate", scores: [6.5, 8.0, 9.2] },
  { key: "campus", label: "Campus Life", scores: [8.0, 7.2, 7.0] },
];

const COLORS = [
  { active: "#AC8876", light: "rgba(172,136,118,0.18)", name: "Aix-Marseille" },
  { active: "#7B9E87", light: "rgba(123,158,135,0.18)", name: "Bordeaux" },
  { active: "#7A86AC", light: "rgba(122,134,172,0.18)", name: "Rennes 2" },
];

const TOTAL_BLOCKS = 10;

function BlockBar({ score, color }) {
  const filled = Math.round(score);
  return (
    <div className="block-bar">
      {Array.from({ length: TOTAL_BLOCKS }).map((_, i) => (
        <div
          key={i}
          className="block-cell"
          style={{
            background: i < filled ? color.active : color.light,
            opacity: i < filled ? (0.3 + (i / filled) * 0.7) : 1,
          }}
        />
      ))}
      <span className="block-score" style={{ color: color.active }}>{score.toFixed(1)}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [removed, setRemoved] = useState([]);

  const activeIndices = mockUniversities
    .map((u, i) => ({ u, i }))
    .filter(({ u }) => !removed.includes(u.id));

  if (activeIndices.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div className="dash-title">Compare Dashboard</div>
          <div className="dash-subtitle">Add universities from Home to compare them here</div>
        </div>
        <div className="compare-empty">
          <div className="compare-empty-icon">⚖️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#4a3f38", marginBottom: 12 }}>No universities to compare</div>
          <button className="detail-btn-primary" onClick={() => navigate("/")}>Browse Universities</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dash-title">Compare Dashboard</div>
        <div className="dash-subtitle" style={{ color: "#0F0F0F" }}>
          How do your selected universities compare? · 0 to 10
        </div>
      </div>

      {/* Block bar chart */}
      <div className="dash-section">
        <div className="dash-chart-box">
          {/* Legend */}
          <div className="dash-legend" style={{ marginBottom: 20 }}>
            {activeIndices.map(({ u, i }) => (
              <div key={u.id} className="dash-legend-item">
                <div className="dash-legend-dot" style={{ background: COLORS[i].active }} />
                <span>{COLORS[i].name}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {METRICS.map(metric => (
            <div key={metric.key} className="dash-block-row">
              <div className="dash-metric-label">{metric.label}</div>
              <div className="dash-block-bars">
                {activeIndices.map(({ u, i }) => (
                  <BlockBar
                    key={u.id}
                    score={metric.scores[i]}
                    color={COLORS[i]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed comparison table */}
      <div className="dash-section">
        <div className="dash-section-title">Detailed Comparison</div>
        <div className="dash-compare-wrap">
          <div className="dash-labels-col">
            <div className="dash-uni-header-placeholder" />
            {["Scholarship", "Submission period", "Duration of study", "Language", "Min. language", "Min. CGPA", "Tuition fees"].map(label => (
              <div key={label} className="dash-label-cell">{label}</div>
            ))}
          </div>

          {activeIndices.map(({ u, i }) => (
            <div key={u.id} className="dash-uni-col">
              <div className="dash-uni-card-header">
                <img src={u.image} alt={u.name} className="dash-uni-card-img" />
                <div className="dash-uni-card-info">
                  <div className="dash-uni-card-name">{u.name}</div>
                  <div className="dash-uni-card-program">{u.program}</div>
                </div>
                <button className="dash-remove-btn" onClick={() => setRemoved(r => [...r, u.id])}>✕</button>
              </div>
              {[u.scholarship, u.submissionPeriod, u.duration, u.language, u.minLanguage, u.minCGPA, u.tuition].map((val, j) => (
                <div key={j} className="dash-data-cell">{val}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}