import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["All", "Clubs", "Events", "Sports", "Culture", "Support"];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=500&q=80",
];

const SECTIONS = [
  {
    id: "clubs",
    category: "Clubs",
    title: "Clubs & Activities",
    subtitle: "200+ student clubs",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "sports",
    category: "Sports",
    title: "Sports & Wellness",
    subtitle: "Stay active, stay healthy",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "events",
    category: "Events",
    title: "Events & Culture",
    subtitle: "Concerts, festivals, workshops",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "leadership",
    category: "Culture",
    title: "Leadership",
    subtitle: "Build your future",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "support",
    category: "Support",
    title: "Student Support",
    subtitle: "Guidance & wellbeing",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "volunteering",
    category: "Culture",
    title: "Volunteering",
    subtitle: "Make a difference",
    image: "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=600&q=80",
  },
];

export default function StudentLife() {
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  const filtered = activeCategory === "All"
    ? SECTIONS
    : SECTIONS.filter(s => s.category === activeCategory);

  return (
    <div className="student-life-page">
      <div className="sl-hero">
        <div className="sl-hero-text">
          <div className="sl-hero-title">Explore Student Life</div>
          <p className="sl-hero-sub">
            Clubs, events, sports and more. Find your people, your passion, and your place at Unexa.
          </p>
        </div>
        <div className="sl-hero-images">
          <img src={HERO_IMAGES[0]} alt="" className="sl-hero-img sl-hero-img-back" />
          <img src={HERO_IMAGES[1]} alt="" className="sl-hero-img sl-hero-img-front" />
          <div className="sl-hero-tag">
            Find your community
            <span className="sl-hero-tag-arrow">↴</span>
          </div>
        </div>
      </div>

      <div className="sl-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`sl-category-pill ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="sl-grid">
        {filtered.map(section => (
          <div key={section.id} className="sl-card" onClick={() => navigate(`/app/student-life/${section.id}`)}>
            <img src={section.image} alt={section.title} className="sl-card-img" />
            <div className="sl-card-body">
              <div className="sl-card-text">
                <div className="sl-card-title">{section.title}</div>
                <div className="sl-card-subtitle">{section.subtitle}</div>
              </div>
              <span className="sl-card-arrow">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
