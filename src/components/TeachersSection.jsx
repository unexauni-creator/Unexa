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

const TEACHERS = [
  {
    id: "park",
    name: "Prof. Miniji Park",
    subject: "Medicine",
    degree: "PhD",
    bio: "Expert in public health and preventive medicine. Her research focuses on community health, epidemiology, and health policy. Passionate about creating real-world impact through education and research.",
    quote:
      "Education is not just about knowledge, it's about giving students the confidence to shape a better tomorrow.",
    image: PLACEHOLDER_IMAGES.featured,
    stats: [
      { label: "10+ years", sub: "teaching experience" },
      { label: "Published 35+", sub: "research papers" },
      { label: "Global health", sub: "research center" },
    ],
  },
  {
    id: "kim",
    name: "Prof. Jae-Hoon Kim",
    subject: "Computer Science",
    degree: "PhD",
    bio: "AI, ML and data science expert. Works on real-world projects with a focus on applied machine learning and large-scale systems.",
    quote: "The best way to learn computer science is to build something that matters.",
    image: PLACEHOLDER_IMAGES.kim,
    stats: [
      { label: "8+ years", sub: "teaching experience" },
      { label: "Published 20+", sub: "research papers" },
      { label: "AI & ML", sub: "research lab" },
    ],
  },
  {
    id: "carter",
    name: "Prof. Emily Carter",
    subject: "Business Administration",
    degree: "MBA",
    bio: "Leads in global business and leadership. Former consultant at international firms, now focused on developing the next generation of business leaders.",
    quote: "Leadership is about creating the conditions for others to succeed.",
    image: PLACEHOLDER_IMAGES.carter,
    stats: [
      { label: "12+ years", sub: "teaching experience" },
      { label: "Published 15+", sub: "case studies" },
      { label: "Global business", sub: "advisory board" },
    ],
  },
  {
    id: "lee",
    name: "Prof. Daniel Lee",
    subject: "Mechanical Engineering",
    degree: "PhD",
    bio: "Robotics and sustainable engineering. Published in top journals, with a focus on energy-efficient mechanical systems and automation.",
    quote: "Engineering is the art of solving tomorrow's problems today.",
    image: PLACEHOLDER_IMAGES.lee,
    stats: [
      { label: "9+ years", sub: "teaching experience" },
      { label: "Published 28+", sub: "research papers" },
      { label: "Robotics", sub: "research center" },
    ],
  },
  {
    id: "martinez",
    name: "Prof. Sofia Martinez",
    subject: "International Relations",
    degree: "PhD",
    bio: "Global politics, diplomacy and cross-cultural understanding. Advises on international policy and has worked with several diplomatic missions.",
    quote: "Understanding others is the first step toward a more peaceful world.",
    image: PLACEHOLDER_IMAGES.martinez,
    stats: [
      { label: "11+ years", sub: "teaching experience" },
      { label: "Published 22+", sub: "research papers" },
      { label: "Diplomacy", sub: "policy institute" },
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
        Go back to Informations
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
                  <div>
                    <div className="teachers-stat-label">{s.label}</div>
                    <div className="teachers-stat-sub">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="teachers-featured-quote">
            <span className="teachers-quote-mark">"</span>
            <p className="teachers-quote-text">{featured.quote}</p>
            <div className="teachers-quote-attribution">— {featured.name}</div>
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
              <div className="teachers-card-name">{t.name}</div>
              <div className="teachers-card-subject">{t.subject}</div>
              <p className="teachers-card-bio">{t.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}