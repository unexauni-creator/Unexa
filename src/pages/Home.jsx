import { useState } from "react";

const universities = [
  { id: 1, name: "Aix-Marseille Université", desc: "Marseille, France", country: "France", program: "Art Design", degree: "Bachelor", tuitionType: "Public", tuitionAmount: 8500, language: "French", certification: true, deadline: "March 2026", format: "On Campus", internship: true, image: "https://madeinmarseille.net/actualites-marseille/2019/04/Cube-campus-aix.jpeg" },
  { id: 2, name: "Université Bordeaux-Montaigne", desc: "Bordeaux, France", country: "France", program: "Architecture", degree: "Master", tuitionType: "Public", tuitionAmount: 7200, language: "French", certification: true, deadline: "April 2026", format: "On Campus", internship: false, image: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Ijba_iut_montaigne_bordeaux.jpg" },
  { id: 3, name: "Université de Franche-Comté", desc: "Besançon, France", country: "France", program: "Fine Arts", degree: "Bachelor", tuitionType: "Public", tuitionAmount: 5000, language: "French", certification: false, deadline: "May 2026", format: "Hybrid", internship: true, image: "https://cdn-s-www.bienpublic.com/images/AC513A2C-88A9-456D-972D-758F6975A8A9/NW_raw/le-campus-dijonnais-de-l-universite-de-bourgogne-accueille-plus-de-30-000-etudiants-photo-d-illustration-lbp-emma-buoncristiani-1690820597.jpg" },
  { id: 4, name: "Université Jean-Monnet-Saint-Étienne", desc: "Loire, France", country: "France", program: "Digital Media", degree: "Master", tuitionType: "Public", tuitionAmount: 6000, language: "French/English", certification: true, deadline: "March 2026", format: "On Campus", internship: true, image: "https://www.univ-st-etienne.fr/_richText-file/ametys-internal%253Asites/ujm/ametys-internal%253Acontents/plans-d-acces-2/_attribute/content/_data/Campus-Trefilerie-Pierre-Grasset.jpg" },
  { id: 5, name: "Université de Nîmes", desc: "Nîmes, France", country: "France", program: "Fashion Design", degree: "Bachelor", tuitionType: "Public", tuitionAmount: 4500, language: "French", certification: false, deadline: "June 2026", format: "On Campus", internship: false, image: "https://upload.wikimedia.org/wikipedia/commons/1/16/Scines_nimes.jpg" },
  { id: 6, name: "Université Rennes 2", desc: "Rennes, France", country: "France", program: "Art Design", degree: "Online Course", tuitionType: "Public", tuitionAmount: 3000, language: "French", certification: false, deadline: "April 2026", format: "Online", internship: false, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg/330px-Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg" },
];

const DEGREES = ["Bachelor", "Master", "Foundation Year", "Short Course", "Summer School", "Online Course"];
const TUITION_TYPES = ["Public", "Private"];
const LANGUAGES = ["French", "English", "French/English", "German", "Spanish"];
const FORMATS = ["On Campus", "Hybrid", "Online"];
const COUNTRIES = ["France", "Germany", "Spain", "Italy", "United Kingdom"];
const MIN_PRICE = 0;
const MAX_PRICE = 30000;

const DEFAULT_FILTERS = {
  countries: [],
  degrees: [],
  tuitionTypes: [],
  tuitionMin: MIN_PRICE,
  tuitionMax: MAX_PRICE,
  languages: [],
  certification: null,
  formats: [],
  internship: null,
};

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
  const [open, setOpen] = useState(true);

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
    setFilters(f => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter(x => x !== value) : [...f[key], value],
    }));
  }

  const minPct = ((filters.tuitionMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const maxPct = ((filters.tuitionMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  return (
    <div className="filter-backdrop" onClick={onClose}>
      <div className="filter-panel" onClick={e => e.stopPropagation()}>

        {/* Handle bar for mobile */}
        <div className="filter-handle-bar" />

        {/* Header */}
        <div className="filter-header">
          <span className="filter-title">Filters</span>
          <button className="filter-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="filter-body">

          <CollapsibleSection title="Country" selectedCount={filters.countries.length}>
            {COUNTRIES.map(c => (
              <CheckItem key={c} label={c} checked={filters.countries.includes(c)} onChange={() => toggle("countries", c)} />
            ))}
          </CollapsibleSection>

          <CollapsibleSection title="Degree Level" selectedCount={filters.degrees.length}>
            {DEGREES.map(d => (
              <CheckItem key={d} label={d} checked={filters.degrees.includes(d)} onChange={() => toggle("degrees", d)} />
            ))}
          </CollapsibleSection>

          <CollapsibleSection
            title="Tuition Cost"
            selectedCount={filters.tuitionMin > MIN_PRICE || filters.tuitionMax < MAX_PRICE ? 1 : 0}
          >
            <div className="filter-price-inputs">
              <div className="filter-price-box">
                <span className="filter-price-currency">$</span>
                <input
                  className="filter-price-input"
                  type="number"
                  value={filters.tuitionMin}
                  min={MIN_PRICE}
                  max={filters.tuitionMax}
                  onChange={e => setFilters(f => ({ ...f, tuitionMin: Math.min(Number(e.target.value), f.tuitionMax - 500) }))}
                />
              </div>
              <div className="filter-price-sep">—</div>
              <div className="filter-price-box">
                <span className="filter-price-currency">$</span>
                <input
                  className="filter-price-input"
                  type="number"
                  value={filters.tuitionMax}
                  min={filters.tuitionMin}
                  max={MAX_PRICE}
                  onChange={e => setFilters(f => ({ ...f, tuitionMax: Math.max(Number(e.target.value), f.tuitionMin + 500) }))}
                />
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
          </CollapsibleSection>

          <CollapsibleSection title="Language of Teaching" selectedCount={filters.languages.length}>
            {LANGUAGES.map(l => (
              <CheckItem key={l} label={l} checked={filters.languages.includes(l)} onChange={() => toggle("languages", l)} />
            ))}
          </CollapsibleSection>

          <CollapsibleSection
            title="Language Certification"
            selectedCount={filters.certification !== null ? 1 : 0}
          >
            <CheckItem label="Yes" checked={filters.certification === true} onChange={() => setFilters(f => ({ ...f, certification: f.certification === true ? null : true }))} />
            <CheckItem label="No" checked={filters.certification === false} onChange={() => setFilters(f => ({ ...f, certification: f.certification === false ? null : false }))} />
          </CollapsibleSection>

          <CollapsibleSection title="Format" selectedCount={filters.formats.length}>
            {FORMATS.map(f => (
              <CheckItem key={f} label={f} checked={filters.formats.includes(f)} onChange={() => toggle("formats", f)} />
            ))}
          </CollapsibleSection>

          <CollapsibleSection
            title="Internship"
            selectedCount={filters.internship !== null ? 1 : 0}
          >
            <CheckItem label="Yes" checked={filters.internship === true} onChange={() => setFilters(f => ({ ...f, internship: f.internship === true ? null : true }))} />
            <CheckItem label="No" checked={filters.internship === false} onChange={() => setFilters(f => ({ ...f, internship: f.internship === false ? null : false }))} />
          </CollapsibleSection>

        </div>

        {/* Footer */}
        <div className="filter-footer">
          <button className="filter-clear-btn" onClick={onClear}>Clear</button>
          <button className="filter-save-btn" onClick={onApply}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Home({ onSelectUni }) {
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  function applyFilters() {
    setAppliedFilters({ ...filters });
    setShowFilter(false);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  }

  const activeCount = [
    appliedFilters.countries,
    appliedFilters.degrees,
    appliedFilters.tuitionTypes,
    appliedFilters.languages,
    appliedFilters.formats,
  ].flat().length +
    (appliedFilters.internship !== null ? 1 : 0) +
    (appliedFilters.certification !== null ? 1 : 0) +
    (appliedFilters.tuitionMin > MIN_PRICE || appliedFilters.tuitionMax < MAX_PRICE ? 1 : 0);

  const filtered = universities.filter(u => {
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.program.toLowerCase().includes(q) && !u.country.toLowerCase().includes(q)) return false;
    if (appliedFilters.countries.length && !appliedFilters.countries.includes(u.country)) return false;
    if (appliedFilters.degrees.length && !appliedFilters.degrees.includes(u.degree)) return false;
    if (appliedFilters.tuitionTypes.length && !appliedFilters.tuitionTypes.includes(u.tuitionType)) return false;
    if (u.tuitionAmount < appliedFilters.tuitionMin || u.tuitionAmount > appliedFilters.tuitionMax) return false;
    if (appliedFilters.languages.length && !appliedFilters.languages.includes(u.language)) return false;
    if (appliedFilters.certification !== null && u.certification !== appliedFilters.certification) return false;
    if (appliedFilters.formats.length && !appliedFilters.formats.includes(u.format)) return false;
    if (appliedFilters.internship !== null && u.internship !== appliedFilters.internship) return false;
    return true;
  });

  const activeTags = [
    ...appliedFilters.countries,
    ...appliedFilters.degrees,
    ...appliedFilters.languages,
    ...appliedFilters.formats,
    ...(appliedFilters.internship !== null ? [`Internship: ${appliedFilters.internship ? "Yes" : "No"}`] : []),
    ...(appliedFilters.certification !== null ? [`Certification: ${appliedFilters.certification ? "Yes" : "No"}`] : []),
    ...(appliedFilters.tuitionMin > MIN_PRICE || appliedFilters.tuitionMax < MAX_PRICE ? [`$${appliedFilters.tuitionMin.toLocaleString()} – $${appliedFilters.tuitionMax.toLocaleString()}`] : []),
  ];

  return (
    <div className="home-header">
      <h1 className="home-title">Welcome back, Kateryna</h1>
      <p className="home-desc">Discover design and art universities with Unexa. Everything you need in one place</p>

      <div className="home-search-row">
        <div className="home-search">
          <input type="text" placeholder="Search ......" className="home-search-input" value={search} onChange={e => setSearch(e.target.value)} />
          <img src="/search-normal.svg" alt="" className="home-search-icon-svg" />
        </div>
        <div className="home-icon-buttons">
          <button className="home-icon-btn filter-trigger" onClick={() => setShowFilter(true)}>
            <img src="/filter.svg" alt="Filter" />
            {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
          </button>
          <button className="home-icon-btn">
            <img src="/notification.svg" alt="Notifications" />
          </button>
        </div>
      </div>

      {activeTags.length > 0 && (
        <div className="filter-tags-row">
          {activeTags.map(tag => (
            <span key={tag} className="filter-tag">{tag}</span>
          ))}
          <button className="filter-tag-clear" onClick={clearFilters}>Clear all ✕</button>
        </div>
      )}

      <div className="uni-grid">
        {filtered.length > 0 ? filtered.map(uni => (
          <div key={uni.id} className="uni-card-new" onClick={() => onSelectUni(uni)}>
            <img src={uni.image} alt={uni.name} className="uni-card-img" />
            <div className="uni-card-glass">
              <div className="uni-card-glass-blur" />
              <div className="uni-card-text">
                <div className="uni-card-title">{uni.name}</div>
                <div className="uni-card-subtitle">{uni.desc}</div>
              </div>
              <button className="uni-card-save" onClick={e => e.stopPropagation()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontFamily: "Nunito", fontWeight: 600, fontSize: 16, color: "#4a3f38" }}>No universities match your filters</div>
            <button className="filter-clear-btn" style={{ marginTop: 12 }} onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </div>

      {showFilter && (
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          onClose={() => { setFilters(appliedFilters); setShowFilter(false); }}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      )}
    </div>
  );
}