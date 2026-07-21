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
const MARKER_INDICES = [0, 2, 4, 6, 8, 10]; // 6 clickable month markers: Jan, Mar, May, Jul, Sep, Nov

const CHART_LEFT = 90;
const CHART_RIGHT = 890;
const CHART_STEP = (CHART_RIGHT - CHART_LEFT) / (MONTHS.length - 1);
const WAVE_X = MONTHS.map((_, i) => CHART_LEFT + i * CHART_STEP);

// Finer curve resolution: 4 points per month (48 total across the year)
// so the wave has noticeably more steps/detail than one point per month.
const STEPS_PER_MONTH = 4;
const TOTAL_STEPS = (MONTHS.length - 1) * STEPS_PER_MONTH + 1;
const FINE_X = Array.from({ length: TOTAL_STEPS }, (_, i) => {
  const t = i / (TOTAL_STEPS - 1);
  return CHART_LEFT + t * (CHART_RIGHT - CHART_LEFT);
});

function getYearPoints(yearIndex) {
  const baseY = 170 - yearIndex * 14;
  return FINE_X.map((_, i) => {
    const t = i / (TOTAL_STEPS - 1);
    const trend = t * 50;
    const wobble = Math.sin(t * Math.PI * 2.4 + yearIndex) * 22;
    const microStep = Math.sin(t * Math.PI * 16 + yearIndex * 2) * 3; // extra small steps
    return baseY - trend + wobble + microStep;
  });
}

// Map a month index (0-11) to its corresponding index in the fine point array
function monthToFineIndex(monthIndex) {
  return monthIndex * STEPS_PER_MONTH;
}

function buildWavePath(points) {
  let d = `M ${FINE_X[0]} ${points[0]}`;
  for (let i = 0; i < FINE_X.length - 1; i++) {
    const x1 = FINE_X[i] + (FINE_X[i + 1] - FINE_X[i]) / 2;
    const x2 = x1;
    d += ` C ${x1} ${points[i]}, ${x2} ${points[i + 1]}, ${FINE_X[i + 1]} ${points[i + 1]}`;
  }
  return d;
}

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();

function getCalendarYear(yearIndex) {
  return CURRENT_YEAR + yearIndex;
}

function clampPercent(pct, min = 12, max = 88) {
  return Math.min(max, Math.max(min, pct));
}

export default function CareerRoadmap() {
  const [activeYear, setActiveYear] = useState(0);
  const [activeMonth, setActiveMonth] = useState(0);
  const [hoveredMonth, setHoveredMonth] = useState(null);

  const current = MILESTONES[activeYear];
  const currentCalendarYear = getCalendarYear(activeYear);
  const points = getYearPoints(activeYear);

  function handleYearChange(i) {
    setActiveYear(i);
    setActiveMonth(0);
    setHoveredMonth(null);
  }

  const calloutMonth = hoveredMonth;
  const calloutFineIdx = calloutMonth !== null ? monthToFineIndex(calloutMonth) : null;
  const rawPct = calloutMonth !== null ? (WAVE_X[calloutMonth] / 980) * 100 : 0;
  const calloutLeftPct = clampPercent(rawPct);

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

            <div className="roadmap-wave-top">
              <div className="roadmap-wave-top-title">Your Career Roadmap</div>
              <button className="roadmap-test-btn" onClick={() => alert("Career quiz coming soon!")}>
                Take the test
              </button>
            </div>

            <div className="roadmap-wave-graph-wrap">
              <svg className="roadmap-wave-svg" viewBox="0 0 980 180" preserveAspectRatio="xMidYMid meet">
                <path d={buildWavePath(points)} className="roadmap-wave-path" fill="none" strokeWidth="4" />
                {MARKER_INDICES.map(i => {
                  const fineIdx = monthToFineIndex(i);
                  return (
                    <g
                      key={i}
                      onMouseEnter={() => setHoveredMonth(i)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      onClick={() => setActiveMonth(i)}
                      style={{ cursor: "pointer" }}
                    >
                      <line x1={WAVE_X[i]} y1={points[fineIdx]} x2={WAVE_X[i]} y2={points[fineIdx] - 30} className="roadmap-wave-stem" />
                      <circle
                        cx={WAVE_X[i]}
                        cy={points[fineIdx]}
                        r={i === activeMonth ? 11 : 7}
                        className={`roadmap-wave-dot ${i === activeMonth ? "active" : ""} ${i === hoveredMonth ? "hovered" : ""}`}
                      />
                    </g>
                  );
                })}
              </svg>

              {calloutMonth !== null && (
                <div
                  className="roadmap-wave-callout"
                  style={{ left: `${calloutLeftPct}%` }}
                >
                  <div className="roadmap-wave-callout-year">{MONTHS[calloutMonth]} {currentCalendarYear}</div>
                  <div className="roadmap-wave-callout-title">{current.title}</div>
                </div>
              )}
            </div>

            <div className="roadmap-wave-month-axis">
              {MONTHS.map((m, i) => (
                <span
                  key={i}
                  className={`roadmap-wave-month-item ${MARKER_INDICES.includes(i) ? "marker" : ""} ${i === activeMonth ? "active" : ""}`}
                  style={{ left: `${(WAVE_X[i] / 980) * 100}%` }}
                  onMouseEnter={() => MARKER_INDICES.includes(i) && setHoveredMonth(i)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  onClick={() => MARKER_INDICES.includes(i) && setActiveMonth(i)}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="roadmap-side-card">
            <div className="roadmap-side-header">
              <span className="roadmap-side-icon">🎯</span>
              <div className="roadmap-side-title">Career Focus</div>
            </div>

            <div className="roadmap-side-stage">{current.stage}</div>

            <div className="roadmap-side-progress">
              {MILESTONES.map((_, i) => (
                <span key={i} className={`roadmap-side-progress-dot ${i <= activeYear ? "filled" : ""} ${i === activeYear ? "current" : ""}`} />
              ))}
            </div>
            <div className="roadmap-side-progress-label">Year {activeYear + 1} of {MILESTONES.length}</div>
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