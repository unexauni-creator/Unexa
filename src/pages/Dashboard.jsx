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
  "Scholarship",
  "Submission period",
  "Duration of study",
  "Language",
  "Min. language",
  "Min. CGPA",
  "Tuition fees",
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
          <div className="dash-subtitle" style={{ color: "#0F0F0F" }}>Add universities from Home to compare them here</div>
        </div>
        <div className="compare-empty">
          <div className="compare-empty-icon">⚖️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#4a3f38", marginBottom: 12 }}>No universities to compare</div>
          <button className="detail-btn-primary" onClick={() => navigate("/")}>Browse Universities</button>
        </div>
      </div>
    );
  }

  const rows = [
    unis.map(u => u.scholarship),
    unis.map(u => u.submissionPeriod),
    unis.map(u => u.duration),
    unis.map(u => u.language),
    unis.map(u => u.minLanguage),
    unis.map(u => u.minCGPA),
    unis.map(u => u.tuition),
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dash-title">Compare Dashboard</div>
        <div className="dash-subtitle" style={{ color: "#0F0F0F" }}>
          Comparing {unis.length} universit{unis.length === 1 ? "y" : "ies"}
        </div>
      </div>

      <div className="dash-table">

        {/* Header row — university cards */}
        <div className="dash-table-row dash-header-row">
          <div className="dash-table-label-cell" />
          {unis.map((u, i) => (
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
        {ROW_LABELS.map((label, rowIdx) => (
          <div key={label} className="dash-table-row">
            <div className="dash-table-label-cell">{label}</div>
            {unis.map((u, i) => (
              <div key={u.id} className="dash-table-cell">
                {rows[rowIdx][i]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}