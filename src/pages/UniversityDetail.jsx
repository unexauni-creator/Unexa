import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DEFAULT_CURRICULUM = [
  {
    year: 1,
    label: "Foundation",
    breakLabel: "Summer Break",
    semesters: [
      {
        name: "Semester 1",
        subjects: [
          { type: "Core", name: "Introduction to Design" },
          { type: "Core", name: "Typography & Layout" },
          { type: "Elective", name: "Art History" },
        ],
      },
      {
        name: "Semester 2",
        subjects: [
          { type: "Core", name: "Digital Illustration" },
          { type: "Core", name: "Brand Identity" },
          { type: "Elective", name: "Visual Culture" },
        ],
      },
    ],
  },
  {
    year: 2,
    label: "Advanced",
    breakLabel: "Summer Break",
    semesters: [
      {
        name: "Semester 3",
        subjects: [
          { type: "Core", name: "UX Research Methods" },
          { type: "Core", name: "Motion Graphics" },
          { type: "Elective", name: "Design Theory" },
        ],
      },
      {
        name: "Semester 4",
        subjects: [
          { type: "Core", name: "Portfolio Development" },
          { type: "Core", name: "Final Project" },
          { type: "Elective", name: "Studio Practice" },
        ],
      },
    ],
  },
];

const DEFAULT_REQUIRED_DOCS = [
  { label: "Language", value: "TOPIK Level 3 (B2)" },
  { label: "High school diploma", value: "Translated to Korean" },
  { label: "Visa", value: "D-4 visa for language study" },
  { label: "Bank statement", value: "Minimum 20,000 USD/year" },
];

const DEFAULT_CANDIDATE_REQUIREMENTS = [
  { label: "Portfolio", value: "10–15 pieces, digital submission" },
  { label: "Minimum GPA", value: "3.0 / 4.0 or equivalent" },
  { label: "English proficiency", value: "IELTS 6.0 / TOEFL 80" },
  { label: "Recommendation letters", value: "2 required" },
];

const PLACEHOLDER_IMAGES = {
  teacher:
    "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
  studentLife:
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
  dorm:
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
};

