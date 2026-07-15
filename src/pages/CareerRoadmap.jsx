import { useState } from "react";

const QUESTIONS = [
  {
    key: "field",
    question: "What field are you most drawn to?",
    options: [
      { value: "art", label: "Art & Design" },
      { value: "tech", label: "Technology" },
      { value: "business", label: "Business" },
      { value: "science", label: "Science & Research" },
      { value: "education", label: "Education & Social Impact" },
    ],
  },
  {
    key: "education",
    question: "What's your current education level?",
    options: [
      { value: "highschool", label: "High school student" },
      { value: "bachelor_progress", label: "Bachelor's in progress" },
      { value: "bachelor_done", label: "Bachelor's completed" },
      { value: "master", label: "Master's / PhD" },
    ],
  },
  {
    key: "workStyle",
    question: "How do you see yourself working long-term?",
    options: [
      { value: "company", label: "Big company" },
      { value: "startup", label: "Startup" },
      { value: "freelance", label: "Freelance / self-employed" },
      { value: "unsure", label: "Not sure yet" },
    ],
  },
  {
    key: "priority",
    question: "What matters most to you in a career?",
    options: [
      { value: "stability", label: "Stability" },
      { value: "income", label: "High income" },
      { value: "freedom", label: "Creative freedom" },
      { value: "balance", label: "Work-life balance" },
    ],
  },
  {
    key: "timeline",
    question: "How much more study are you planning before working full-time?",
    options: [
      { value: "readyNow", label: "Ready to start now" },
      { value: "oneTwo", label: "1–2 years left" },
      { value: "threeFour", label: "3–4 years left" },
      { value: "exploring", label: "Still exploring" },
    ],
  },
];

const FIELD_INFO = {
  art: { skill: "Portfolio & Design Skills", edu: "Design Foundation Studies", color: "#AC8876" },
  tech: { skill: "Technical & Coding Skills", edu: "Technical Foundation Studies", color: "#AC8876" },
  business: { skill: "Business & Strategy Skills", edu: "Business Foundation Studies", color: "#AC8876" },
  science: { skill: "Research & Lab Skills", edu: "Research Foundation Studies", color: "#AC8876" },
  education: { skill: "Teaching & Mentorship Skills", edu: "Pedagogy Foundation Studies", color: "#AC8876" },
};

const WORKSTYLE_INFO = {
  company: { label: "Corporate Career Growth", color: "#9B8AA5" },
  startup: { label: "Startup / Scale-up Growth", color: "#9B8AA5" },
  freelance: { label: "Freelance Client Growth", color: "#9B8AA5" },
  unsure: { label: "Exploring Opportunities", color: "#9B8AA5" },
};

const STUDY_YEARS = { readyNow: 0, oneTwo: 2, threeFour: 3, exploring: 1 };

function generateRoadmap(answers) {
  const studyYears = Math.min(STUDY_YEARS[answers.timeline] ?? 1, 4);
  const field = FIELD_INFO[answers.field];
  const work = WORKSTYLE_INFO[answers.workStyle];

  const tracks = [];

  if (studyYears > 0) {
    tracks.push({ label: field.edu, color: field.color, startYear: 1, endYear: studyYears });
  }

  const skillStart = Math.max(1, studyYears);
  const skillEnd = Math.min(5, skillStart + 2);
  tracks.push({ label: field.skill, color: "#7B9E87", startYear: skillStart, endYear: skillEnd });

  const expStart = Math.max(2, studyYears + 1);
  tracks.push({ label: "Internship / Junior Experience", color: "#C4956A", startYear: expStart, endYear: Math.min(5, expStart + 1) });

  const growthStart = Math.max(3, expStart);
  tracks.push({ label: work.label, color: work.color, startYear: growthStart, endYear: 5 });

  const yearBreakdown = [1, 2, 3, 4, 5].map(year => {
    let title, description;
    if (year <= studyYears) {
      title = `Year ${year} — Building the Foundation`;
      description = `Focus on ${field.edu.toLowerCase()}. This is the time to build core knowledge before stepping into real-world work.`;
    } else if (year <= expStart) {
      title = `Year ${year} — First Steps into the Field`;
      description = `Start applying your skills through internships or entry-level roles while sharpening your ${field.skill.toLowerCase()}.`;
    } else if (year < 5) {
      title = `Year ${year} — Gaining Momentum`;
      description = `Deepen your experience and start shaping your path toward ${work.label.toLowerCase()}, keeping ${answers.priority} in mind.`;
    } else {
      title = `Year ${year} — Establishing Your Career`;
      description = `By now you should have a clear direction in ${work.label.toLowerCase()}, with a portfolio of experience that reflects your priorities.`;
    }
    return { year, title, description };
  });

  return { tracks, yearBreakdown };
}

