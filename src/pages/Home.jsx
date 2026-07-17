import { useState, useRef, useEffect } from "react";

const universities = [
  { id: 1, name: "Aix-Marseille Université", desc: "Marseille, France", country: "France", program: "Art Design", degree: "Bachelor", tuitionType: "Public", tuitionAmount: 8500, language: "French", certification: true, format: "On Campus", internship: true, image: "https://madeinmarseille.net/actualites-marseille/2019/04/Cube-campus-aix.jpeg" },
  { id: 2, name: "Université Bordeaux-Montaigne", desc: "Bordeaux, France", country: "France", program: "Architecture", degree: "Master", tuitionType: "Public", tuitionAmount: 7200, language: "French", certification: true, format: "On Campus", internship: false, image: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Ijba_iut_montaigne_bordeaux.jpg" },
  { id: 3, name: "Université de Franche-Comté", desc: "Besançon, France", country: "France", program: "Fine Arts", degree: "Bachelor", tuitionType: "Public", tuitionAmount: 5000, language: "French", certification: false, format: "Hybrid", internship: true, image: "https://cdn-s-www.bienpublic.com/images/AC513A2C-88A9-456D-972D-758F6975A8A9/NW_raw/le-campus-dijonnais-de-l-universite-de-bourgogne-accueille-plus-de-30-000-etudiants-photo-d-illustration-lbp-emma-buoncristiani-1690820597.jpg" },
  { id: 4, name: "Université Jean-Monnet-Saint-Étienne", desc: "Loire, France", country: "France", program: "Digital Media", degree: "Master", tuitionType: "Public", tuitionAmount: 6000, language: "French/English", certification: true, format: "On Campus", internship: true, image: "https://www.univ-st-etienne.fr/_richText-file/ametys-internal%253Asites/ujm/ametys-internal%253Acontents/plans-d-acces-2/_attribute/content/_data/Campus-Trefilerie-Pierre-Grasset.jpg" },
  { id: 5, name: "Université de Nîmes", desc: "Nîmes, France", country: "France", program: "Fashion Design", degree: "Bachelor", tuitionType: "Public", tuitionAmount: 4500, language: "French", certification: false, format: "On Campus", internship: false, image: "https://upload.wikimedia.org/wikipedia/commons/1/16/Scines_nimes.jpg" },
  { id: 6, name: "Université Rennes 2", desc: "Rennes, France", country: "France", program: "Art Design", degree: "Online Course", tuitionType: "Public", tuitionAmount: 3000, language: "French", certification: false, format: "Online", internship: false, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg/330px-Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg" },
];

const SUGGESTIONS = ["Art Design", "Architecture", "Fine Arts", "Digital Media", "Fashion Design", "France", "Master", "Bachelor", "Online Course"];
const DEGREES = ["Bachelor", "Master", "Foundation Year", "Short Course", "Summer School", "Online Course"];
const LANGUAGES = ["French", "English", "French/English", "German", "Spanish"];
const FORMATS = ["On Campus", "Hybrid", "Online"];
const COUNTRIES = ["France", "Germany", "Spain", "Italy", "United Kingdom"];
const MIN_PRICE = 0;
const MAX_PRICE = 30000;

const DEFAULT_FILTERS = {
  countries: [], degrees: [], tuitionMin: MIN_PRICE, tuitionMax: MAX_PRICE,
  languages: [], certification: null, formats: [], internship: null,
};

const NOTIFICATIONS = [
  { id: 1, type: "new", icon: "🏛️", title: "New university added!", desc: "Sciences Po Paris joined Unexa — explore their programs.", time: "2 min ago", unread: true },
  { id: 2, type: "deadline", icon: "⏰", title: "Application deadline soon", desc: "Aix-Marseille Université closes applications in 3 days.", time: "1 hour ago", unread: true },
  { id: 3, type: "new", icon: "🏛️", title: "New university added!", desc: "University of Amsterdam is now on Unexa.", time: "3 hours ago", unread: false },
  { id: 4, type: "deadline", icon: "📋", title: "Don't miss this program", desc: "Bordeaux-Montaigne Architecture applications open until April 30.", time: "Yesterday", unread: false },
  { id: 5, type: "tip", icon: "💡", title: "Complete your profile", desc: "Add your language scores to get better university matches.", time: "2 days ago", unread: false },
  { id: 6, type: "new", icon: "🏛️", title: "New university added!", desc: "TU Munich Design Faculty is now available on Unexa.", time: "3 days ago", unread: false },
];

function CheckItem({ label, checked, onChange }) {
  return (
    <div className="filter-check-item" onClick={onChange}>
      <span className="filter-check-label">{label}</span>
      <div className={`filter-checkbox ${checked ? "checked" : ""}`}>
        {checked && <img src="/tick-square.svg" alt="" className="filter-tick-icon" />}
      </div>
    </div>
  );
}

function CollapsibleSection({ title, children, selectedCount }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="filter-section">
      <button className="filter-section-header" onClick={() => setOpen(o => !o)}>
        <span className="filter-group-title">
          {title}
          {selectedCount > 0 && <span className="filter-section-badge">{selectedCount}</span>}
        </span>
        <span className={`filter-section-arrow ${open ? "open" : ""}`}>›</span>
      </button>
      {open && <div className="filter-section-body">{children}</div>}
    </div>
  );
}

function FilterPanel({ filters, setFilters, onClose, onApply, onClear }) {
  function toggle(key, value) {
    setFilters(f => ({ ...f, [key]: f[key].includes(value) ? f[key].filter(x => x !== value) : [...f[key], value] }));
  }
  const minPct = ((filters.tuitionMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const maxPct = ((filters.tuitionMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  return (
    <div className="filter-backdrop" onClick={onClose}>
      <div className="filter-panel" onClick={e => e.stopPropagation()}>
        <div className="filter-handle-bar" />
        <div className="filter-header">
          <span className="filter-title">Filters</span>
          <button className="filter-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="filter-body">
          <CollapsibleSection title="Country" selectedCount={filters.countries.length}>
            {COUNTRIES.map(c => <CheckItem key={c} label={c} checked={filters.countries.includes(c)} onChange={() => toggle("countries", c)} />)}
          </CollapsibleSection>
          <CollapsibleSection title="Degree Level" selectedCount={filters.degrees.length}>
            {DEGREES.map(d => <CheckItem key={d} label={d} checked={filters.degrees.includes(d)} onChange={() => toggle("degrees", d)} />)}
          </CollapsibleSection>

          {/* Tuition — always open, no arrow */}
          <div className="filter-section">
            <div className="filter-section-header" style={{ cursor: "default" }}>
              <span className="filter-group-title">
                Tuition Cost
                {(filters.tuitionMin > MIN_PRICE || filters.tuitionMax < MAX_PRICE) && <span className="filter-section-badge">1</span>}
              </span>
            </div>
            <div className="filter-section-body">
              <div className="filter-price-inputs">
                <div className="filter-price-box">
                  <span className="filter-price-currency">$</span>
                  <input className="filter-price-input" type="number" value={filters.tuitionMin} min={MIN_PRICE} max={filters.tuitionMax}
                    onChange={e => setFilters(f => ({ ...f, tuitionMin: Math.min(Number(e.target.value), f.tuitionMax - 500) }))} />
                </div>
                <div className="filter-price-sep">—</div>
                <div className="filter-price-box">
                  <span className="filter-price-currency">$</span>
                  <input className="filter-price-input" type="number" value={filters.tuitionMax} min={filters.tuitionMin} max={MAX_PRICE}
                    onChange={e => setFilters(f => ({ ...f, tuitionMax: Math.max(Number(e.target.value), f.tuitionMin + 500) }))} />
                </div>
              </div>
              <div className="filter-slider-wrap">
                <div className="filter-slider-track">
                  <div className="filter-slider-range" style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }} />
                </div>
                <input type="range" className="filter-slider" min={MIN_PRICE} max={MAX_PRICE} step={500} value={filters.tuitionMin}
                  onChange={e => setFilters(f => ({ ...f, tuitionMin: Math.min(Number(e.target.value), f.tuitionMax - 500) }))} />
                <input type="range" className="filter-slider" min={MIN_PRICE} max={MAX_PRICE} step={500} value={filters.tuitionMax}
                  onChange={e => setFilters(f => ({ ...f, tuitionMax: Math.max(Number(e.target.value), f.tuitionMin + 500) }))} />
              </div>
            </div>
          </div>

          <CollapsibleSection title="Language of Teaching" selectedCount={filters.languages.length}>
            {LANGUAGES.map(l => <CheckItem key={l} label={l} checked={filters.languages.includes(l)} onChange={() => toggle("languages", l)} />)}
          </CollapsibleSection>
          <CollapsibleSection title="Language Certification" selectedCount={filters.certification !== null ? 1 : 0}>
            <CheckItem label="Yes" checked={filters.certification === true} onChange={() => setFilters(f => ({ ...f, certification: f.certification === true ? null : true }))} />
            <CheckItem label="No" checked={filters.certification === false} onChange={() => setFilters(f => ({ ...f, certification: f.certification === false ? null : false }))} />
          </CollapsibleSection>
          <CollapsibleSection title="Format" selectedCount={filters.formats.length}>
            {FORMATS.map(f => <CheckItem key={f} label={f} checked={filters.formats.includes(f)} onChange={() => toggle("formats", f)} />)}
          </CollapsibleSection>
          <CollapsibleSection title="Internship" selectedCount={filters.internship !== null ? 1 : 0}>
            <CheckItem label="Yes" checked={filters.internship === true} onChange={() => setFilters(f => ({ ...f, internship: f.internship === true ? null : true }))} />
            <CheckItem label="No" checked={filters.internship === false} onChange={() => setFilters(f => ({ ...f, internship: f.internship === false ? null : false }))} />
          </CollapsibleSection>
        </div>
        <div className="filter-footer">
          <button className="filter-clear-btn" onClick={onClear}>Clear all</button>
          <button className="filter-save-btn" onClick={onApply}>Show results</button>
        </div>
      </div>
    </div>
  );
}

function NotificationPanel({ onClose }) {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unreadCount = notifications.filter(n => n.unread).length;

  function markAllRead() {
    setNotifications(n => n.map(item => ({ ...item, unread: false })));
  }

  return (
    <div className="filter-backdrop" onClick={onClose}>
      <div className="filter-panel notif-panel" onClick={e => e.stopPropagation()}>
        <div className="filter-handle-bar" />
        <div className="filter-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="filter-title">Notifications</span>
            {unreadCount > 0 && <span className="notif-count-badge">{unreadCount}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {unreadCount > 0 && <button className="notif-mark-read" onClick={markAllRead}>Mark all as read</button>}
            <button className="filter-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="filter-body notif-body">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
              <div style={{ fontFamily: "Nunito", fontWeight: 600, color: "#4a3f38" }}>No notifications yet</div>
            </div>
          ) : notifications.map(n => (
            <div key={n.id} className={`notif-item ${n.unread ? "unread" : ""}`} onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item))}>
              <div className="notif-icon">{n.icon}</div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-desc">{n.desc}</div>
                <div className="notif-time">{n.time}</div>
              </div>
              {n.unread && <div className="notif-dot" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchDropdown({ search, setSearch, onSelect, recentSearches, setRecentSearches }) {
  const suggestions = search.length > 0
    ? SUGGESTIONS.filter(s => s.toLowerCase().startsWith(search.toLowerCase()) && s.toLowerCase() !== search.toLowerCase())
    : [];
  const showDropdown = search.length === 0 ? recentSearches.length > 0 : suggestions.length > 0;

  function handleSelect(val) {
    setSearch(val);
    if (!recentSearches.includes(val)) {
      setRecentSearches(prev => [val, ...prev].slice(0, 5));
    }
    onSelect();
  }

  if (!showDropdown) return null;

  return (
    <div className="search-dropdown">
      {search.length === 0 && recentSearches.length > 0 && (
        <>
          <div className="search-dropdown-label">Recent</div>
          {recentSearches.map(r => (
            <div key={r} className="search-dropdown-item" onClick={() => handleSelect(r)}>
              <span>{r}</span>
            </div>
          ))}
        </>
      )}
      {search.length > 0 && suggestions.length > 0 && (
        <>
          <div className="search-dropdown-label">Suggestions</div>
          {suggestions.map(s => (
            <div key={s} className="search-dropdown-item" onClick={() => handleSelect(s)}>
              <span className="search-dropdown-icon">🔍</span>
              <span><strong>{search}</strong>{s.slice(search.length)}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default function Home({ onSelectUni }) {
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(["Art Design", "France", "Master"]);
  const [showFilter, setShowFilter] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [savedUnis, setSavedUnis] = useState([]);
  const [toast, setToast] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function applyFilters() { setAppliedFilters({ ...filters }); setShowFilter(false); }
  function clearFilters() { setFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); }

  function toggleSave(e, uni) {
    e.stopPropagation();
    setSavedUnis(prev => {
      const isSaved = prev.includes(uni.id);
      if (isSaved) {
        return prev.filter(id => id !== uni.id);
      }
      setToast(`${uni.name} saved to profile`);
      return [...prev, uni.id];
    });
  }

  function removeTag(key, value) {
    if (key === "tuition") {
      setAppliedFilters(f => ({ ...f, tuitionMin: MIN_PRICE, tuitionMax: MAX_PRICE }));
      setFilters(f => ({ ...f, tuitionMin: MIN_PRICE, tuitionMax: MAX_PRICE }));
    } else if (key === "certification" || key === "internship") {
      setAppliedFilters(f => ({ ...f, [key]: null }));
      setFilters(f => ({ ...f, [key]: null }));
    } else {
      setAppliedFilters(f => ({ ...f, [key]: f[key].filter(x => x !== value) }));
      setFilters(f => ({ ...f, [key]: f[key].filter(x => x !== value) }));
    }
  }

  const activeCount = [appliedFilters.countries, appliedFilters.degrees, appliedFilters.languages, appliedFilters.formats].flat().length +
    (appliedFilters.internship !== null ? 1 : 0) + (appliedFilters.certification !== null ? 1 : 0) +
    (appliedFilters.tuitionMin > MIN_PRICE || appliedFilters.tuitionMax < MAX_PRICE ? 1 : 0);

  const unreadNotifCount = NOTIFICATIONS.filter(n => n.unread).length;

  const filtered = universities.filter(u => {
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.program.toLowerCase().includes(q) && !u.country.toLowerCase().includes(q)) return false;
    if (appliedFilters.countries.length && !appliedFilters.countries.includes(u.country)) return false;
    if (appliedFilters.degrees.length && !appliedFilters.degrees.includes(u.degree)) return false;
    if (u.tuitionAmount < appliedFilters.tuitionMin || u.tuitionAmount > appliedFilters.tuitionMax) return false;
    if (appliedFilters.languages.length && !appliedFilters.languages.includes(u.language)) return false;
    if (appliedFilters.certification !== null && u.certification !== appliedFilters.certification) return false;
    if (appliedFilters.formats.length && !appliedFilters.formats.includes(u.format)) return false;
    if (appliedFilters.internship !== null && u.internship !== appliedFilters.internship) return false;
    return true;
  });

  const activeTags = [
    ...appliedFilters.countries.map(v => ({ label: v, key: "countries", value: v })),
    ...appliedFilters.degrees.map(v => ({ label: v, key: "degrees", value: v })),
    ...appliedFilters.languages.map(v => ({ label: v, key: "languages", value: v })),
    ...appliedFilters.formats.map(v => ({ label: v, key: "formats", value: v })),
    ...(appliedFilters.internship !== null ? [{ label: `Internship: ${appliedFilters.internship ? "Yes" : "No"}`, key: "internship", value: null }] : []),
    ...(appliedFilters.certification !== null ? [{ label: `Certification: ${appliedFilters.certification ? "Yes" : "No"}`, key: "certification", value: null }] : []),
    ...(appliedFilters.tuitionMin > MIN_PRICE || appliedFilters.tuitionMax < MAX_PRICE ? [{ label: `$${appliedFilters.tuitionMin.toLocaleString()} – $${appliedFilters.tuitionMax.toLocaleString()}`, key: "tuition", value: null }] : []),
  ];

  return (
    <div className="home-header">
      <h1 className="home-title">Welcome back, Kateryna</h1>
      <p className="home-desc">Discover design and art universities with Unexa. Everything you need in one place</p>

      <div className="home-search-row">
        <div className={`home-search ${searchFocused ? "active" : ""}`} ref={searchRef} style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search ......"
            className="home-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
          />
          {search.length > 0 ? (
            <button
              type="button"
              className="home-search-clear-btn"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <img src="/search-normal.svg" alt="" className="home-search-icon-svg" />
          )}
          {searchFocused && (
            <SearchDropdown
              search={search}
              setSearch={setSearch}
              recentSearches={recentSearches}
              setRecentSearches={setRecentSearches}
              onSelect={() => setSearchFocused(false)}
            />
          )}
        </div>
        <div className="home-icon-buttons">
          <button className="home-icon-btn filter-trigger" onClick={() => setShowFilter(true)}>
            <img src="/filter.svg" alt="Filter" />
            {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
          </button>
          <button className="home-icon-btn filter-trigger" onClick={() => setShowNotif(true)}>
            <img src="/notification.svg" alt="Notifications" />
            {unreadNotifCount > 0 && <span className="filter-badge">{unreadNotifCount}</span>}
          </button>
        </div>
      </div>

      {activeTags.length > 0 && (
        <div className="filter-tags-row">
          {activeTags.map(tag => (
            <span key={tag.label} className="filter-tag">
              {tag.label}
              <button className="filter-tag-remove" onClick={() => removeTag(tag.key, tag.value)}>✕</button>
            </span>
          ))}
          <button className="filter-clear-all-btn" onClick={clearFilters}>Clear all</button>
        </div>
      )}

      <div className="uni-grid">
        {filtered.length > 0 ? filtered.map(uni => {
          const isSaved = savedUnis.includes(uni.id);
          return (
            <div key={uni.id} className="uni-card-new" onClick={() => onSelectUni(uni)}>
              <img src={uni.image} alt={uni.name} className="uni-card-img" />
              <div className="uni-card-glass">
                <div className="uni-card-glass-blur" />
                <div className="uni-card-text">
                  <div className="uni-card-title">{uni.name}</div>
                  <div className="uni-card-subtitle">{uni.desc}</div>
                </div>
                <button
                  className={`uni-card-save ${isSaved ? "saved" : ""}`}
                  onClick={e => toggleSave(e, uni)}
                  aria-label={isSaved ? "Remove from profile" : "Save to profile"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        }) : (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontFamily: "Nunito", fontWeight: 600, fontSize: 16, color: "#4a3f38" }}>No universities match your filters</div>
            <button className="filter-clear-btn" style={{ marginTop: 12 }} onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </div>

      {showFilter && (
        <FilterPanel filters={filters} setFilters={setFilters}
          onClose={() => { setFilters(appliedFilters); setShowFilter(false); }}
          onApply={applyFilters} onClear={clearFilters} />
      )}

      {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}

      {toast && (
        <div className="save-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}