import { useMemo } from "react";
import "../styles/scholarship-section.css";

const ICONS = {
  language: "🗣️",
  academic: "🎓",
  research: "🔬",
  general: "💰",
};

function categorize(scholarship) {
  const text = `${scholarship.name} ${scholarship.detail || ""}`.toLowerCase();
  if (text.includes("language") || text.includes("topik") || text.includes("english")) return "Language";
  if (text.includes("research") || text.includes("assistantship")) return "Research";
  if (text.includes("merit") || text.includes("academic") || text.includes("gpa")) return "Academic";
  return "General";
}

export default function ScholarshipSection({
  scholarships = [],
  heroImage,
  programName,
  website,
}) {
  const enriched = useMemo(
    () =>
      scholarships.map((s) => {
        const cat = categorize(s);
        return {
          ...s,
          category: cat,
          icon: ICONS[cat.toLowerCase()] || ICONS.general,
        };
      }),
    [scholarships]
  );

  const featured = enriched[0];

  if (scholarships.length === 0) {
    return (
      <div className="scholarship-section">
        <div className="scholarship-header">
          <div>
            <div className="scholarship-title">Scholarship programs</div>
            <div className="scholarship-subtitle">
              No scholarship information available for this specialty yet.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scholarship-section">
      <div className="scholarship-header">
        <div>
          <div className="scholarship-title">Scholarship programs</div>
          <div className="scholarship-subtitle">
            Explore scholarship programs available for {programName || "this program"}.
          </div>
        </div>
      </div>

      <div className="scholarship-layout">
        <div className="scholarship-list">
          {enriched.map((s, i) => (
            <div className="scholarship-row" key={i}>
              <div className="scholarship-row-icon">{s.icon}</div>
              <div className="scholarship-row-text">
                <div className="scholarship-row-name">{s.name}</div>
                {s.detail && <div className="scholarship-row-detail">{s.detail}</div>}
              </div>
              <button
                className="scholarship-row-btn"
                onClick={() => window.open(website || "#", "_blank")}
              >
                See more
              </button>
            </div>
          ))}
        </div>

        {featured && (
          <div
            className="scholarship-featured"
            style={{ backgroundImage: `url(${heroImage || ""})` }}
          >
            <div className="scholarship-featured-overlay" />
            <div className="scholarship-featured-content">
              <span className="scholarship-featured-badge">★ Featured</span>
              <div className="scholarship-featured-title">{featured.name}</div>
              <div className="scholarship-featured-subtitle">Learn more</div>
              <button
                className="scholarship-featured-btn"
                onClick={() => window.open(website || "#", "_blank")}
              >
                Apply now →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}