import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ScholarshipSection from "../components/ScholarshipSection";
import TeachersSection from "../components/TeachersSection";
import StudentLife from "./StudentLife";
import Dorm from "./Dorm";
import UniImage from "../components/UniImage.jsx";

const MAX_COMPARE = 4; // same limit as in App.jsx

// Розбиває "Merit Scholarship (GPA above 3.5), Grant X" на окремі пункти,
// не ламаючи текст усередині дужок
function parseScholarships(text) {
  if (!text) return [];
  return text
    .split(/,\s*(?![^(]*\))/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^(.+?)\s*\((.+)\)$/);
      if (match) {
        return { name: match[1].trim(), detail: match[2].trim() };
      }
      return { name: entry, detail: null };
    });
}

const PLACEHOLDER_IMAGES = {
  teacher:
    "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
  studentLife:
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
  dorm:
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
};

// Один інфо-блок: однакова висота для всіх, довгий текст обрізається трикрапкою,
// повний текст видно при наведенні.
function InfoItem({ label, value }) {
  const text = typeof value === "string" ? value.trim() : value;
  return (
    <div className="detail-info-item">
      <div className="detail-info-label">{label}</div>
      <div className={`detail-info-value ${text ? "" : "is-empty"}`} title={text || undefined}>
        {text || "Not specified"}
      </div>
    </div>
  );
}

export default function UniversityDetail({
  uni,
  onBack,
  savedUniversities = [],
  onToggleSave,
  comparedUniversities = [],
  onAddToCompare,
}) {
  const [activeTab, setActiveTab] = useState("info");
  const [viewingTeachers, setViewingTeachers] = useState(false);
  const [viewingStudentLife, setViewingStudentLife] = useState(false);
  const [viewingDorm, setViewingDorm] = useState(false);
  const [compareMsg, setCompareMsg] = useState(null); // null | "added" | "exists" | "full"
  const navigate = useNavigate();

  if (!uni) return null;

  const isSaved = savedUniversities.some((u) => u.id === uni.id);
  const isCompared = comparedUniversities.some((u) => u.id === uni.id);
  const scholarships = parseScholarships(uni.scholarshipsText);

  function goToDashboard() {
    setCompareMsg(null);
    onBack?.(); // close the detail view (needed when it was opened from the Dashboard itself)
    navigate("/app/dashboard");
  }

  // Adds the programme to the comparison and opens the Dashboard.
  // If the Dashboard is full (max 4), stay here and explain why.
  function handleCompare() {
    if (!isCompared && comparedUniversities.length >= MAX_COMPARE) {
      setCompareMsg("full");
      setTimeout(() => setCompareMsg(null), 5000);
      return;
    }
    if (!isCompared) onAddToCompare?.(uni);
    goToDashboard();
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
            {compareMsg === "added" && <span>✓ Added to Dashboard!</span>}
            {compareMsg === "exists" && <span>Already in your Dashboard</span>}
            {compareMsg === "full" && <span>Dashboard is full (max 4) — remove one first</span>}
            {compareMsg !== "full" && (
              <span className="compare-toast-sub">If you want to compare this university go to Dashboard</span>
            )}
          </div>
          <button
            className="compare-toast-btn"
            onClick={goToDashboard}
          >
            See →
          </button>
        </div>
      )}

      {/* ── Header row: back button + tabs. OUTSIDE the scrollable card ── */}
      <div className="detail-header-row">
        {!viewingTeachers && !viewingStudentLife && !viewingDorm && (
          <>
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
          </>
        )}
      </div>

      {/* ── Card: ONLY the scrollable content lives in here ── */}
      <div className="detail-scroll">
        <div className="detail-body">
          {/* ── INFO TAB ── */}
          {activeTab === "info" && viewingStudentLife && (
        <StudentLife onBack={() => setViewingStudentLife(false)} />
      )}
      {activeTab === "info" && viewingDorm && (
        <Dorm onBack={() => setViewingDorm(false)} />
      )}
      {activeTab === "info" && viewingTeachers && (
  <TeachersSection onBack={() => setViewingTeachers(false)} />
)}

