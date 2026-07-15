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
  art: { skill: "Portfolio & Design Skills", edu: "Design Foundation Studies" },
  tech: { skill: "Technical & Coding Skills", edu: "Technical Foundation Studies" },
  business: { skill: "Business & Strategy Skills", edu: "Business Foundation Studies" },
  science: { skill: "Research & Lab Skills", edu: "Research Foundation Studies" },
  education: { skill: "Teaching & Mentorship Skills", edu: "Pedagogy Foundation Studies" },
};

const WORKSTYLE_INFO = {
  company: { label: "Corporate Career Growth" },
  startup: { label: "Startup / Scale-up Growth" },
  freelance: { label: "Freelance Client Growth" },
  unsure: { label: "Exploring Opportunities" },
};

const STUDY_YEARS = { readyNow: 0, oneTwo: 2, threeFour: 3, exploring: 1 };

function generateRoadmap(answers) {
  const studyYears = Math.min(STUDY_YEARS[answers.timeline] ?? 1, 4);
  const field = FIELD_INFO[answers.field];
  const work = WORKSTYLE_INFO[answers.workStyle];
  const expStart = Math.max(2, studyYears + 1);

  return [1, 2, 3, 4, 5].map(year => {
    let title, description;
    if (year <= studyYears) {
      title = "Building the Foundation";
      description = `Focus on ${field.edu.toLowerCase()}. This is the time to build core knowledge before stepping into real-world work.`;
    } else if (year <= expStart) {
      title = "First Steps into the Field";
      description = `Start applying your skills through internships or entry-level roles while sharpening your ${field.skill.toLowerCase()}.`;
    } else if (year < 5) {
      title = "Gaining Momentum";
      description = `Deepen your experience and start shaping your path toward ${work.label.toLowerCase()}, keeping ${answers.priority} in mind.`;
    } else {
      title = "Establishing Your Career";
      description = `By now you should have a clear direction in ${work.label.toLowerCase()}, with a portfolio of experience that reflects your priorities.`;
    }
    return { year, title, description };
  });
}

const WAVE_X = [90, 290, 490, 690, 890];
const WAVE_Y = [140, 90, 140, 90, 140];

function buildWavePath() {
  let d = `M ${WAVE_X[0]} ${WAVE_Y[0]}`;
  for (let i = 0; i < WAVE_X.length - 1; i++) {
    const x1 = WAVE_X[i] + (WAVE_X[i + 1] - WAVE_X[i]) / 2;
    const x2 = x1;
    d += ` C ${x1} ${WAVE_Y[i]}, ${x2} ${WAVE_Y[i + 1]}, ${WAVE_X[i + 1]} ${WAVE_Y[i + 1]}`;
  }
  return d;
}

// ── Real calendar year / date helpers ──
const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();

function getYearDate(yearIndex) {
  // yearIndex is 1-5, matching the "Year 1..5" milestones
  const d = new Date(TODAY);
  d.setFullYear(d.getFullYear() + (yearIndex - 1));
  return d;
}

function getCalendarYear(yearIndex) {
  return CURRENT_YEAR + (yearIndex - 1);
}

function getMonthLabel(yearIndex) {
  return getYearDate(yearIndex).toLocaleDateString("en-US", { month: "short" });
}

function getDaysFromToday(yearIndex) {
  const target = getYearDate(yearIndex);
  return Math.round((target - TODAY) / (1000 * 60 * 60 * 24));
}

