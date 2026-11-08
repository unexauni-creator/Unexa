// A still picture of the real Unexa home, built from the app's own markup and styles.
// The landing page shows it inside a browser window (an iframe at 1440×900, scaled down),
// so it looks exactly like the app on any screen. Nothing here is interactive.
const NAV = [
  { label: "Home", icon: "/home.svg", active: true },
  { label: "Dashboard", icon: "/chart.svg" },
  { label: "Roadmap", icon: "/medal-star.svg" },
  { label: "Community", icon: "/messages.svg" },
];

const PROGRAMMES = [
  { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Paris_6_-_ENSBA_01.jpg/1280px-Paris_6_-_ENSBA_01.jpg", title: "Fine Arts (DNSAP)", school: "Beaux-arts de Paris" },
  { img: "https://www.geidai.ac.jp/english/wp-content/uploads/2024/10/H8A2884-Pano-scaled.jpg", title: "Global Arts", school: "Tokyo University of the Arts" },
  { img: "https://www.accademiavenezia.it/upload/eventi/crop/Mostra_Extra_Ordinario_Workshop_VII_Edizione.jpg", title: "Painting - Visual Arts Design", school: "Accademia di Belle Arti di Venezia" },
  { img: "https://www.risd.edu/themes/custom/risd_base_theme/src/patterns/pages/home/assets/HP_Asset_01-opt.jpg", title: "Graphic Design Bachelor's Program", school: "Rhode Island School of Design" },
  { img: "https://www.manchester.ac.uk/study/international/oxford-road-campus-shot-v2.webp", title: "Creative Writing", school: "The University of Manchester" },
  { img: "https://www.khm.de/0305947792a0a44929398403f2461c9e.slideshow/AC26_Kamoona_slideshow.jpeg?v=2", title: "Media Arts (Diploma 2)", school: "Academy of Media Arts Cologne" },
];

export default function PreviewHome() {
  return (
    <div className="app preview-still" aria-hidden="true">
      <aside className="sidebar">
        <div className="logo">Unexa</div>
        <nav className="nav-group">
          {NAV.map((n) => (
            <span key={n.label} className={`nav-item ${n.active ? "active" : ""}`}>
              <img src={n.icon} alt="" className="nav-icon" />
              <span>{n.label}</span>
            </span>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar-img">LM</div>
          <div className="user-name">Lina Moreau</div>
        </div>
      </aside>

      <main className="main">
        <div className="home-page">
          <div className="home-sticky-header">
            <h1 className="home-title">Welcome back, Lina</h1>
            <p className="home-desc">Discover design and art universities with Unexa. Everything you need in one place</p>
            <div className="home-search-row">
              <div className="home-search">
                <input type="text" readOnly placeholder="Search programs, universities, cities…" className="home-search-input" tabIndex={-1} />
                <img src="/search-normal.svg" alt="" className="home-search-icon-svg" />
              </div>
              <div className="home-icon-buttons">
                <span className="home-icon-btn"><img src="/filter.svg" alt="" /></span>
                <span className="home-icon-btn"><img src="/notification.svg" alt="" /><span className="filter-badge">2</span></span>
              </div>
            </div>
            <div className="community-tabs home-tabs">
              <span className="community-tab active">For you<span className="community-tab-count">12</span></span>
              <span className="community-tab">All programs<span className="community-tab-count">262</span></span>
            </div>
          </div>

          <div className="home-panel">
            <div className="home-scroll">
              <div className="uni-grid">
                {PROGRAMMES.map((p) => (
                  <div key={p.title} className="uni-card-new">
                    <img src={p.img} alt="" className="uni-card-img" />
                    <div className="uni-card-glass">
                      <img src={p.img} alt="" className="card-glass-photo" />
                      <div className="uni-card-glass-blur" />
                      <div className="uni-card-text">
                        <div className="uni-card-title">{p.title}</div>
                        <div className="uni-card-subtitle">{p.school}</div>
                      </div>
                      <span className="uni-card-save">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
