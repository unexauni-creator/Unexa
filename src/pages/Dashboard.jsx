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
          <div className="dash-subtitle">Compare between 2 and 4 selected universities side by side</div>
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
          <div className="dash-title">Compare Dashboard</div>
          <div className="dash-subtitle">Compare between 2 and 4 selected universities side by side</div>
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
              <button className="dash-remove-btn" style={{ position: "static", marginLeft: "auto" }} onClick={() => setRemoved(r => [...r, u.id])}>✕</button>
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
        <div className="dash-subtitle" style={{ color: "#0F0F0F" }}>
          Comparing {count} universit{count === 1 ? "y" : "ies"} · You can compare between 2 and 4 universities
        </div>
      </div>

      {count === 4 && (
        <div className="dash-max-banner">
          <span>✓ Maximum reached — you can compare up to 4 universities. Remove one to add another.</span>
        </div>
      )}

      <div className="dash-table">

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

        {ROW_LABELS.map((label, rowIdx) => (
          <div key={label} className="dash-table-row">
            <div className="dash-table-label-cell">{label}</div>
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