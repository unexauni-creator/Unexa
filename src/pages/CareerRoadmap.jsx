import { useState } from "react";

const MILESTONES = [
  {
    stage: "Foundation Year",
    title: "Building the Foundation",
    description: "Focus on core studies and foundational skills. This is the time to explore your field and build strong basics before specializing.",
  },
  {
    stage: "First Steps",
    title: "First Steps into the Field",
    description: "Start applying your skills through internships or entry-level roles while sharpening your practical experience.",
  },
  {
    stage: "Building Experience",
    title: "Deepening Your Craft",
    description: "Take on more responsibility, expand your network, and start shaping the direction you want your career to take.",
  },
  {
    stage: "Gaining Momentum",
    title: "Gaining Momentum",
    description: "Your experience starts compounding. This is a good time to specialize further or explore leadership opportunities.",
  },
  {
    stage: "Establishing Your Career",
    title: "Establishing Your Career",
    description: "By now you should have a clear direction, with a portfolio of experience and a defined path forward.",
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CHART_LEFT = 40;
const CHART_RIGHT = 940;
const CHART_STEP = (CHART_RIGHT - CHART_LEFT) / (MONTHS.length - 1);
const WAVE_X = MONTHS.map((_, i) => CHART_LEFT + i * CHART_STEP);

// Each year's 12 monthly points: overall upward trend within the year,
// plus each subsequent year starts a bit higher than the previous one ended.
function getYearPoints(yearIndex) {
  const baseY = 200 - yearIndex * 22; // later years sit higher up (smaller y)
  return MONTHS.map((_, m) => {
    const trend = (m / (MONTHS.length - 1)) * 55; // rises across the year
    const wobble = Math.sin((m / (MONTHS.length - 1)) * Math.PI * 2.4 + yearIndex) * 10;
    return baseY - trend + wobble;
  });
}

function buildWavePath(points) {
  let d = `M ${WAVE_X[0]} ${points[0]}`;
  for (let i = 0; i < WAVE_X.length - 1; i++) {
    const x1 = WAVE_X[i] + (WAVE_X[i + 1] - WAVE_X[i]) / 2;
    const x2 = x1;
    d += ` C ${x1} ${points[i]}, ${x2} ${points[i + 1]}, ${WAVE_X[i + 1]} ${points[i + 1]}`;
  }
  return d;
}

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth();

function getCalendarYear(yearIndex) {
  return CURRENT_YEAR + yearIndex;
}

export default function CareerRoadmap() {
  const [activeYear, setActiveYear] = useState(0);
  const [activeMonth, setActiveMonth] = useState(activeYear === 0 ? CURRENT_MONTH : 0);

  const current = MILESTONES[activeYear];
  const points = getYearPoints(activeYear);

  function handleYearChange(i) {
    setActiveYear(i);
    setActiveMonth(i === 0 ? CURRENT_MONTH : 0);
  }

  return (
    <div className="roadmap-page">
      <div className="roadmap-header">
        <div className="roadmap-title">Roadmap</div>
        <div className="roadmap-subtitle">Discover your career path with Unexa<br />Everything you need in one place</div>
      </div>

      <div className="roadmap-tabs">
        {MILESTONES.map((_, i) => (
          <button
            key={i}
            className={`roadmap-tab ${i === activeYear ? "active" : ""}`}
            onClick={() => handleYearChange(i)}
          >
            {getCalendarYear(i)}
          </button>
        ))}
      </div>

      <div className="roadmap-content">

        <div className="roadmap-top-row">
          <div className="roadmap-wave-box">
            <svg className="roadmap-wave-svg" viewBox="0 0 980 260" preserveAspectRatio="xMidYMid meet">
              <path d={buildWavePath(points)} className="roadmap-wave-path" fill="none" strokeWidth="4" />
              {WAVE_X.map((x, i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={points[i]}
                  r={i === activeMonth ? 9 : 5}
                  className={`roadmap-wave-dot ${i === activeMonth ? "active" : ""}`}
                  onClick={() => setActiveMonth(i)}
                />
              ))}
            </svg>
            <div className="roadmap-wave-month-axis">
              {MONTHS.map((m, i) => (
                <span
                  key={i}
                  className={`roadmap-wave-month-item ${i === activeMonth ? "active" : ""}`}
                  style={{ left: `${(WAVE_X[i] / 980) * 100}%` }}
                  onClick={() => setActiveMonth(i)}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="roadmap-side-card">
            <div className="roadmap-side-title">Career Focus</div>
            <div className="roadmap-side-icon">🎯</div>
            <div className="roadmap-side-stage">{current.stage}</div>
          </div>
        </div>

        <div className="roadmap-bottom-card">
          <div className="roadmap-bottom-label">{current.title}</div>
          <div className="roadmap-bottom-value">{current.description}</div>
        </div>

      </div>
    </div>
  );
}