import { useState } from "react";

const universities = [
  { id: 1, program: "Art Design", name: "London Arts University", country: "United Kingdom", tuition: "£18,000/yr", rating: 4.8, image: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=600&q=80", tags: ["Design", "Fine Arts"], description: "One of Europe's leading creative institutions, offering world-class programs in art, design, and media.", website: "https://arts.ac.uk" },
  { id: 2, program: "Architecture", name: "Cambridge University", country: "United Kingdom", tuition: "£22,000/yr", rating: 4.9, image: "https://images.unsplash.com/photo-1596496181871-9681eacf9764?w=600&q=80", tags: ["Architecture", "History"], description: "A world-renowned research university with centuries of academic excellence and innovation.", website: "https://cam.ac.uk" },
  { id: 3, program: "Interior Design", name: "Barcelona Design School", country: "Spain", tuition: "€12,000/yr", rating: 4.7, image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=600&q=80", tags: ["Design", "Interior"], description: "A vibrant creative hub in the heart of Barcelona, pioneering contemporary design education.", website: "https://example.com" },
  { id: 4, program: "Fine Arts", name: "Florence Academy", country: "Italy", tuition: "€9,500/yr", rating: 4.6, image: "https://images.unsplash.com/photo-1541844053589-346841d5db11?w=600&q=80", tags: ["Fine Arts", "Painting"], description: "Nestled in the birthplace of the Renaissance, offering immersive classical and contemporary art training.", website: "https://example.com" },
  { id: 5, program: "Digital Media", name: "TU Berlin", country: "Germany", tuition: "€5,000/yr", rating: 4.5, image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80", tags: ["Digital", "Media"], description: "A leading technical university merging technology and creativity for next-generation media makers.", website: "https://example.com" },
  { id: 6, program: "Fashion Design", name: "Parsons Paris", country: "France", tuition: "€20,000/yr", rating: 4.8, image: "https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600&q=80", tags: ["Fashion", "Design"], description: "The Paris campus of the iconic Parsons School of Design, at the center of global fashion culture.", website: "https://example.com" },
];

const reviews = [
  { id: 1, uniId: 1, author: "Sofia M.", rating: 5, text: "Amazing program, professors are incredibly supportive and the campus life is unforgettable.", avatar: "SM" },
  { id: 2, uniId: 2, rating: 4, author: "James K.", text: "Rigorous academics but the experience is worth every penny. Cambridge changed my perspective completely.", avatar: "JK" },
  { id: 3, uniId: 1, author: "Ana R.", rating: 5, text: "The portfolio I built here opened every door I tried. Highly recommend for serious designers.", avatar: "AR" },
];

const navItems = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "language", label: "Language test", icon: "🌐" },
  { id: "community", label: "Community", icon: "💬" },
];

const ACCENT = "#C4956A";
const ACCENT_LIGHT = "#f5ede4";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, #root { height: 100vh; font-family: 'DM Sans', sans-serif; background: #f0ece6; }
  .app { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: 240px; min-width: 240px; background: #faf8f5; border-right: 1px solid #e8e2da; display: flex; flex-direction: column; padding: 28px 16px; gap: 8px; position: relative; z-index: 10; }
  .logo { font-family: 'DM Serif Display', serif; font-size: 22px; color: #2c2420; padding: 0 8px 24px; letter-spacing: -0.5px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 500; color: #7a6f68; transition: all 0.18s; border: none; background: none; width: 100%; text-align: left; }
  .nav-item:hover { background: #f0ece6; color: #2c2420; }
  .nav-item.active { background: ${ACCENT_LIGHT}; color: ${ACCENT}; font-weight: 600; }
  .nav-icon { font-size: 16px; }
  .sidebar-bottom { margin-top: auto; padding: 12px 8px 0; border-top: 1px solid #e8e2da; display: flex; align-items: center; gap: 10px; }
  .avatar-sm { width: 34px; height: 34px; border-radius: 50%; background: ${ACCENT}; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
  .user-name { font-size: 13px; font-weight: 500; color: #4a3f38; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .main { flex: 1; overflow-y: auto; padding: 36px 40px; background: #f0ece6; }
  .page-title { font-family: 'DM Serif Display', serif; font-size: 32px; color: #2c2420; margin-bottom: 6px; }
  .page-subtitle { font-size: 15px; color: #9e8f86; margin-bottom: 28px; line-height: 1.5; }
  .search-row { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
  .search-wrap { flex: 1; max-width: 420px; position: relative; }
  .search-input { width: 100%; padding: 11px 16px 11px 44px; border-radius: 14px; border: 1.5px solid #e0d8d0; background: #faf8f5; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #2c2420; outline: none; transition: border-color 0.2s; }
  .search-input:focus { border-color: ${ACCENT}; }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; color: #b0a49c; }
  .icon-btn { width: 42px; height: 42px; border-radius: 14px; border: 1.5px solid #e0d8d0; background: #faf8f5; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; color: #7a6f68; transition: all 0.18s; }
  .icon-btn:hover { background: ${ACCENT_LIGHT}; border-color: ${ACCENT}; color: ${ACCENT}; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .uni-card { border-radius: 18px; overflow: hidden; cursor: pointer; position: relative; aspect-ratio: 4/3; background: #ddd; transition: transform 0.22s cubic-bezier(.22,.68,0,1.2), box-shadow 0.22s; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .uni-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 12px 32px rgba(0,0,0,0.14); }
  .uni-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s; }
  .uni-card:hover img { transform: scale(1.04); }
  .card-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px; background: linear-gradient(to top, rgba(30,22,16,0.82) 0%, rgba(30,22,16,0.55) 60%, transparent 100%); display: flex; align-items: flex-end; justify-content: space-between; }
  .card-program { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); margin-bottom: 3px; }
  .card-name { font-size: 15px; font-weight: 500; color: #fff; }
  .bookmark-btn { width: 32px; height: 32px; border-radius: 10px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; flex-shrink: 0; transition: background 0.18s; color: white; }
  .bookmark-btn:hover { background: rgba(196,149,106,0.7); }
  .bookmark-btn.saved { background: rgba(196,149,106,0.85); }
  .modal-backdrop { position: fixed; inset: 0; background: rgba(30,22,16,0.45); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 32px; animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal { background: #faf8f5; border-radius: 24px; max-width: 680px; width: 100%; max-height: 85vh; overflow-y: auto; box-shadow: 0 32px 80px rgba(0,0,0,0.22); animation: slideUp 0.25s cubic-bezier(.22,.68,0,1.2); }
  @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .modal-hero { width: 100%; height: 220px; object-fit: cover; border-radius: 24px 24px 0 0; }
  .modal-body { padding: 28px 32px 32px; }
  .modal-tag { display: inline-block; padding: 4px 10px; background: ${ACCENT_LIGHT}; color: ${ACCENT}; border-radius: 8px; font-size: 12px; font-weight: 600; margin-right: 6px; }
  .modal-title { font-family: 'DM Serif Display', serif; font-size: 26px; color: #2c2420; margin: 12px 0 4px; }
  .modal-country { font-size: 14px; color: #9e8f86; margin-bottom: 14px; }
  .modal-desc { font-size: 14px; color: #5c5048; line-height: 1.7; margin-bottom: 20px; }
  .stat-row { display: flex; gap: 16px; margin-bottom: 22px; }
  .stat-box { flex: 1; background: #f0ece6; border-radius: 14px; padding: 14px 16px; }
  .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #b0a49c; margin-bottom: 4px; }
  .stat-value { font-size: 18px; font-weight: 600; color: #2c2420; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #b0a49c; margin-bottom: 12px; }
  .review-card { background: #f5f1ec; border-radius: 14px; padding: 14px 16px; margin-bottom: 10px; }
  .review-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .avatar { width: 30px; height: 30px; border-radius: 50%; background: ${ACCENT}; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
  .review-author { font-size: 13px; font-weight: 600; color: #2c2420; }
  .stars { color: #e8a84e; font-size: 12px; }
  .review-text { font-size: 13px; color: #6b5e56; line-height: 1.6; }
  .btn-row { display: flex; gap: 10px; margin-top: 20px; }
  .btn-primary { flex: 1; padding: 13px; background: ${ACCENT}; color: white; border: none; border-radius: 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.18s, transform 0.12s; }
  .btn-primary:hover { background: #b5845a; transform: translateY(-1px); }
  .btn-secondary { flex: 1; padding: 13px; background: transparent; color: ${ACCENT}; border: 2px solid ${ACCENT}; border-radius: 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.18s; }
  .btn-secondary:hover { background: ${ACCENT_LIGHT}; }
  .close-btn { position: absolute; top: 16px; right: 16px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.85); border: none; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #4a3f38; backdrop-filter: blur(6px); }
  .compare-empty { text-align: center; padding: 60px 20px; color: #9e8f86; }
  .compare-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .compare-table { width: 100%; border-collapse: collapse; }
  .compare-table th { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #b0a49c; padding: 12px 16px; text-align: left; }
  .compare-table td { padding: 14px 16px; border-top: 1px solid #e8e2da; font-size: 14px; color: #3d332c; }
  .compare-table tr:hover td { background: #f5f1ec; }
  .compare-head { background: #faf8f5; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
  .compare-uni-name { font-family: 'DM Serif Display', serif; font-size: 16px; color: #2c2420; }
  .community-post { background: #faf8f5; border-radius: 16px; padding: 18px 20px; margin-bottom: 14px; border: 1px solid #e8e2da; }
  .post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .post-content { font-size: 14px; color: #5c5048; line-height: 1.7; }
  .post-meta { font-size: 12px; color: #b0a49c; margin-top: 10px; }
  .test-card { background: #faf8f5; border-radius: 18px; padding: 24px; margin-bottom: 14px; border: 1px solid #e8e2da; display: flex; align-items: center; gap: 18px; cursor: pointer; transition: box-shadow 0.18s; }
  .test-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .test-icon { width: 52px; height: 52px; border-radius: 14px; background: ${ACCENT_LIGHT}; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .test-name { font-size: 16px; font-weight: 600; color: #2c2420; margin-bottom: 4px; }
  .test-desc { font-size: 13px; color: #9e8f86; }
  .test-badge { margin-left: auto; padding: 6px 12px; border-radius: 10px; background: ${ACCENT_LIGHT}; color: ${ACCENT}; font-size: 12px; font-weight: 600; }
  .page-header { margin-bottom: 28px; }
  .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: #2c2420; color: white; padding: 12px 20px; border-radius: 14px; font-size: 14px; font-weight: 500; z-index: 200; animation: toastIn 0.25s ease; white-space: nowrap; }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
`;

function StarRating({ rating }) {
  return <span className="stars">{"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}</span>;
}

function UniversityCard({ uni, onOpen, saved, onSave }) {
  return (
    <div className="uni-card" onClick={() => onOpen(uni)}>
      <img src={uni.image} alt={uni.name} loading="lazy" />
      <div className="card-overlay">
        <div>
          <div className="card-program">{uni.program}</div>
          <div className="card-name">{uni.name}</div>
        </div>
        <button className={`bookmark-btn ${saved ? "saved" : ""}`} onClick={(e) => { e.stopPropagation(); onSave(uni.id); }}>
          {saved ? "🔖" : "🏷️"}
        </button>
      </div>
    </div>
  );
}

function Modal({ uni, onClose, onCompare, comparing }) {
  const uniReviews = reviews.filter(r => r.uniId === uni.id);
  const isComparing = comparing.includes(uni.id);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
        <img className="modal-hero" src={uni.image} alt={uni.name} />
        <button className="close-btn" onClick={onClose}>✕</button>
        <div className="modal-body">
          <div>{uni.tags.map(t => <span key={t} className="modal-tag">{t}</span>)}</div>
          <div className="modal-title">{uni.name}</div>
          <div className="modal-country">📍 {uni.country}</div>
          <p className="modal-desc">{uni.description}</p>
          <div className="stat-row">
            <div className="stat-box"><div className="stat-label">Tuition</div><div className="stat-value">{uni.tuition}</div></div>
            <div className="stat-box"><div className="stat-label">Rating</div><div className="stat-value">⭐ {uni.rating}</div></div>
            <div className="stat-box"><div className="stat-label">Program</div><div className="stat-value" style={{ fontSize: 14 }}>{uni.program}</div></div>
          </div>
          {uniReviews.length > 0 && (
            <>
              <div className="section-title">Student Reviews</div>
              {uniReviews.map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-header">
                    <div className="avatar">{r.avatar}</div>
                    <div><div className="review-author">{r.author}</div><StarRating rating={r.rating} /></div>
                  </div>
                  <div className="review-text">{r.text}</div>
                </div>
              ))}
            </>
          )}
          <div className="btn-row">
            <button className="btn-primary" onClick={() => window.open(uni.website, "_blank")}>🌐 Official Website</button>
            <button className="btn-secondary" onClick={() => onCompare(uni.id)}>{isComparing ? "✓ Added to compare" : "⚖️ Compare"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ universities, saved, onSave, onOpen, search, setSearch }) {
  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.program.toLowerCase().includes(search.toLowerCase()) ||
    u.country.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <div className="page-header">
        <div className="page-title">Welcome back, Kateryna!</div>
        <div className="page-subtitle">Discover design and art universities with Unexa<br />Everything you need in one place</div>
      </div>
      <div className="search-row">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search universities, programs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="icon-btn">⚙️</button>
        <button className="icon-btn">🔔</button>
      </div>
      <div className="grid">
        {filtered.map(u => <UniversityCard key={u.id} uni={u} onOpen={onOpen} saved={saved.includes(u.id)} onSave={onSave} />)}
      </div>
    </>
  );
}

function DashboardPage({ comparing, universities }) {
  const selected = universities.filter(u => comparing.includes(u.id));
  if (selected.length === 0) {
    return (
      <>
        <div className="page-header">
          <div className="page-title">Compare Dashboard</div>
          <div className="page-subtitle">Add universities to compare them side by side</div>
        </div>
        <div className="compare-empty">
          <div className="compare-empty-icon">⚖️</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#4a3f38" }}>No universities selected</div>
          <div style={{ fontSize: 14 }}>Open a university card and click "Compare" to add it here</div>
        </div>
      </>
    );
  }
  const fields = [
    { label: "Country", key: "country" },
    { label: "Program", key: "program" },
    { label: "Tuition", key: "tuition" },
    { label: "Rating", key: "rating", render: v => `⭐ ${v}` },
  ];
  return (
    <>
      <div className="page-header">
        <div className="page-title">Compare Dashboard</div>
        <div className="page-subtitle">Comparing {selected.length} universit{selected.length === 1 ? "y" : "ies"}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${selected.length}, 1fr)`, gap: 16, marginBottom: 28 }}>
        {selected.map(u => (
          <div key={u.id} className="compare-head">
            <img src={u.image} alt={u.name} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12, marginBottom: 12 }} />
            <div className="compare-uni-name">{u.name}</div>
            <div style={{ fontSize: 12, color: "#9e8f86", marginTop: 4 }}>{u.country}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#faf8f5", borderRadius: 18, overflow: "hidden", border: "1px solid #e8e2da" }}>
        <table className="compare-table">
          <thead><tr><th>Criteria</th>{selected.map(u => <th key={u.id}>{u.name}</th>)}</tr></thead>
          <tbody>
            {fields.map(f => (
              <tr key={f.label}>
                <td style={{ fontWeight: 600, color: "#9e8f86" }}>{f.label}</td>
                {selected.map(u => <td key={u.id}>{f.render ? f.render(u[f.key]) : u[f.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function LanguagePage() {
  const tests = [
    { icon: "🇬🇧", name: "IELTS", desc: "International English Language Testing System", level: "B1–C2" },
    { icon: "🇺🇸", name: "TOEFL iBT", desc: "Test of English as a Foreign Language", level: "B2–C2" },
    { icon: "🇩🇪", name: "TestDaF", desc: "Test Deutsch als Fremdsprache", level: "B2–C1" },
    { icon: "🇫🇷", name: "DELF / DALF", desc: "Diplôme d'Études en Langue Française", level: "A1–C2" },
    { icon: "🇪🇸", name: "DELE", desc: "Diplomas de Español como Lengua Extranjera", level: "A1–C2" },
  ];
  return (
    <>
      <div className="page-header">
        <div className="page-title">Language Tests</div>
        <div className="page-subtitle">Find the right language certification for your target university</div>
      </div>
      {tests.map(t => (
        <div className="test-card" key={t.name}>
          <div className="test-icon">{t.icon}</div>
          <div><div className="test-name">{t.name}</div><div className="test-desc">{t.desc}</div></div>
          <div className="test-badge">{t.level}</div>
        </div>
      ))}
    </>
  );
}

function CommunityPage() {
  const posts = [
    { id: 1, author: "Maria K.", avatar: "MK", text: "Just got accepted to London Arts University! Their portfolio requirements were tough but so worth it.", time: "2h ago", likes: 24 },
    { id: 2, author: "Tomáš P.", avatar: "TP", text: "Anyone have experience with the IELTS for Cambridge? I'm scoring 6.5 in practice tests and need 7.0.", time: "5h ago", likes: 11 },
    { id: 3, author: "Sofia R.", avatar: "SR", text: "Comparing Florence Academy vs Barcelona Design School for Interior Design. Has anyone attended either?", time: "1d ago", likes: 38 },
    { id: 4, author: "Yuki L.", avatar: "YL", text: "Pro tip: apply to German universities! TU Berlin has incredible programs and tuition is super affordable.", time: "2d ago", likes: 57 },
  ];
  return (
    <>
      <div className="page-header">
        <div className="page-title">Community</div>
        <div className="page-subtitle">Connect with students on the same journey</div>
      </div>
      {posts.map(p => (
        <div className="community-post" key={p.id}>
          <div className="post-header">
            <div className="avatar">{p.avatar}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#2c2420" }}>{p.author}</div>
          </div>
          <div className="post-content">{p.text}</div>
          <div className="post-meta">❤️ {p.likes} likes · {p.time}</div>
        </div>
      ))}
    </>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedUni, setSelectedUni] = useState(null);
  const [saved, setSaved] = useState([]);
  const [comparing, setComparing] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  function handleSave(id) {
    setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    showToast(saved.includes(id) ? "Removed from saved" : "Saved! ✓");
  }

  function handleCompare(id) {
    setComparing(c => {
      if (c.includes(id)) return c.filter(x => x !== id);
      if (c.length >= 3) { showToast("Max 3 universities to compare"); return c; }
      showToast("Added to compare ✓");
      return [...c, id];
    });
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="logo">Unexa</div>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.id === "dashboard" && comparing.length > 0 && (
                <span style={{ marginLeft: "auto", background: ACCENT, color: "white", borderRadius: 8, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{comparing.length}</span>
              )}
            </button>
          ))}
          <div className="sidebar-bottom">
            <div className="avatar-sm">KD</div>
            <div className="user-name">Kateryna Dmyt...</div>
          </div>
        </aside>
        <main className="main">
          {page === "home" && <HomePage universities={universities} saved={saved} onSave={handleSave} onOpen={setSelectedUni} search={search} setSearch={setSearch} />}
          {page === "dashboard" && <DashboardPage comparing={comparing} universities={universities} />}
          {page === "language" && <LanguagePage />}
          {page === "community" && <CommunityPage />}
        </main>
      </div>
      {selectedUni && <Modal uni={selectedUni} onClose={() => setSelectedUni(null)} onCompare={handleCompare} comparing={comparing} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}