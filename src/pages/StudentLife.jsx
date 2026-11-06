import { useMemo, useState } from "react";

// Student life of one school, collected by the Unexa agent from the school's official website
// (universities.student_life). Nothing here is invented: each card links to its source page.
const CATEGORY = {
  clubs: { label: "Clubs & associations", short: "Clubs" },
  sports: { label: "Sport", short: "Sport" },
  events: { label: "Events & culture", short: "Events" },
  support: { label: "Student support", short: "Support" },
  housing: { label: "Housing", short: "Housing" },
  international: { label: "International students", short: "International" },
  wellbeing: { label: "Well-being", short: "Well-being" },
  facilities: { label: "Campus & facilities", short: "Campus" },
};

function CategoryIcon({ category }) {
  const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (category) {
    case "clubs": return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15 14.2c3 .2 5 2 5 4.8" /></svg>;
    case "sports": return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M4.5 9.5c3 1 5 3.5 5.5 10.3M19.5 14.5c-3-1-5-3.5-5.5-10.3" /></svg>;
    case "events": return <svg {...common}><path d="M5 20V5l8-1 6 3-6 3-8 1" /><path d="M5 20h4" /></svg>;
    case "support": return <svg {...common}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>;
    case "housing": return <svg {...common}><path d="M4 11l8-6 8 6v9H4z" /><path d="M10 20v-5h4v5" /></svg>;
    case "international": return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16" /></svg>;
    case "wellbeing": return <svg {...common}><path d="M12 21c4-3 7-6 7-10a7 7 0 0 0-14 0c0 4 3 7 7 10z" /><path d="M9 11h6M12 8v6" /></svg>;
    default: return <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 10h16M9 5v14" /></svg>;
  }
}

function SectionCard({ section }) {
  const [broken, setBroken] = useState(false);
  const meta = CATEGORY[section.category] ?? CATEGORY.facilities;
  return (
    <article className="sl-card">
      <div className={`sl-card-media ${section.image && !broken ? "" : "is-placeholder"}`}>
        {section.image && !broken ? (
          <img src={section.image} alt="" loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className="sl-card-icon"><CategoryIcon category={section.category} /></div>
        )}
        <span className="sl-card-pill">{meta.label}</span>
      </div>
      <div className="sl-card-body">
        <h3 className="sl-card-title">{section.title}</h3>
        <p className="sl-card-text">{section.text}</p>
        {section.highlights?.length > 0 && (
          <ul className="sl-card-highlights">
            {section.highlights.slice(0, 4).map((h) => <li key={h}>{h}</li>)}
          </ul>
        )}
        {section.url && (
          <a className="sl-card-link" href={section.url} target="_blank" rel="noopener noreferrer">
            Official page <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}

export default function StudentLife({ onBack, uni }) {
  const data = uni?.studentLife;
  const sections = useMemo(() => data?.sections ?? [], [data]);
  const categories = useMemo(() => [...new Set(sections.map((s) => s.category))], [sections]);
  const [active, setActive] = useState("all");
  const shown = active === "all" ? sections : sections.filter((s) => s.category === active);

  return (
    <div className="student-life-page">
      <div className="sl-top-row">
        <button className="sl-back-icon-btn" onClick={onBack} aria-label="Go back">
          <img src="/arrow-left.svg" alt="" className="sl-back-icon" />
        </button>
        <div className="sl-heading">
          <div className="sl-heading-title">Student Life</div>
          <div className="sl-heading-desc">{uni?.name ? `What studying at ${uni.name} feels like` : "Clubs, events, and campus culture."}</div>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="sl-empty">
          <div className="sl-empty-icon"><CategoryIcon category="clubs" /></div>
          <div className="sl-empty-title">We haven't collected student life for this school yet</div>
          <p className="sl-empty-text">Clubs, sport, housing and student support will appear here once our agent has read the school's official website.</p>
          {uni?.website && (
            <a className="sl-card-link" href={uni.website} target="_blank" rel="noopener noreferrer">
              Visit the official website <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      ) : (
        <>
          {data.summary && <p className="sl-summary">{data.summary}</p>}

          {categories.length > 1 && (
            <div className="sl-chips" role="tablist">
              <button role="tab" aria-selected={active === "all"} className={`sl-chip ${active === "all" ? "is-active" : ""}`} onClick={() => setActive("all")}>All</button>
              {categories.map((c) => (
                <button key={c} role="tab" aria-selected={active === c} className={`sl-chip ${active === c ? "is-active" : ""}`} onClick={() => setActive(c)}>
                  {CATEGORY[c]?.short ?? c}
                </button>
              ))}
            </div>
          )}

          <div className="sl-cards">
            {shown.map((s, i) => <SectionCard key={`${s.category}-${i}`} section={s} />)}
          </div>

          <p className="sl-source">Collected from {uni?.name}'s official website. Details can change — check the linked pages before you apply.</p>
        </>
      )}
    </div>
  );
}