{activeTab === "info" && !viewingTeachers && !viewingStudentLife && !viewingDorm && (
            <>
              <div className="detail-hero">
                <div className="detail-hero-left">
                  <div className="detail-name">{uni.name}</div>
                  {uni.desc && <div className="detail-university">{uni.desc}</div>}
                  <p className="detail-desc">{uni.description || "No description available yet."}</p>
                  <div className="detail-btn-group">
                    <button
                      className="detail-btn-primary"
                      onClick={() => window.open(uni.website || "#", "_blank")}
                    >
                      Official Website
                    </button>
                    <button className="detail-btn-ghost" onClick={handleCompare}>
                      {isCompared ? "✓ Compare in Dashboard" : "Compare to others"}
                    </button>
                  </div>
                </div>

                <div className="detail-hero-right">
                  <UniImage src={uni.image} name={uni.name} className="detail-hero-img" />
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

              <div className="detail-section-heading">Details for enrol</div>

              <div className="detail-details-row">
                <div className="detail-info-box">
                  <div className="detail-section-title">Required documents</div>
                  <div className="detail-info-grid">
                    <InfoItem label="Language" value={uni.documents?.language} />
                    <InfoItem label="Diploma" value={uni.documents?.diploma} />
                    <InfoItem label="Visa" value={uni.documents?.visa} />
                    <InfoItem label="Bank statement" value={uni.documents?.bankStatement} />
                  </div>
                </div>

                <div className="detail-info-box">
                  <div className="detail-section-title">Academic info</div>
                  <div className="detail-info-grid">
                    <InfoItem label="Duration" value={uni.duration} />
                    <InfoItem label="Tuition Fee" value={uni.tuition} />
                    <InfoItem label="Intake" value={uni.intake} />
                    <InfoItem label="Application Deadline" value={uni.applicationDeadline} />
                  </div>
                </div>
              </div>

              <div className="detail-details-row">
                <div className="detail-info-box">
                  <div className="detail-section-title">Candidate requirements</div>
                  <div className="detail-info-grid">
                    <InfoItem label="Submission period" value={uni.submissionPeriod} />
                    <InfoItem label="Min. language level" value={uni.minLanguageLevel} />
                    <InfoItem label="Min. CGPA" value={uni.minCGPA} />
                    <InfoItem label="Application Fee" value={uni.applicationFee} />
                  </div>
                </div>

                <div className="detail-info-box">
                  <div className="detail-section-title">Study details</div>
                  <div className="detail-info-grid">
                    <InfoItem label="Language" value={uni.language} />
                    <InfoItem label="Study Mode" value={uni.studyMode} />
                    <InfoItem label="Class Size" value={uni.classSize} />
                    <InfoItem label="Campus Facilities" value={uni.campusFacilities} />
                  </div>
                </div>
              </div>

              <div className="detail-section-heading">Teachers & social life</div>

              <div className="detail-social-row">
                <div
  className="detail-social-card"
  onClick={() => setViewingTeachers(true)}
  style={{ cursor: "pointer" }}
>
                  <div className="detail-social-stack">
                    <img
                      src={uni.teacherImage || PLACEHOLDER_IMAGES.teacher}
                      alt="Teachers"
                      className="detail-social-img"
                    />
                  </div>
                  <div className="detail-social-label">Teachers</div>
                </div>
                <div className="detail-social-card detail-social-card-clickable" onClick={() => setViewingStudentLife(true)}>
                  <div className="detail-social-stack">
                    <img
                      src={uni.studentLifeImage || PLACEHOLDER_IMAGES.studentLife}
                      alt="Student life"
                      className="detail-social-img"
                    />
                  </div>
                  <div className="detail-social-label">Student live</div>
                </div>
                <div className="detail-social-card detail-social-card-clickable" onClick={() => setViewingDorm(true)}>
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
              <div className="detail-section-title">Program Overview</div>
              <div className="detail-info-box">
                <p className="detail-desc" style={{ margin: 0, lineHeight: 1.7 }}>
                  {uni.curriculumSummary || "Detailed program information for this specialty hasn't been added yet."}
                </p>
              </div>
            </div>
          )}

          {/* ── SCHOLARSHIP TAB ── */}
          {activeTab === "scholarship" && (
            <ScholarshipSection
              scholarships={scholarships}
              heroImage={uni.image}
              programName={uni.name}
              website={uni.website}
            />
          )}
        </div>
      </div>
    </div>
  );
}