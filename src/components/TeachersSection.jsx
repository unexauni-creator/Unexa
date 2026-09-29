import { useState } from "react";

const PLACEHOLDER_IMAGES = {
  featured:
    "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=500&q=80",
  kim:
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
  carter:
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80",
  lee:
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
  martinez:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
};

// Three consistent icons reused across every teacher's stats row:
// years of experience, published works, and research focus/center.
const ICON_YEARS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ICON_PAPERS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ICON_CENTER = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const TEACHERS = [
  {
    id: "park",
    name: "Prof. Miniji Park",
    subject: "Medicine",
    degree: "PhD",
    bio: "Expert in public health and preventive medicine. Her research focuses on community health, epidemiology, and health policy. Passionate about creating real-world impact through education and research.",
    image: PLACEHOLDER_IMAGES.featured,
    stats: [
      { label: "10+ years", sub: "teaching experience", icon: ICON_YEARS },
      { label: "Published 35+", sub: "research papers", icon: ICON_PAPERS },
      { label: "Global health", sub: "research center", icon: ICON_CENTER },
    ],
  },
  {
    id: "kim",
    name: "Prof. Jae-Hoon Kim",
    subject: "Computer Science",
    degree: "PhD",
    bio: "AI, ML and data science expert. Works on real-world projects with a focus on applied machine learning and large-scale systems.",
    image: PLACEHOLDER_IMAGES.kim,
    stats: [
      { label: "8+ years", sub: "teaching experience", icon: ICON_YEARS },
      { label: "Published 20+", sub: "research papers", icon: ICON_PAPERS },
      { label: "AI & ML", sub: "research lab", icon: ICON_CENTER },
    ],
  },
  {
    id: "carter",
    name: "Prof. Emily Carter",
    subject: "Business Administration",
    degree: "MBA",
    bio: "Leads in global business and leadership. Former consultant at international firms, now focused on developing the next generation of business leaders.",
    image: PLACEHOLDER_IMAGES.carter,
    stats: [
      { label: "12+ years", sub: "teaching experience", icon: ICON_YEARS },
      { label: "Published 15+", sub: "case studies", icon: ICON_PAPERS },
      { label: "Global business", sub: "advisory board", icon: ICON_CENTER },
    ],
  },
  {
    id: "lee",
    name: "Prof. Daniel Lee",
    subject: "Mechanical Engineering",
    degree: "PhD",
    bio: "Robotics and sustainable engineering. Published in top journals, with a focus on energy-efficient mechanical systems and automation.",
    image: PLACEHOLDER_IMAGES.lee,
    stats: [
      { label: "9+ years", sub: "teaching experience", icon: ICON_YEARS },
      { label: "Published 28+", sub: "research papers", icon: ICON_PAPERS },
      { label: "Robotics", sub: "research center", icon: ICON_CENTER },
    ],
  },
  {
    id: "martinez",
    name: "Prof. Sofia Martinez",
    subject: "International Relations",
    degree: "PhD",
    bio: "Global politics, diplomacy and cross-cultural understanding. Advises on international policy and has worked with several diplomatic missions.",
    image: PLACEHOLDER_IMAGES.martinez,
    stats: [
      { label: "11+ years", sub: "teaching experience", icon: ICON_YEARS },
      { label: "Published 22+", sub: "research papers", icon: ICON_PAPERS },
      { label: "Diplomacy", sub: "policy institute", icon: ICON_CENTER },
    ],
  },
];

export default function TeachersSection({ onBack }) {
  const [selectedId, setSelectedId] = useState(TEACHERS[0].id);
  const featured = TEACHERS.find(t => t.id === selectedId) || TEACHERS[0];
  const otherTeachers = TEACHERS.filter(t => t.id !== selectedId);

  return (
    <div className="teachers-section">
      <button className="teachers-back-btn" onClick={onBack}>
        <img src="/arrow-left.svg" alt="" className="teachers-back-icon" />
        Go back
      </button>

      <div className="teachers-scroll">
        <div className="teachers-featured-card">
          <img
            src={featured.image}
            alt={featured.name}
            className="teachers-featured-img"
          />
          <div className="teachers-featured-info">
            <div className="teachers-featured-label">Featured Teacher</div>
            <div className="teachers-featured-name">{featured.name}</div>
            <div className="teachers-featured-subject">
              {featured.subject} · {featured.degree}
            </div>
            <p className="teachers-featured-bio">{featured.bio}</p>

            <div className="teachers-featured-stats">
              {featured.stats.map((s, i) => (
                <div className="teachers-stat" key={i}>
                  <div className="teachers-stat-icon-badge">
                    {s.icon}
                  </div>
                  <div>
                    <div className="teachers-stat-label">{s.label}</div>
                    <div className="teachers-stat-sub">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="teachers-section-heading">All teachers</div>

        <div className="teachers-grid">
          {otherTeachers.map((t) => (
            <div
              className="teachers-card"
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedId(t.id); }}
            >
              <img src={t.image} alt={t.name} className="teachers-card-img" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}