const AMENITIES = [
  { icon: "📶", label: "High-Speed WiFi" },
  { icon: "📚", label: "Study Lounges" },
  { icon: "🧺", label: "Laundry Rooms" },
  { icon: "🏋️", label: "Fitness Center" },
  { icon: "🍽️", label: "Dining Hall" },
  { icon: "🛋️", label: "Common Rooms" },
  { icon: "🛡️", label: "24/7 Security" },
  { icon: "🚲", label: "Bike Storage" },
];

const HERO_IMAGE = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80";

export default function Dorm({ onBack }) {
  return (
    <div className="dorm-page">
      <button className="dorm-back-btn" onClick={onBack} aria-label="Back">
        <img src="/arrow-left.svg" alt="" className="dorm-back-icon" />
      </button>

      <div className="dorm-hero">
        <div className="dorm-hero-text">
          <div className="dorm-hero-label">Dormitories</div>
          <div className="dorm-hero-title">Your Home on Campus</div>
          <p className="dorm-hero-sub">
            Comfortable rooms, modern facilities, and a supportive community — everything you need to feel at home.
          </p>
          <button className="dorm-explore-btn">
            Explore Rooms
            <span className="dorm-explore-arrow">→</span>
          </button>
        </div>
        <img src={HERO_IMAGE} alt="Dorm room" className="dorm-hero-img" />
      </div>

      <div className="dorm-amenities-card">
        <div className="dorm-amenities-title">Modern Amenities</div>
        <p className="dorm-amenities-sub">Live, study, and relax with everything you need.</p>
        <div className="dorm-amenities-grid">
          {AMENITIES.map(a => (
            <div key={a.label} className="dorm-amenity">
              <span className="dorm-amenity-icon">{a.icon}</span>
              <span className="dorm-amenity-label">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
