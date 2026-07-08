import { useState } from "react";

const universities = [
  { id: 1, name: "Aix-Marseille Université", desc: "Marseille, France", country: "France", program: "Art Design", degree: "Bachelor", tuitionType: "Public", language: "French", certification: "DELF B2", deadline: "March 2026", format: "On Campus", internship: true, image: "https://madeinmarseille.net/actualites-marseille/2019/04/Cube-campus-aix.jpeg" },
  { id: 2, name: "Université Bordeaux-Montaigne", desc: "Bordeaux, France", country: "France", program: "Architecture", degree: "Master", tuitionType: "Public", language: "French", certification: "DELF B2", deadline: "April 2026", format: "On Campus", internship: false, image: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Ijba_iut_montaigne_bordeaux.jpg" },
  { id: 3, name: "Université de Franche-Comté", desc: "Besançon, France", country: "France", program: "Fine Arts", degree: "Bachelor", tuitionType: "Public", language: "French", certification: "DELF B1", deadline: "May 2026", format: "Hybrid", internship: true, image: "https://cdn-s-www.bienpublic.com/images/AC513A2C-88A9-456D-972D-758F6975A8A9/NW_raw/le-campus-dijonnais-de-l-universite-de-bourgogne-accueille-plus-de-30-000-etudiants-photo-d-illustration-lbp-emma-buoncristiani-1690820597.jpg" },
  { id: 4, name: "Université Jean-Monnet-Saint-Étienne", desc: "Loire, France", country: "France", program: "Digital Media", degree: "Master", tuitionType: "Public", language: "French/English", certification: "IELTS 6.0", deadline: "March 2026", format: "On Campus", internship: true, image: "https://www.univ-st-etienne.fr/_richText-file/ametys-internal%253Asites/ujm/ametys-internal%253Acontents/plans-d-acces-2/_attribute/content/_data/Campus-Trefilerie-Pierre-Grasset.jpg" },
  { id: 5, name: "Université de Nîmes", desc: "Nîmes, France", country: "France", program: "Fashion Design", degree: "Bachelor", tuitionType: "Public", language: "French", certification: "DELF B2", deadline: "June 2026", format: "On Campus", internship: false, image: "https://upload.wikimedia.org/wikipedia/commons/1/16/Scines_nimes.jpg" },
  { id: 6, name: "Université Rennes 2", desc: "Rennes, France", country: "France", program: "Art Design", degree: "Bachelor", tuitionType: "Public", language: "French", certification: "DELF B1", deadline: "April 2026", format: "Online", internship: false, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg/330px-Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg" },
];

const DEGREES = ["Bachelor", "Master", "Foundation Year", "Short Course", "Summer School", "Online Course"];
const TUITION_TYPES = ["Public", "Private"];
const LANGUAGES = ["French", "English", "French/English", "German", "Spanish"];
const CERTIFICATIONS = ["DELF B1", "DELF B2", "IELTS 6.0", "IELTS 6.5", "TOEFL", "None required"];
const FORMATS = ["On Campus", "Hybrid", "Online"];
const COUNTRIES = ["France", "Germany", "Spain", "Italy", "United Kingdom"];

const DEFAULT_FILTERS = {
  search: "",
  countries: [],
  degrees: [],
  tuitionTypes: [],
  languages: [],
  certifications: [],
  formats: [],
  internship: null,
};

function CheckItem({ label, checked, onChange, bold }) {
  return (
    <div className="filter-check-item" onClick={onChange}>
      <span className={bold ? "filter-check-label bold" : "filter-check-label"}>{label}</span>
      <div className={`filter-checkbox ${checked ? "checked" : ""}`}>
        {checked && <span className="filter-check-tick">✓</span>}
      </div>
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

  return (
    <div className="filter-backdrop" onClick={onClose}>
      <div className="filter-panel" onClick={e => e.stopPropagation()}>

        {/* Search inside filter */}
        <div className="filter-search-wrap">
          <input
            className="filter-inner-search"
            placeholder="Search country, program..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>

        <div className="filter-body">

          {/* Country */}
          <div className="filter-group">
            <div className="filter-group-title">Country</div>
            {COUNTRIES.map(c => (
              <CheckItem key={c} label={c} checked={filters.countries.includes(c)} onChange={() => toggle("countries", c)} />
            ))}
          </div>

          <div className="filter-divider" />

          {/* Degree Level */}
          <div className="filter-group">
            <div className="filter-group-title">Degree Level</div>
            {DEGREES.map(d => (
              <CheckItem key={d} label={d} checked={filters.degrees.includes(d)} onChange={() => toggle("degrees", d)} />
            ))}
          </div>

          <div className="filter-divider" />

          {/* Tuition Cost */}
          <div className="filter-group">
            <div className="filter-group-title">Tuition Cost</div>
            {TUITION_TYPES.map(t => (
              <CheckItem key={t} label={t} checked={filters.tuitionTypes.includes(t)} onChange={() => toggle("tuitionTypes", t)} />
            ))}
          </div>

          <div className="filter-divider" />

          {/* Language of Teaching */}
          <div className="filter-group">
            <div className="filter-group-title">Language of Teaching</div>
            {LANGUAGES.map(l => (
              <CheckItem key={l} label={l} checked={filters.languages.includes(l)} onChange={() => toggle("languages", l)} />
            ))}
          </div>

          <div className="filter-divider" />

          {/* Language Certification */}
          <div className="filter-group">
            <div className="filter-group-title">Language Certification Required</div>
            {CERTIFICATIONS.map(c => (
              <CheckItem key={c} label={c} checked={filters.certifications.includes(c)} onChange={() => toggle("certifications", c)} />
            ))}
          </div>

          <div className="filter-divider" />

          {/* Format */}
          <div className="filter-group">
            <div className="filter-group-title">Hybrid / Online Format</div>
            {FORMATS.map(f => (
              <CheckItem key={f} label={f} checked={filters.formats.includes(f)} onChange={() => toggle("formats", f)} />
            ))}
          </div>

          <div className="filter-divider" />

          {/* Internship */}
          <div className="filter-group">
            <div className="filter-group-title">Internship</div>
            <CheckItem label="Yes" checked={filters.internship === true} onChange={() => setFilters(f => ({ ...f, internship: f.internship === true ? null : true }))} />
            <CheckItem label="No" checked={filters.internship === false} onChange={() => setFilters(f => ({ ...f, internship: f.internship === false ? null : false }))} />
          </div>

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
    setAppliedFilters(filters);
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
    appliedFilters.certifications,
    appliedFilters.formats,
  ].flat().length + (appliedFilters.internship !== null ? 1 : 0);

  const filtered = universities.filter(u => {
    const q = (search || appliedFilters.search).toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.program.toLowerCase().includes(q) && !u.country.toLowerCase().includes(q)) return false;
    if (appliedFilters.countries.length && !appliedFilters.countries.includes(u.country)) return false;
    if (appliedFilters.degrees.length && !appliedFilters.degrees.includes(u.degree)) return false;
    if (appliedFilters.tuitionTypes.length && !appliedFilters.tuitionTypes.includes(u.tuitionType)) return false;
    if (appliedFilters.languages.length && !appliedFilters.languages.includes(u.language)) return false;
    if (appliedFilters.certifications.length && !appliedFilters.certifications.includes(u.certification)) return false;
    if (appliedFilters.formats.length && !appliedFilters.formats.includes(u.format)) return false;
    if (appliedFilters.internship !== null && u.internship !== appliedFilters.internship) return false;
    return true;
  });

  return (
    <div className="home-header">
      <h1 className="home-title">Welcome back, Kateryna</h1>
      <p className="home-desc">Discover design and art universities with Unexa. Everything you need in one place</p>

      <div className="home-search-row">
        <div className="home-search">
          <input
            type="text"
            placeholder="Search ......"
            className="home-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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

      {/* Active filter tags */}
      {activeCount > 0 && (
        <div className="filter-tags-row">
          {[...appliedFilters.countries, ...appliedFilters.degrees, ...appliedFilters.tuitionTypes, ...appliedFilters.languages, ...appliedFilters.certifications, ...appliedFilters.formats, ...(appliedFilters.internship !== null ? [`Internship: ${appliedFilters.internship ? "Yes" : "No"}`] : [])].map(tag => (
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
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0", color: "#9e8f86" }}>
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
          onClose={() => setShowFilter(false)}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      )}
    </div>
  );
}