export default function CareerRoadmap() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = QUESTIONS[stepIndex];

  function handleSelect(value) {
    const updated = { ...answers, [currentQuestion.key]: value };
    setAnswers(updated);

    if (stepIndex < QUESTIONS.length - 1) {
      setTimeout(() => setStepIndex(stepIndex + 1), 220);
    } else {
      setTimeout(() => setShowResults(true), 220);
    }
  }

  function handleRetake() {
    setAnswers({});
    setStepIndex(0);
    setShowResults(false);
  }

  if (showResults) {
    const { tracks, yearBreakdown } = generateRoadmap(answers);
    const years = [1, 2, 3, 4, 5];

    return (
      <div className="roadmap-page">
        <div className="roadmap-header">
          <div className="roadmap-title">Your 5-Year Career Roadmap</div>
          <div className="roadmap-subtitle">
            Based on your interest in {FIELD_INFO[answers.field]?.skill.toLowerCase()} and preference for {WORKSTYLE_INFO[answers.workStyle]?.label.toLowerCase()}.
          </div>
        </div>

        <div className="roadmap-gantt">
          <div className="roadmap-gantt-years">
            <div className="roadmap-gantt-label-spacer" />
            {years.map(y => (
              <div className="roadmap-gantt-year-col" key={y}>Year {y}</div>
            ))}
          </div>

          {tracks.map((t, i) => (
            <div className="roadmap-gantt-row" key={i}>
              <div className="roadmap-gantt-label">{t.label}</div>
              <div className="roadmap-gantt-track">
                <div
                  className="roadmap-gantt-bar"
                  style={{
                    left: `${((t.startYear - 1) / 5) * 100}%`,
                    width: `${((t.endYear - t.startYear + 1) / 5) * 100}%`,
                    background: t.color,
                  }}
                >
                  {t.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="roadmap-breakdown">
          {yearBreakdown.map(yb => (
            <div className="roadmap-year-card" key={yb.year}>
              <div className="roadmap-year-num">{yb.year}</div>
              <div className="roadmap-year-content">
                <div className="roadmap-year-title">{yb.title}</div>
                <div className="roadmap-year-desc">{yb.description}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="roadmap-retake-btn" onClick={handleRetake}>Retake the test</button>
      </div>
    );
  }

  return (
    <div className="roadmap-page">
      <div className="roadmap-header">
        <div className="roadmap-title">Career Roadmap</div>
        <div className="roadmap-subtitle">Answer a few quick questions and get a personalized 5-year career plan.</div>
      </div>

      <div className="roadmap-progress-dots">
        {QUESTIONS.map((_, i) => (
          <span key={i} className={`roadmap-dot ${i === stepIndex ? "active" : ""} ${i < stepIndex ? "done" : ""}`} />
        ))}
      </div>

      <div className="roadmap-quiz-card">
        <div className="roadmap-quiz-question">{currentQuestion.question}</div>
        <div className="roadmap-quiz-options">
          {currentQuestion.options.map(opt => (
            <button
              key={opt.value}
              className={`roadmap-quiz-option ${answers[currentQuestion.key] === opt.value ? "selected" : ""}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}