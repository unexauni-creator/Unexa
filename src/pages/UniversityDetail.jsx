import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Розбиває "Merit Scholarship (GPA above 3.5), Grant X" на окремі пункти,
// не ламаючи текст усередині дужок
function parseScholarships(text) {
  if (!text) return [];
  return text
    .split(/,\s*(?![^(]*\))/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(entry => {
      const match = entry.match(/^(.+?)\s*\((.+)\)$/);
      if (match) {
        return { name: match[1].trim(), detail: match[2].trim() };
      }
      return { name: entry, detail: null };
    });
}

export default function UniversityDetail({ uni, onBack, savedUniversities = [], onToggleSave, comparedUniversities = [], onAddToCompare }) {
  const [activeTab, setActiveTab] = useState("info");
  const [compareMsg, setCompareMsg] = useState(null); // null | "added" | "exists" | "full"
  const navigate = useNavigate();

  if (!uni) return null;

  const isSaved = savedUniversities.some(u => u.id === uni.id);
  const isCompared = comparedUniversities.some(u => u.id === uni.id);
  const scholarships = parseScholarships(uni.scholarshipsText);

  function handleCompare() {
    const result = onAddToCompare?.(uni);
    setCompareMsg(result);
    setTimeout(() => setCompareMsg(null), 5000);
  }

  function handleToggleSave(e) {
    e.stopPropagation();
    onToggleSave?.(uni);
  }

  return (
    <div className="detail-page">

      <button className="detail-back-btn" onClick={onBack}>
        <img src="/arrow-left.svg" alt="Back" className="detail-back-icon" />
      </button>

      {compareMsg && (
        <div className="compare-toast">
          <div className="compare-toast-text">
            {compareMsg === "added" && <span>✓ Added to Dashboard!</span>}
            {compareMsg === "exists" && <span>Already in your Dashboard</span>}
            {compareMsg === "full" && <span>Dashboard is full (max 4) — remove one first</span>}
            {compareMsg !== "full" && (
              <span className="compare-toast-sub">If you want to compare this university go to Dashboard</span>
            )}
          </div>
          <button className="compare-toast-btn" onClick={() => { setCompareMsg(null); navigate("/dashboard"); }}>
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
                </div>
                <p className="detail-desc">{uni.description || "No description available yet."}</p>
                <div className="detail-btn-group">
                  <button className="detail-btn-primary" onClick={() => window.open(uni.website || "#", "_blank")}>Official Website</button>
                  <button className="detail-btn-ghost" onClick={handleCompare}>
                    {isCompared ? "✓ Added to compare" : "Compare to others"}
                  </button>
                </div>
              </div>
              <div className="detail-hero-right">
                <img src={uni.image} alt={uni.name} className="detail-hero-img" />
                <div className="detail-hero-glass">
                  <div className="detail-hero-glass-blur" />
                  <div className="detail-hero-text">
                    <div className="detail-hero-card-title">{uni.name}</div>
                    <div className="detail-hero-card-subtitle">{uni.desc}</div>
                  </div>
                  <button
                    className={`detail-hero-save ${isSaved ? "saved" : ""}`}
                    onClick={handleToggleSave}
                    aria-label={isSaved ? "Remove from profile" : "Save to profile"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="detail-info-row">
              <div className="detail-info-box">
                <div className="detail-section-title">Required documents</div>
                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <div className="detail-info-label">Language</div>
                    <div className="detail-info-value">{uni.documents?.language || "Not specified"}</div>
                  </div>
                  <div className="detail-info-item">
                    <div className="detail-info-label">Diploma</div>
                    <div className="detail-info-value">{uni.documents?.diploma || "Not specified"}</div>
                  </div>
                  <div className="detail-info-item">
                    <div className="detail-info-label">Visa</div>
                    <div className="detail-info-value">{uni.documents?.visa || "Not specified"}</div>
                  </div>
                  <div className="detail-info-item">
                    <div className="detail-info-label">Bank statement</div>
                    <div className="detail-info-value">{uni.documents?.bankStatement || "Not specified"}</div>
                  </div>
                </div>
              </div>

              <div className="detail-info-box">
                <div className="detail-section-title">Academic info</div>
                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <div className="detail-info-label">Duration</div>
                    <div className="detail-info-value">{uni.duration || "Not specified"}</div>
                  </div>
                  <div className="detail-info-item">
                    <div className="detail-info-label">Tuition Fee</div>
                    <div className="detail-info-value">{uni.tuition || "Not specified"}</div>
                  </div>
                  <div className="detail-info-item">
                    <div className="detail-info-label">Language</div>
                    <div className="detail-info-value">{uni.language || "Not specified"}</div>
                  </div>
                  <div className="detail-info-item">
                    <div className="detail-info-label">Study Mode</div>
                    <div className="detail-info-value">{uni.studyMode || "Not specified"}</div>
                  </div>
                </div>
              </div>
            </div>

            {(uni.submissionPeriod || uni.minLanguageLevel || uni.minCGPA) && (
              <div className="detail-info-row">
                <div className="detail-info-box" style={{ flex: 1 }}>
                  <div className="detail-section-title">Candidate requirements</div>
                  <div className="detail-info-grid">
                    <div className="detail-info-item">
                      <div className="detail-info-label">Submission period</div>
                      <div className="detail-info-value">{uni.submissionPeriod || "Not specified"}</div>
                    </div>
                    <div className="detail-info-item">
                      <div className="detail-info-label">Min. language level</div>
                      <div className="detail-info-value">{uni.minLanguageLevel || "Not specified"}</div>
                    </div>
                    <div className="detail-info-item">
                      <div className="detail-info-label">Min. CGPA</div>
                      <div className="detail-info-value">{uni.minCGPA || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PROGRAM TAB ── */}
        {activeTab === "program" && (
          <div className="detail-section">
            <div className="detail-section-title">Program Overview</div>
            {uni.curriculumSummary ? (
              <div className="detail-info-box">
                <p className="detail-desc" style={{ margin: 0, lineHeight: 1.7 }}>
                  {uni.curriculumSummary}
                </p>
              </div>
            ) : (
              <div className="detail-info-box">
                <p className="detail-desc" style={{ margin: 0 }}>
                  Detailed program information for this specialty hasn't been added yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── SCHOLARSHIP TAB ── */}
        {activeTab === "scholarship" && (
          <div className="detail-section">
            <div className="detail-section-title">Available Scholarships</div>
            {scholarships.length > 0 ? (
              scholarships.map((s, i) => (
                <div key={i} className="detail-scholarship-card">
                  <div>
                    <div className="detail-scholarship-name">{s.name}</div>
                    {s.detail && <div className="detail-scholarship-req">{s.detail}</div>}
                  </div>
                </div>
              ))
            ) : (
              <div className="detail-info-box">
                <p className="detail-desc" style={{ margin: 0 }}>
                  No scholarship information available for this specialty yet.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}