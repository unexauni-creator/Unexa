import { useMemo, useState } from "react";
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

function extractBadge(scholarship) {
  const text = `${scholarship.detail || ""}`;
  const percentMatch = text.match(/(\d{1,3}\s?%)/);
  if (percentMatch) return percentMatch[1].replace(/\s+/, "");
  const amountMatch = text.match(/([$€£₩]?\s?[\d,]+(?:\.\d+)?\s?(?:USD|EUR|GBP|KRW)?)/i);
  if (amountMatch && /\d/.test(amountMatch[1])) return amountMatch[1].trim();
  return "Details";
}

export default function ScholarshipSection({
  scholarships = [],
  heroImage,
  programName,
  website,
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");

  const enriched = useMemo(
    () =>
      scholarships.map((s) => {
        const cat = categorize(s);
        return {
          ...s,
          category: cat,
          badge: extractBadge(s),
          icon: ICONS[cat.toLowerCase()] || ICONS.general,
        };
      }),
    [scholarships]
  );

  const categories = useMemo(() => {
    const set = new Set(enriched.map((s) => s.category));
    return ["All categories", ...Array.from(set)];
  }, [enriched]);

  const filtered = enriched.filter((s) => {
    const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All categories" || s.category === category;
    return matchesQuery && matchesCategory;
  });

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
        <div className="scholarship-controls">
          <div className="scholarship-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search scholarships..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="scholarship-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="scholarship-layout">
        <div className="scholarship-list">
          {filtered.length > 0 ? (
            filtered.map((s, i) => (
              <div className="scholarship-row" key={i}>
                <div className="scholarship-row-icon">{s.icon}</div>
                <div className="scholarship-row-text">
                  <div className="scholarship-row-name">{s.name}</div>
                  {s.detail && <div className="scholarship-row-detail">{s.detail}</div>}
                </div>
                <div className="scholarship-row-badge">{s.badge}</div>
                <div className="scholarship-row-arrow">→</div>
              </div>
            ))
          ) : (
            <div className="scholarship-empty">No scholarships match your search.</div>
          )}
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
              <div className="scholarship-featured-subtitle">
                {featured.badge !== "Details" ? featured.badge : "Learn more"}
              </div>
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
