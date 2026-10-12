import { useState } from "react";

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
    text: "Join 200+ student-run clubs, from photography to debate. Find your people and build lifelong friendships.",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "sports",
    category: "Sports",
    title: "Sports & Wellness",
    text: "Stay active with campus gyms, intramural leagues, and wellness programs designed around your schedule.",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "events",
    category: "Events",
    text: "From live concerts to cultural festivals and hands-on workshops, there's always something happening on campus.",
    title: "Events & Culture",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "leadership",
    category: "Culture",
    title: "Leadership",
    text: "Develop real leadership skills through student government, peer mentoring, and project-based initiatives.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "support",
    category: "Support",
    title: "Student Support",
    text: "Confidential counseling, academic guidance, and peer support — help is always close by when you need it.",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "volunteering",
    category: "Culture",
    title: "Volunteering",
    text: "Give back through local partnerships and volunteer programs that make a real difference in the community.",
    image: "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=600&q=80",
  },
];

export default function StudentLife({ onBack }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [flippedId, setFlippedId] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [hoveringCard, setHoveringCard] = useState(false);

  const filtered = activeCategory === "All"
    ? SECTIONS
    : SECTIONS.filter(s => s.category === activeCategory);

  function handleGridMouseMove(e) {
    setCursorPos({ x: e.clientX, y: e.clientY });
  }

  return (
    <div className="student-life-page">
      <div className="sl-top-row">
        <button className="sl-back-icon-btn" onClick={onBack} aria-label="Go back">
          <img src="/arrow-left.svg" alt="" className="sl-back-icon" />
        </button>
        <div className="sl-heading">
          <div className="sl-heading-title">Student Life</div>
          <div className="sl-heading-desc">Clubs, events, and campus culture.</div>
        </div>
      </div>

      <div className="sl-grid">
        {filtered.map(section => (
          <div
            className="sl-flip-card"
            key={section.id}
            onClick={() => setFlippedId(flippedId === section.id ? null : section.id)}
          >
            <div className={`sl-flip-card-inner ${flippedId === section.id ? "flipped" : ""}`}>
              <div className="sl-flip-card-front">
                <img src={section.image} alt={section.title} className="sl-flip-card-img" />
                <div className="sl-flip-card-title">{section.title}</div>
              </div>
              <div className="sl-flip-card-back">
                <div className="sl-flip-card-back-title">{section.title}</div>
                <p className="sl-flip-card-back-text">{section.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