export default function UniversityDetail({ uni, onBack, savedUniversities = [], onToggleSave }) {
  const [activeTab, setActiveTab] = useState("info");
  const [compareMsg, setCompareMsg] = useState(false);
  const navigate = useNavigate();

  if (!uni) return null;

  const isSaved = savedUniversities.some((u) => u.id === uni.id);
  const requiredDocs = uni.requiredDocuments?.length ? uni.requiredDocuments : DEFAULT_REQUIRED_DOCS;
  const candidateReqs = uni.candidateRequirements?.length
    ? uni.candidateRequirements
    : DEFAULT_CANDIDATE_REQUIREMENTS;
  const extraAcademic = uni.extraAcademicInfo?.length ? uni.extraAcademicInfo : null;
  const locationLabel = uni.location || uni.desc;

  function handleCompare() {
    setCompareMsg(true);
    setTimeout(() => setCompareMsg(false), 5000);
  }

  function handleToggleSave(e) {
    e.stopPropagation();
    onToggleSave?.(uni);
  }

  return (
    <div className="detail-page">
      {compareMsg && (
        <div className="compare-toast">
          <div className="compare-toast-text">
            <span>✓ Added to Dashboard!</span>
            <span className="compare-toast-sub">If you want to compare this university go to Dashboard</span>
          </div>
          <button
            className="compare-toast-btn"
            onClick={() => {
              setCompareMsg(false);
              navigate("/dashboard");
            }}
          >
            See →
          </button>
        </div>
      )}

      <div className="detail-scroll">
        <div className="detail-sticky-header">
          <button className="detail-back-btn" onClick={onBack} aria-label="Back">
            <img src="/arrow-left.svg" alt="" className="detail-back-icon" />
          </button>

          <div className="detail-tabs">
            <button
              className={`detail-tab ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              Information
            </button>
            <button
              className={`detail-tab ${activeTab === "program" ? "active" : ""}`}
              onClick={() => setActiveTab("program")}
            >
              Program
            </button>
            <button
              className={`detail-tab ${activeTab === "scholarship" ? "active" : ""}`}
              onClick={() => setActiveTab("scholarship")}
            >
              Scholarship
            </button>
          </div>
        </div>

        <div className="detail-body">
          {/* ── INFO TAB ── */}
          {activeTab === "info" && (
            <>
              <div className="detail-hero">
                <div className="detail-hero-left">
                  {uni.specialty && <div className="detail-overline">{uni.specialty}</div>}
                  <div className="detail-name">{uni.name}</div>
                  {locationLabel && <div className="detail-university">{locationLabel}</div>}
                  <p className="detail-desc">
                    {uni.description || "No description available yet."}
                  </p>
                  <div className="detail-btn-group">
                    <button
                      className="detail-btn-primary"
                      onClick={() => window.open(uni.website || "https://www.univ-amu.fr/", "_blank")}
                    >
                      Official Website
                    </button>
                    <button className="detail-btn-ghost" onClick={handleCompare}>
                      Compare to others
                    </button>
                  </div>
                </div>

                <div className="detail-hero-right">
                  <img src={uni.image} alt={uni.name} className="detail-hero-img" />
                  <div className="detail-hero-glass">
                    <div className="detail-hero-glass-blur" />
                    <div className="detail-hero-text">
                      <div className="detail-hero-card-title">{uni.specialty || uni.name}</div>
                      <div className="detail-hero-card-subtitle">{locationLabel}</div>
                    </div>
                    <button
                      className={`detail-hero-save ${isSaved ? "saved" : ""}`}
                      onClick={handleToggleSave}
                      aria-label={isSaved ? "Remove from profile" : "Save to profile"}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isSaved ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="detail-section-heading">Details for enrol</div>

              <div className="detail-details-row">
                <div className="detail-column">
                  <div className="detail-info-box">
                    <div className="detail-section-title">Required documents</div>
                    <div className="detail-info-grid">
                      {requiredDocs.map((item, i) => (
                        <div className="detail-info-item" key={i}>
                          <div className="detail-info-label">{item.label}</div>
                          <div className="detail-info-value">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-info-box">
                    <div className="detail-section-title">Candidate requirements</div>
                    <div className="detail-info-grid">
                      {candidateReqs.map((item, i) => (
                        <div className="detail-info-item" key={i}>
                          <div className="detail-info-label">{item.label}</div>
                          <div className="detail-info-value">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="detail-column">
                  <div className="detail-info-box detail-info-box-tall">
                    <div className="detail-section-title">Academic info</div>
                    <div className="detail-info-grid">
                      <div className="detail-info-item">
                        <div className="detail-info-label">Duration</div>
                        <div className="detail-info-value">{uni.duration || "4 Years"}</div>
                      </div>
                      <div className="detail-info-item">
                        <div className="detail-info-label">Tuition Fee</div>
                        <div className="detail-info-value">{uni.tuition || "$4,500 / year"}</div>
                      </div>
                      <div className="detail-info-item">
                        <div className="detail-info-label">Language</div>
                        <div className="detail-info-value">{uni.language || "Korean"}</div>
                      </div>
                      <div className="detail-info-item">
                        <div className="detail-info-label">Study Mode</div>
                        <div className="detail-info-value">{uni.studyMode || "Campus"}</div>
                      </div>
                    </div>

                    {extraAcademic && (
                      <div className="detail-info-grid detail-info-grid-secondary">
                        {extraAcademic.map((item, i) => (
                          <div className="detail-info-item" key={i}>
                            <div className="detail-info-label">{item.label}</div>
                            <div className="detail-info-value">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-section-heading">Teachers & social life</div>

              <div className="detail-social-row">
                <div className="detail-social-card">
                  <div className="detail-social-stack">
                    <img
                      src={uni.teacherImage || PLACEHOLDER_IMAGES.teacher}
                      alt="Teachers"
                      className="detail-social-img"
                    />
                  </div>
                  <div className="detail-social-label">Teachers</div>
                </div>
                <div className="detail-social-card">
                  <div className="detail-social-stack">
                    <img
                      src={uni.studentLifeImage || PLACEHOLDER_IMAGES.studentLife}
                      alt="Student life"
                      className="detail-social-img"
                    />
                  </div>
                  <div className="detail-social-label">Student live</div>
                </div>
                <div className="detail-social-card">
                  <div className="detail-social-stack">
                    <img
                      src={uni.dormImage || PLACEHOLDER_IMAGES.dorm}
                      alt="Dorm"
                      className="detail-social-img"
                    />
                  </div>
                  <div className="detail-social-label">Dorm</div>
                </div>
              </div>
            </>
          )}

          {/* ── PROGRAM TAB ── */}
          {activeTab === "program" && (
            <div className="detail-section">
              <div className="detail-section-title">Program by Year</div>

              {(uni.curriculum || DEFAULT_CURRICULUM).map((year, yIdx, arr) => (
                <div className="program-year-block" key={yIdx}>
                  <div className="program-year-header">
                    <span className="program-year-badge">Year {year.year}</span>
                    {year.label && <span className="program-year-label">{year.label}</span>}
                  </div>

                  <div className="program-semesters-row">
                    {year.semesters.map((sem, sIdx) => (
                      <div className="program-semester-card" key={sIdx}>
                        <div className="program-semester-name">{sem.name}</div>
                        <div className="program-classes">
                          {sem.subjects.map((subj, cIdx) => (
                            <div className="program-class-item" key={cIdx}>
                              <span className="program-class-time">{subj.type}</span>
                              <span className="program-class-name">{subj.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {yIdx < arr.length - 1 && (
                    <div className="program-break">
                      <span className="program-break-line" />
                      <span className="program-break-label">☀ {year.breakLabel || "Summer Break"}</span>
                      <span className="program-break-line" />
                    </div>
                  )}
                </div>
              ))}
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
    </div>
  );
}