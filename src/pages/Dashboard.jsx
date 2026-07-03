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
    scores: { tuition: 72, language: 78, scholarship: 88, ranking: 90, acceptance: 65 },
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
    scores: { tuition: 85, language: 65, scholarship: 70, ranking: 75, acceptance: 80 },
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
    scores: { tuition: 95, language: 90, scholarship: 60, ranking: 65, acceptance: 92 },
  },
];

const METRICS = [
  { key: "tuition", label: "Affordability" },
  { key: "language", label: "Language Access" },
  { key: "scholarship", label: "Scholarship" },
  { key: "ranking", label: "Ranking" },
  { key: "acceptance", label: "Acceptance Rate" },
];

const COLORS = [
  { bar: "#AC8876", track: "rgba(172,136,118,0.15)", name: "Aix-Marseille" },
  { bar: "#7B9E87", track: "rgba(123,158,135,0.15)", name: "Bordeaux" },
  { bar: "#7A86AC", track: "rgba(122,134,172,0.15)", name: "Rennes 2" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [removed, setRemoved] = useState([]);

  const unis = mockUniversities.filter(u => !removed.includes(u.id));

  if (unis.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div className="dash-title">Compare Dashboard</div>
          <div className="dash-subtitle">Add universities from Home to compare them here</div>
        </div>
        <div className="compare-empty">
          <div className="compare-empty-icon">⚖️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#4a3f38", marginBottom: 8 }}>No universities to compare</div>
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
          Comparing {unis.length} universit{unis.length === 1 ? "y" : "ies"}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="dash-section">
        <div className="dash-section-title">University Metrics Overview</div>

        {/* Legend */}
        <div className="dash-legend">
          {unis.map((u, i) => (
            <div key={u.id} className="dash-legend-item">
              <div className="dash-legend-dot" style={{ background: COLORS[i].bar }} />
              <span>{COLORS[i].name}</span>
            </div>
          ))}
        </div>

        <div className="dash-chart-box">
          {METRICS.map(metric => (
            <div key={metric.key} className="dash-metric-row">
              <div className="dash-metric-label">{metric.label}</div>
              <div className="dash-metric-bars">
                {unis.map((u, i) => {
                  const score = u.scores[metric.key];
                  return (
                    <div key={u.id} className="dash-bar-wrap">
                      <div
                        className="dash-bar-track"
                        style={{ background: COLORS[i].track }}
                      >
                        <div
                          className="dash-bar-fill"
                          style={{
                            width: `${score}%`,
                            background: COLORS[i].bar,
                          }}
                        />
                      </div>
                      <span className="dash-bar-value">{score}</span>
                    </div>
                  );
                })}
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

          {unis.map((u, i) => (
            <div key={u.id} className="dash-uni-col">
              <div className="dash-uni-card-header">
                <img src={u.image} alt={u.name} className="dash-uni-card-img" />
                <div className="dash-uni-card-info">
                  <div className="dash-uni-card-name">{u.name}</div>
                  <div className="dash-uni-card-program">{u.program}</div>
                </div>
                <button
                  className="dash-remove-btn"
                  onClick={() => setRemoved(r => [...r, u.id])}
                >✕</button>
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