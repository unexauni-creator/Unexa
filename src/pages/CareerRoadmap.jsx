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
const MARKER_INDICES = [0, 5, 11]; // first, 6th, last month

const CHART_LEFT = 90;
const CHART_RIGHT = 890;
const CHART_STEP = (CHART_RIGHT - CHART_LEFT) / (MONTHS.length - 1);
const WAVE_X = MONTHS.map((_, i) => CHART_LEFT + i * CHART_STEP);

// This is what ties the curve to the selected year — a NEW set of 12
// points is generated every time activeYear changes, so the shape of the
// graph itself is different for each year, and always spans that year's
// own Jan–Dec.
function getYearPoints(yearIndex) {
  const baseY = 170 - yearIndex * 14; // later years sit a bit higher overall
  return MONTHS.map((_, m) => {
    const trend = (m / (MONTHS.length - 1)) * 50;
    const wobble = Math.sin((m / (MONTHS.length - 1)) * Math.PI * 2.4 + yearIndex) * 22;
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

function getCalendarYear(yearIndex) {
  return CURRENT_YEAR + yearIndex;
}

export default function CareerRoadmap() {
  const [activeYear, setActiveYear] = useState(0);
  const [activeMonth, setActiveMonth] = useState(0);

  const current = MILESTONES[activeYear];
  const currentCalendarYear = getCalendarYear(activeYear);

  // Recomputed on every render based on activeYear — this line is what
  // makes the graph reshape when you click a different year tab.
  const points = getYearPoints(activeYear);

  function handleYearChange(i) {
    setActiveYear(i);
    setActiveMonth(0);
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
              {MARKER_INDICES.map(i => (
                <g key={i}>
                  <line x1={WAVE_X[i]} y1={points[i]} x2={WAVE_X[i]} y2={points[i] - 40} className="roadmap-wave-stem" />
                  <circle
                    cx={WAVE_X[i]}
                    cy={points[i]}
                    r={i === activeMonth ? 11 : 7}
                    className={`roadmap-wave-dot ${i === activeMonth ? "active" : ""}`}
                    onClick={() => setActiveMonth(i)}
                  />
                </g>
              ))}
            </svg>

            <div className="roadmap-wave-callout" style={{ left: `${(WAVE_X[activeMonth] / 980) * 100}%` }}>
              <div className="roadmap-wave-callout-year">{MONTHS[activeMonth]} {currentCalendarYear}</div>
              <div className="roadmap-wave-callout-title">{current.title}</div>
            </div>

            <div className="roadmap-wave-month-axis">
              {MONTHS.map((m, i) => (
                <span
                  key={i}
                  className={`roadmap-wave-month-item ${MARKER_INDICES.includes(i) ? "marker" : ""} ${i === activeMonth ? "active" : ""}`}
                  style={{ left: `${(WAVE_X[i] / 980) * 100}%` }}
                  onClick={() => MARKER_INDICES.includes(i) && setActiveMonth(i)}
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