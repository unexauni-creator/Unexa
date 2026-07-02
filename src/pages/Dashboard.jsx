import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from "recharts";

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

const radarData = [
  { subject: "Tuition", A: 72, B: 85, C: 95 },
  { subject: "Language", A: 78, B: 65, C: 90 },
  { subject: "Scholarship", A: 88, B: 70, C: 60 },
  { subject: "Duration", A: 80, B: 80, C: 80 },
  { subject: "CGPA req.", A: 75, B: 60, C: 95 },
  { subject: "Ranking", A: 90, B: 75, C: 65 },
];

const COLORS = ["#AC8876", "#7B9E87", "#7A86AC"];
const NAMES = ["Aix-Marseille", "Bordeaux", "Rennes 2"];

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
        <div className="dash-subtitle">Comparing {unis.length} universit{unis.length === 1 ? "y" : "ies"}</div>
      </div>

      {/* Radar Chart */}
      <div className="dash-section">
        <div className="dash-section-title">Overview Comparison</div>
        <div className="dash-chart-box">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(172,136,118,0.2)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontFamily: "Nunito", fontSize: 13, fill: "rgba(43,31,24,0.7)" }}
              />
              {unis.map((u, i) => (
                <Radar
                  key={u.id}
                  name={NAMES[i]}
                  dataKey={["A","B","C"][i]}
                  stroke={COLORS[i]}
                  fill={COLORS[i]}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
              <Legend
                formatter={(value) => (
                  <span style={{ fontFamily: "Nunito", fontSize: 13, color: "rgba(43,31,24,0.8)" }}>{value}</span>
                )}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* University cards header row */}
      <div className="dash-section">
        <div className="dash-section-title">Detailed Comparison</div>

        <div className="dash-compare-wrap">
          {/* Labels column */}
          <div className="dash-labels-col">
            <div className="dash-uni-header-placeholder" />
            {["Scholarship", "Submission period", "Duration of study", "Language", "Min. language", "Min. CGPA", "Tuition fees"].map(label => (
              <div key={label} className="dash-label-cell">{label}</div>
            ))}
          </div>

          {/* University columns */}
          {unis.map((u, i) => (
            <div key={u.id} className="dash-uni-col">
              {/* Header card */}
              <div className="dash-uni-card-header">
                <img src={u.image} alt={u.name} className="dash-uni-card-img" />
                <div className="dash-uni-card-info">
                  <div className="dash-uni-card-name">{u.name}</div>
                  <div className="dash-uni-card-program">{u.program}</div>
                </div>
                <button
                  className="dash-remove-btn"
                  onClick={() => setRemoved(r => [...r, u.id])}
                  title="Remove"
                >✕</button>
              </div>

              {/* Data cells */}
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