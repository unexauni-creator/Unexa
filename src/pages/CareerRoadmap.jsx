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

// Fixed wave shape — 5 points, never changes regardless of which year is selected
const WAVE_X = [90, 290, 490, 690, 890];
const WAVE_Y = [170, 110, 170, 110, 170];

function buildWavePath() {
  let d = `M ${WAVE_X[0]} ${WAVE_Y[0]}`;
  for (let i = 0; i < WAVE_X.length - 1; i++) {
    const x1 = WAVE_X[i] + (WAVE_X[i + 1] - WAVE_X[i]) / 2;
    const x2 = x1;
    d += ` C ${x1} ${WAVE_Y[i]}, ${x2} ${WAVE_Y[i + 1]}, ${WAVE_X[i + 1]} ${WAVE_Y[i + 1]}`;
  }
  return d;
}

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();

function getCalendarYear(yearIndex) {
  return CURRENT_YEAR + yearIndex;
}

function getMonthLabel(yearIndex) {
  const d = new Date(TODAY);
  d.setFullYear(d.getFullYear() + yearIndex);
  return d.toLocaleDateString("en-US", { month: "short" });
}

export default function CareerRoadmap() {
  const [activeYear, setActiveYear] = useState(0);

  const current = MILESTONES[activeYear];
  const currentCalendarYear = getCalendarYear(activeYear);

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
            onClick={() => setActiveYear(i)}
          >
            {getCalendarYear(i)}
          </button>
        ))}
      </div>

      <div className="roadmap-content">

        <div className="roadmap-top-row">
          <div className="roadmap-wave-box">
            <svg className="roadmap-wave-svg" viewBox="0 0 980 260" preserveAspectRatio="xMidYMid meet">
              <path d={buildWavePath()} className="roadmap-wave-path" fill="none" strokeWidth="4" />
              {WAVE_X.map((x, i) => (
                <g key={i}>
                  <line x1={x} y1={WAVE_Y[i]} x2={x} y2={WAVE_Y[i] - 40} className="roadmap-wave-stem" />
                  <circle
                    cx={x}
                    cy={WAVE_Y[i]}
                    r={i === activeYear ? 11 : 7}
                    className={`roadmap-wave-dot ${i === activeYear ? "active" : ""}`}
                    onClick={() => setActiveYear(i)}
                  />
                </g>
              ))}
            </svg>

            <div className="roadmap-wave-callout" style={{ left: `${(WAVE_X[activeYear] / 980) * 100}%` }}>
              <div className="roadmap-wave-callout-year">{getMonthLabel(activeYear)} {currentCalendarYear}</div>
              <div className="roadmap-wave-callout-title">{current.title}</div>
            </div>

            <div className="roadmap-wave-month-axis">
              {WAVE_X.map((x, i) => (
                <span
                  key={i}
                  className={`roadmap-wave-month-item ${i === activeYear ? "active" : ""}`}
                  style={{ left: `${(x / 980) * 100}%` }}
                  onClick={() => setActiveYear(i)}
                >
                  {getMonthLabel(i)} {getCalendarYear(i)}
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