export default function CareerRoadmap() {
  const [stage, setStage] = useState("empty"); // empty | quiz | results
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [activeYear, setActiveYear] = useState(0);

  const currentQuestion = QUESTIONS[stepIndex];

  function handleSelect(value) {
    const updated = { ...answers, [currentQuestion.key]: value };
    setAnswers(updated);
    if (stepIndex < QUESTIONS.length - 1) {
      setTimeout(() => setStepIndex(stepIndex + 1), 220);
    } else {
      setTimeout(() => { setActiveYear(0); setStage("results"); }, 220);
    }
  }

  function handleRetake() {
    setAnswers({});
    setStepIndex(0);
    setActiveYear(0);
    setStage("empty");
  }

  // ── EMPTY STATE (shown the first time the user opens this tab) ──
  if (stage === "empty") {
    return (
      <div className="roadmap-page">
        <div className="roadmap-header">
          <div className="roadmap-title">Your Career Roadmap</div>
          <div className="roadmap-subtitle">Plan out the next 5 years, from {CURRENT_YEAR} onward.</div>
        </div>

        <div className="roadmap-empty-state">
          <img src="/career-guide.png" alt="" className="roadmap-empty-character" />
          <div className="roadmap-empty-eyebrow">Career Roadmap</div>
          <div className="roadmap-empty-title">Let's map out your next 5 years</div>
          <p className="roadmap-empty-text">
            Answer 5 quick questions about your interests, education, and work style. I'll turn your
            answers into a personalized 5-year roadmap — showing what to focus on and when, whether
            that's more study, an internship, or going freelance.
          </p>
          <button className="roadmap-empty-btn" onClick={() => setStage("quiz")}>Get Started</button>
        </div>
      </div>
    );
  }

  // ── QUIZ POPUP ──
  if (stage === "quiz") {
    return (
      <div className="roadmap-page">
        <div className="roadmap-intro-backdrop">
          <div className="roadmap-quiz-popup">
            <div className="roadmap-progress-dots">
              {QUESTIONS.map((_, i) => (
                <span key={i} className={`roadmap-dot ${i === stepIndex ? "active" : ""} ${i < stepIndex ? "done" : ""}`} />
              ))}
            </div>

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
      </div>
    );
  }

  // ── RESULTS ──
  const milestones = generateRoadmap(answers);
  const current = milestones[activeYear];
  const currentCalendarYear = getCalendarYear(current.year);

  return (
    <div className="roadmap-page">
      <div className="roadmap-header">
        <div className="roadmap-title">Your 5-Year Career Roadmap</div>
        <div className="roadmap-subtitle">
          Based on your interest in {FIELD_INFO[answers.field]?.skill.toLowerCase()} and preference for {WORKSTYLE_INFO[answers.workStyle]?.label.toLowerCase()}.
        </div>
      </div>

      <div className="roadmap-year-select-tabs">
        {milestones.map((m, i) => (
          <button
            key={i}
            className={`roadmap-year-select-tab ${i === activeYear ? "active" : ""}`}
            onClick={() => setActiveYear(i)}
          >
            {getCalendarYear(m.year)}
          </button>
        ))}
      </div>

      <div className="roadmap-wave-card">
        <svg className="roadmap-wave-svg" viewBox="0 0 980 220" preserveAspectRatio="xMidYMid meet">
          <path d={buildWavePath()} className="roadmap-wave-path" fill="none" strokeWidth="4" />
          {WAVE_X.map((x, i) => (
            <g key={i}>
              <line x1={x} y1={WAVE_Y[i]} x2={x} y2={WAVE_Y[i] - 46} className="roadmap-wave-stem" />
              <text x={x} y={WAVE_Y[i] - 56} textAnchor="middle" className="roadmap-wave-month-label">
                {getMonthLabel(i + 1)} {getCalendarYear(i + 1)}
              </text>
              <circle
                cx={x}
                cy={WAVE_Y[i]}
                r={i === activeYear ? 10 : 7}
                className={`roadmap-wave-dot ${i === activeYear ? "active" : ""}`}
                onClick={() => setActiveYear(i)}
              />
              <text x={x} y={WAVE_Y[i] + 28} textAnchor="middle" className="roadmap-wave-day-label">
                Day {getDaysFromToday(i + 1)}
              </text>
            </g>
          ))}
        </svg>

        <div className="roadmap-wave-callout" style={{ left: `${(WAVE_X[activeYear] / 980) * 100}%` }}>
          <div className="roadmap-wave-callout-year">{currentCalendarYear}</div>
          <div className="roadmap-wave-callout-title">{current.title}</div>
        </div>
      </div>

      <div className="roadmap-explain-block">
        <div className="roadmap-explain-eyebrow">Career stage · {currentCalendarYear}</div>
        <div className="roadmap-explain-title">{current.title}</div>
        <p className="roadmap-explain-text">{current.description}</p>
      </div>

      <button className="roadmap-retake-btn" onClick={handleRetake}>Retake the test</button>
    </div>
  );
}