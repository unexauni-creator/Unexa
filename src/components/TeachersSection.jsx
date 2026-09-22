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

const FEATURED_TEACHER = {
  name: "Prof. Miniji Park",
  subject: "Medicine",
  degree: "PhD",
  bio: "Expert in public health and preventive medicine. Her research focuses on community health, epidemiology, and health policy. Passionate about creating real-world impact through education and research.",
  quote:
    "Education is not just about knowledge, it's about giving students the confidence to shape a better tomorrow.",
  image: PLACEHOLDER_IMAGES.featured,
  stats: [
    { icon: "🎓", label: "10+ years", sub: "teaching experience" },
    { icon: "📄", label: "Published 35+", sub: "research papers" },
    { icon: "🌐", label: "Global health", sub: "research center" },
  ],
};

const ALL_TEACHERS = [
  {
    name: "Prof. Jae-Hoon Kim",
    subject: "Computer Science",
    bio: "AI, ML and data science expert. Works on real-world projects.",
    image: PLACEHOLDER_IMAGES.kim,
  },
  {
    name: "Prof. Emily Carter",
    subject: "Business Administration",
    bio: "Leads in global business and leadership. Former consultant at international firms.",
    image: PLACEHOLDER_IMAGES.carter,
  },
  {
    name: "Prof. Daniel Lee",
    subject: "Mechanical Engineering",
    bio: "Robotics and sustainable engineering. Published in top journals.",
    image: PLACEHOLDER_IMAGES.lee,
  },
  {
    name: "Prof. Sofia Martinez",
    subject: "International Relations",
    bio: "Global politics, diplomacy and cross-cultural understanding.",
    image: PLACEHOLDER_IMAGES.martinez,
  },
];

export default function TeachersSection({ onBack }) {
  return (
    <div className="teachers-section">
      <button className="teachers-back-btn" onClick={onBack} aria-label="Back">
        <img src="/arrow-left.svg" alt="" className="teachers-back-icon" />
      </button>

      <div className="teachers-featured-card">
        <img
          src={FEATURED_TEACHER.image}
          alt={FEATURED_TEACHER.name}
          className="teachers-featured-img"
        />
        <div className="teachers-featured-info">
          <div className="teachers-featured-label">Featured Teacher</div>
          <div className="teachers-featured-name">{FEATURED_TEACHER.name}</div>
          <div className="teachers-featured-subject">
            {FEATURED_TEACHER.subject} · {FEATURED_TEACHER.degree}
          </div>
          <p className="teachers-featured-bio">{FEATURED_TEACHER.bio}</p>

          <div className="teachers-featured-stats">
            {FEATURED_TEACHER.stats.map((s, i) => (
              <div className="teachers-stat" key={i}>
                <span className="teachers-stat-icon">{s.icon}</span>
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
          <p className="teachers-quote-text">{FEATURED_TEACHER.quote}</p>
          <div className="teachers-quote-attribution">— {FEATURED_TEACHER.name}</div>
        </div>
      </div>

      <div className="teachers-section-heading">All teachers</div>

      <div className="teachers-grid">
        {ALL_TEACHERS.map((t, i) => (
          <div className="teachers-card" key={i}>
            <img src={t.image} alt={t.name} className="teachers-card-img" />
            <div className="teachers-card-name">{t.name}</div>
            <div className="teachers-card-subject">{t.subject}</div>
            <p className="teachers-card-bio">{t.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
