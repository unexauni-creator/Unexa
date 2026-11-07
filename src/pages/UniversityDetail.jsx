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

// Three photos per card: the front one and two behind it (the fanned stack)
const STACK_IMAGES = {
  teachers: ["https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80"],
  studentLife: ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80"],
  dorm: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80"],
};

// A frosted-glass "polaroid": photo inset at the top, name underneath; two more cards fanned out behind it
function PhotoStack({ images, label, onClick }) {
  const [front, middle, back] = images;
  return (
    <button type="button" className="detail-social-card" onClick={onClick} aria-label={label}>
      <span className="polaroid-stack">
        <span className="polaroid polaroid-back2"><img src={back} alt="" loading="lazy" /></span>
        <span className="polaroid polaroid-back1"><img src={middle} alt="" loading="lazy" /></span>
        <span className="polaroid polaroid-front">
          <img src={front} alt="" loading="lazy" />
          <span className="polaroid-label">{label}</span>
        </span>
      </span>
    </button>
  );
}

// school's own student-life photos first, stock photos only to fill the stack
function withFallback(own, fallback) {
  const list = [...new Set((own ?? []).filter(Boolean))];
  for (const f of fallback) if (list.length < 3 && !list.includes(f)) list.push(f);
  return list.slice(0, 3);
}


// Один рядок інфо-блоку: підпис ліворуч, значення праворуч. Текст показується повністю,
// а сітка лишається рівною при будь-якій довжині тексту.
function InfoItem({ label, value }) {
  const text = typeof value === "string" ? value.trim() : value;
  return (
    <div className={`detail-info-item ${text ? "" : "is-empty"}`}>
      <div className="detail-info-label">{label}</div>
      <div className="detail-info-value">{text || "Not specified"}</div>
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
        <StudentLife uni={uni} onBack={() => setViewingStudentLife(false)} />
      )}
      {activeTab === "info" && viewingDorm && (
        <Dorm uni={uni} onBack={() => setViewingDorm(false)} />
      )}
      {activeTab === "info" && viewingTeachers && (
  <TeachersSection uni={uni} onBack={() => setViewingTeachers(false)} />
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
                  {uni.photoCredit && (
                    <a className="detail-hero-credit" href={uni.photoCredit.url} target="_blank" rel="noopener noreferrer" title={uni.photoCredit.text}>
                      Photo: {uni.photoCredit.text}
                    </a>
                  )}
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
                <PhotoStack label="Teachers" images={withFallback([uni.image, ...(uni.studentLife?.sections ?? []).filter((s) => /workshops|exhibitions/.test(s.category)).flatMap((s) => s.images ?? [])], STACK_IMAGES.teachers)} onClick={() => setViewingTeachers(true)} />
                <PhotoStack
                  label="Student life"
                  images={withFallback(uni.studentLife?.sections?.flatMap((s) => s.images ?? []), STACK_IMAGES.studentLife)}
                  onClick={() => setViewingStudentLife(true)}
                />
                <PhotoStack label="Dorm" images={withFallback([uni.universityImage], STACK_IMAGES.dorm)} onClick={() => setViewingDorm(true)} />
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