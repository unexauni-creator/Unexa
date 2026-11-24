import { rangesOf, yearWindow } from "../lib/programCalendar.js";
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

// The Program tab: what you will learn and when. The academic year as a timetable (semesters,
// holidays, exam periods), the subjects period by period, then exams, internship and final project.
// Degree, length, language and fees are on the Information tab, so they are not repeated here.
const PG_ICONS = {
  exam: <path d="M7 4h10v16H7zM10 8h4M10 12h4M10 16h2" />,
  work: <><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M9 7V5h6v2M4 12h16" /></>,
  flag: <path d="M6 20V4M6 5h11l-2 4 2 4H6" />,
};

function YearTimetable({ calendar }) {
  const win = yearWindow(calendar);
  if (!win) return null;
  const span = win.end - win.start;
  const pos = (d) => Math.min(100, Math.max(0, ((d - win.start) / span) * 100));
  const rows = [
    ["Semesters", "is-term", calendar.terms],
    ["Holidays", "is-break", calendar.breaks],
    ["Exams", "is-exam", calendar.exam_periods],
  ].filter(([, , l]) => l?.length);
  const months = Array.from({ length: 12 }, (_, i) => new Date(win.start.getFullYear(), win.start.getMonth() + i, 1));
  return (
    <div className="pg-tt">
      <div className="pg-tt-grid">
        <div className="pg-tt-months">
          {months.map((m) => <span key={m.toISOString()}>{m.toLocaleDateString("en-GB", { month: "short" })}</span>)}
        </div>
        {rows.map(([label, tone, items]) => (
          <div key={label} className="pg-tt-row">
            <div className="pg-tt-label">{label}</div>
            <div className="pg-tt-track">
              {months.map((m, i) => <i key={i} style={{ left: `${(i / 12) * 100}%` }} />)}
              {items.flatMap((it) => rangesOf(it, win.fallbackYear).map((r, k) => {
                const l = pos(r.start), w = Math.max(0.9, pos(new Date(r.end.getTime() + 86400000)) - l);
                return <span key={`${it.name}-${k}`} className={`pg-tt-bar ${tone}`} style={{ left: `${l}%`, width: `${w}%` }} title={`${it.name}: ${it.dates}`} />;
              }))}
            </div>
          </div>
        ))}
      </div>
      <div className="pg-tt-list">
        {rows.map(([label, tone, items]) => (
          <div key={label} className="pg-tt-col">
            <div className="pg-tt-col-head"><span className={`pg-tt-key ${tone}`} />{label}</div>
            {items.map((x) => <div key={`${x.name}-${x.dates}`} className="pg-tt-item"><span>{x.name}</span><em>{x.dates}</em></div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgramTab({ uni }) {
  const d = uni.programDetails;
  const cal = d?.calendar;
  const hasCal = cal && (cal.terms?.length || cal.breaks?.length || cal.exam_periods?.length);
  const notes = [["Exams", d?.exams, "exam"], ["Internship", d?.internship, "work"], ["Final project", d?.final_project, "flag"]].filter(([, v]) => v);
  return (
    <div className="pg">
      {hasCal && (
        <section className="pg-card">
          <div className="pg-card-head">
            <div className="pg-card-title">Academic year{cal.year ? ` ${cal.year}` : ""}</div>
            {cal.url && <a className="pg-link" href={cal.url} target="_blank" rel="noopener noreferrer">School calendar ↗</a>}
          </div>
          <YearTimetable calendar={cal} />
        </section>
      )}

      <div className="pg-grid">
        <section className="pg-card">
          <div className="pg-card-head">
            <div className="pg-card-title">What you'll study</div>
            {d?.url && <a className="pg-link" href={d.url} target="_blank" rel="noopener noreferrer">Programme page ↗</a>}
          </div>
          {d?.structure?.length ? (
            <div className="pg-subjects">
              {d.structure.map((p, i) => (
                <div key={`${p.period}-${i}`} className="pg-subj-row">
                  <div className="pg-subj-period">{p.period}</div>
                  <div className="pg-subj-body">
                    {p.focus && <div className="pg-subj-focus">{p.focus}</div>}
                    {p.modules.length > 0 && <ul className="pg-subj-list">{p.modules.map((m) => <li key={m}>{m}</li>)}</ul>}
                  </div>
                </div>
              ))}
              {d.electives?.length > 0 && (
                <div className="pg-subj-row">
                  <div className="pg-subj-period">Electives</div>
                  <div className="pg-subj-body"><ul className="pg-subj-list">{d.electives.map((m) => <li key={m}>{m}</li>)}</ul></div>
                </div>
              )}
            </div>
          ) : (
            <p className="pg-muted">{uni.curriculumSummary || "We haven't collected the subjects for this programme yet."}</p>
          )}
        </section>

        {notes.length > 0 && (
          <aside className="pg-card pg-notes">
            {notes.map(([label, text, icon]) => (
              <div key={label} className="pg-note">
                <div className="pg-note-title"><svg className="pg-icon" viewBox="0 0 24 24" aria-hidden="true">{PG_ICONS[icon]}</svg>{label}</div>
                <p>{text}</p>
              </div>
            ))}
          </aside>
        )}
      </div>

      <p className="pg-source">From {uni.name}'s official website. Dates and subjects can change, so check before you apply.</p>
    </div>
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
                  {uni.verifiedAt && (
                    <p className="detail-verified">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                      Checked on the official website · {new Date(uni.verifiedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                    </p>
                  )}
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
          {activeTab === "program" && <ProgramTab uni={uni} />}

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