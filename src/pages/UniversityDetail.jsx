import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UniversityDetail({ uni, onBack }) {
  const [activeTab, setActiveTab] = useState("info");
  const [compareMsg, setCompareMsg] = useState(false);
  const navigate = useNavigate();

  if (!uni) return null;

  function handleCompare() {
    setCompareMsg(true);
    setTimeout(() => setCompareMsg(false), 5000);
  }

  const socialItems = [
    { label: "Teachers", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80" },
    { label: "Student live", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&q=80" },
    { label: "Dorm", img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=300&q=80" },
  ];

  return (
    <div className="detail-page">

      <button className="detail-back-btn" onClick={onBack}>
        <img src="/arrow-left.svg" alt="Back" className="detail-back-icon" />
      </button>

      {compareMsg && (
        <div className="compare-toast">
          <div className="compare-toast-text">
            <span>✓ Added to Dashboard!</span>
            <span className="compare-toast-sub">If you want to compare this university go to Dashboard</span>
          </div>
          <button className="compare-toast-btn" onClick={() => { setCompareMsg(false); navigate("/dashboard"); }}>
            See →
          </button>
        </div>
      )}

      <div className="detail-tabs">
        <button className={`detail-tab ${activeTab === "info" ? "active" : ""}`} onClick={() => setActiveTab("info")}>Informations</button>
        <button className={`detail-tab ${activeTab === "program" ? "active" : ""}`} onClick={() => setActiveTab("program")}>Program</button>
        <button className={`detail-tab ${activeTab === "scholarship" ? "active" : ""}`} onClick={() => setActiveTab("scholarship")}>Scholarship</button>
      </div>

      <div className="detail-content">

        {/* ── INFO TAB ── */}
        {activeTab === "info" && (
          <>
            <div className="detail-hero">
              <div className="detail-hero-left">
                <div className="detail-hero-top">
                  <div>
                    <div className="detail-name">{uni.name}</div>
                    <div className="detail-university">{uni.desc}</div>
                  </div>
                  <div className="detail-rating">
                    <span className="detail-rating-num">{uni.rating || "4.0"}</span>
                    <span className="detail-star">★</span>
                  </div>
                </div>
                <p className="detail-desc">{uni.description || "It was founded in 1946 and is known for strong programs in engineering, business, design, medicine, and technology. The university has a large international community, offers many English-taught courses, and collaborates with hundreds of universities worldwide."}</p>
                <div className="detail-btn-group">
                  <button className="detail-btn-primary" onClick={() => window.open(uni.website || "https://www.univ-amu.fr/", "_blank")}>Official Website</button>
                  <button className="detail-btn-ghost" onClick={handleCompare}>Compare to others</button>
                </div>
              </div>
              <div className="detail-hero-right">
                <img src={uni.image} alt={uni.name} className="detail-hero-img" />
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Academic Info</div>
              <div className="detail-academic-row">
                <div className="detail-academic-item">
                  <div className="detail-academic-label">Degree</div>
                  <div className="detail-academic-value">{uni.degree || "Bachelor"}</div>
                </div>
                <div className="detail-academic-item">
                  <div className="detail-academic-label">Duration</div>
                  <div className="detail-academic-value">{uni.duration || "4 Years"}</div>
                </div>
                <div className="detail-academic-item">
                  <div className="detail-academic-label">Tuition Fee</div>
                  <div className="detail-academic-value">{uni.tuition || "$4,500 / year"}</div>
                </div>
                <div className="detail-academic-item">
                  <div className="detail-academic-label">Language</div>
                  <div className="detail-academic-value">{uni.language || "French"}</div>
                </div>
                <div className="detail-academic-item" style={{ borderRight: "none" }}>
                  <div className="detail-academic-label">Study Mode</div>
                  <div className="detail-academic-value">{uni.studyMode || "On Campus"}</div>
                </div>
              </div>
            </div>

            <div className="detail-docs-row">
              <div className="detail-docs-box">
                <div className="detail-section-title">Required documents</div>
                <div className="detail-docs-grid">
                  <div className="detail-doc-item">
                    <div className="detail-doc-label">Language</div>
                    <div className="detail-doc-value">TOPIK Level 3 (B2)</div>
                  </div>
                  <div className="detail-doc-item">
                    <div className="detail-doc-label">High school diploma</div>
                    <div className="detail-doc-value">Translated to Korean</div>
                  </div>
                  <div className="detail-doc-item">
                    <div className="detail-doc-label">Visa</div>
                    <div className="detail-doc-value">D-4 visa for language study</div>
                  </div>
                  <div className="detail-doc-item">
                    <div className="detail-doc-label">Bank statement</div>
                    <div className="detail-doc-value">Minimum 20,000 USD/year</div>
                  </div>
                </div>
              </div>
              <div className="detail-lang-box">
                <div className="detail-section-title">Take a language Test</div>
                <div className="detail-lang-emoji">🎓</div>
                <button className="detail-btn-primary" style={{ width: "100%" }} onClick={() => navigate("/language-tests")}>Check your level</button>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Teachers & social live</div>
              <div className="detail-social-row">
                {socialItems.map(item => (
                  <div key={item.label} className="social-stack-wrap">
                    <div className="social-card social-card-back2" />
                    <div className="social-card social-card-back1" />
                    <div className="social-card social-card-front">
                      <img src={item.img} alt={item.label} className="social-card-img" />
                    </div>
                    <div className="social-card-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── PROGRAM TAB ── */}
        {activeTab === "program" && (
          <div className="detail-section">
            <div className="detail-section-title">Program by Semester</div>
            <div className="program-schedule-grid">

              <div className="program-day-card">
                <div className="program-day-name">Semester 1</div>
                <div className="program-classes">
                  <div className="program-class-item"><span className="program-class-time">Core</span><span className="program-class-name">Introduction to Design</span></div>
                  <div className="program-class-item"><span className="program-class-time">Core</span><span className="program-class-name">Typography & Layout</span></div>
                  <div className="program-class-item"><span className="program-class-time">Elective</span><span className="program-class-name">Art History</span></div>
                </div>
              </div>

              <div className="program-day-card">
                <div className="program-day-name">Semester 2</div>
                <div className="program-classes">
                  <div className="program-class-item"><span className="program-class-time">Core</span><span className="program-class-name">Digital Illustration</span></div>
                  <div className="program-class-item"><span className="program-class-time">Core</span><span className="program-class-name">Brand Identity</span></div>
                  <div className="program-class-item"><span className="program-class-time">Elective</span><span className="program-class-name">Visual Culture</span></div>
                </div>
              </div>

              <div className="program-day-card">
                <div className="program-day-name">Semester 3</div>
                <div className="program-classes">
                  <div className="program-class-item"><span className="program-class-time">Core</span><span className="program-class-name">UX Research Methods</span></div>
                  <div className="program-class-item"><span className="program-class-time">Core</span><span className="program-class-name">Motion Graphics</span></div>
                  <div className="program-class-item"><span className="program-class-time">Elective</span><span className="program-class-name">Design Theory</span></div>
                </div>
              </div>

              <div className="program-day-card">
                <div className="program-day-name">Semester 4</div>
                <div className="program-classes">
                  <div className="program-class-item"><span className="program-class-time">Core</span><span className="program-class-name">Portfolio Development</span></div>
                  <div className="program-class-item"><span className="program-class-time">Core</span><span className="program-class-name">Final Project</span></div>
                  <div className="program-class-item"><span className="program-class-time">Elective</span><span className="program-class-name">Studio Practice</span></div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── SCHOLARSHIP TAB ── */}
        {activeTab === "scholarship" && (
          <div className="detail-section">
            <div className="detail-section-title">Available Scholarships</div>
            {[
              { name: "Merit Scholarship", amount: "€5,000/year", req: "GPA above 3.5" },
              { name: "International Student Grant", amount: "€3,000/year", req: "Non-EU students" },
              { name: "Need-Based Aid", amount: "Up to €8,000", req: "Financial documentation required" },
            ].map((s, i) => (
              <div key={i} className="detail-scholarship-card">
                <div>
                  <div className="detail-scholarship-name">{s.name}</div>
                  <div className="detail-scholarship-req">{s.req}</div>
                </div>
                <div className="detail-scholarship-amount">{s.amount}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}