import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { mapSpecialty } from "../lib/mapSpecialty.js";
import UniImage from "../components/UniImage.jsx";
import { searchPrograms, buildSuggestions, highlight } from "../lib/search.js";
import { buildNotifications, loadPrefs, loadRead, saveRead, timeAgo } from "../lib/notifications.js";
import { hasPreferences, recommendPrograms } from "../lib/recommendations.js";

const DEGREES = ["Bachelor", "Master", "Foundation Year", "Short Course", "Summer School", "Online Course"];
const LANGUAGES = ["French", "English", "French/English", "German", "Spanish", "Italian", "Polish", "Ukrainian"];
const FORMATS = ["On Campus", "Hybrid", "Online"];
const COUNTRIES = ["France", "Germany", "Spain", "Italy", "Poland", "Ukraine", "United Kingdom", "United States", "South Korea", "China", "Japan", "Canada"];
const MIN_PRICE = 0;
const MAX_PRICE = 30000;
const TOP_COUNT = 3; // options shown before "Show more"

const DEFAULT_FILTERS = {
  countries: [], degrees: [], tuitionMin: MIN_PRICE, tuitionMax: MAX_PRICE,
  languages: [], certification: null, formats: [], internship: null,
};

const RECENT_KEY = "unexa_recent_searches";

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

function countBy(list, field) {
  return list.reduce((acc, item) => {
    const value = item[field];
    if (value) acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

// Shows the top TOP_COUNT options (ranked by how many programs have that value,
// ties keep the original order). Anything beyond that sits behind "Show more".
// Options the user already ticked stay visible even while collapsed.
function FilterOptionList({ options, selected, onToggle, counts = {} }) {
  const [expanded, setExpanded] = useState(false);

  const ranked = options
    .map((value, index) => ({ value, index, count: counts[value] || 0 }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map(o => o.value);

  const canCollapse = ranked.length > TOP_COUNT;
  const top = ranked.slice(0, TOP_COUNT);
  const visible = !canCollapse || expanded
    ? ranked
    : ranked.filter(v => top.includes(v) || selected.includes(v));
  const hiddenCount = ranked.length - visible.length;

  return (
    <>
      {visible.map(value => (
        <CheckItem key={value} label={value} checked={selected.includes(value)} onChange={() => onToggle(value)} />
      ))}
      {canCollapse && (expanded || hiddenCount > 0) && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 6,
            padding: "8px 0",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "Nunito, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: "#AC8876",
          }}
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </>
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

function FilterPanel({ filters, setFilters, universities = [], onClose, onApply, onClear }) {
  function toggle(key, value) {
    setFilters(f => ({ ...f, [key]: f[key].includes(value) ? f[key].filter(x => x !== value) : [...f[key], value] }));
  }
  const countryCounts = countBy(universities, "country");
  const degreeCounts = countBy(universities, "degree");
  const languageCounts = countBy(universities, "language");
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
            <FilterOptionList options={COUNTRIES} selected={filters.countries} counts={countryCounts} onToggle={c => toggle("countries", c)} />
          </CollapsibleSection>
          <CollapsibleSection title="Degree Level" selectedCount={filters.degrees.length}>
            <FilterOptionList options={DEGREES} selected={filters.degrees} counts={degreeCounts} onToggle={d => toggle("degrees", d)} />
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
            <FilterOptionList options={LANGUAGES} selected={filters.languages} counts={languageCounts} onToggle={l => toggle("languages", l)} />
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

function NotificationPanel({ notifications, readIds, onRead, onReadAll, onOpen, onClose }) {
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

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
            {unreadCount > 0 && <button className="notif-mark-read" onClick={onReadAll}>Mark all as read</button>}
            <button className="filter-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="filter-body notif-body">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
              <div style={{ fontFamily: "Nunito", fontWeight: 600, color: "#4a3f38" }}>You're all caught up</div>
              <div className="notif-desc" style={{ marginTop: 6 }}>Save programs to get deadline reminders.</div>
            </div>
          ) : notifications.map(n => {
            const unread = !readIds.has(n.id);
            return (
              <div
                key={n.id}
                className={`notif-item ${unread ? "unread" : ""} ${n.urgent ? "urgent" : ""} ${n.target || n.search ? "clickable" : ""}`}
                onClick={() => { onRead(n.id); onOpen(n); }}
              >
                <div className="notif-icon">{n.icon}</div>
                <div className="notif-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-desc">{n.desc}</div>
                  <div className="notif-time">{timeAgo(n.date)}</div>
                </div>
                {unread && <div className="notif-dot" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const SUGGESTION_ICONS = { place: "📍", university: "🏛️", program: "🎓" };

function SearchDropdown({ search, items, activeIndex, setActiveIndex, onPick, recentSearches, onClearRecent }) {
  const showRecent = search.trim().length === 0;
  if (showRecent ? recentSearches.length === 0 : items.length === 0) return null;

  return (
    <div className="search-dropdown" role="listbox">
      {showRecent ? (
        <>
          <div className="search-dropdown-label search-dropdown-label-row">
            <span>Recent</span>
            <button type="button" className="search-dropdown-clear" onMouseDown={e => { e.preventDefault(); onClearRecent(); }}>Clear</button>
          </div>
          {recentSearches.map((r, i) => (
            <div
              key={r}
              className={`search-dropdown-item ${i === activeIndex ? "active" : ""}`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={e => { e.preventDefault(); onPick({ type: "recent", label: r }); }}
            >
              <span className="search-dropdown-icon">🕘</span>
              <span>{r}</span>
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="search-dropdown-label">Suggestions</div>
          {items.map((item, i) => (
            <div
              key={`${item.type}-${item.label}-${item.sub}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`search-dropdown-item ${i === activeIndex ? "active" : ""}`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={e => { e.preventDefault(); onPick(item); }}
            >
              <span className="search-dropdown-icon">{SUGGESTION_ICONS[item.type]}</span>
              <span className="search-dropdown-text">
                <span className="search-dropdown-main">
                  {highlight(item.label, search).map((part, j) => part.hit ? <strong key={j}>{part.text}</strong> : <span key={j}>{part.text}</span>)}
                </span>
                {item.sub && <span className="search-dropdown-sub">{item.sub}</span>}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function SearchEmptyState({ query }) {
  return (
    <div className="search-empty-state">
      <div className="search-empty-icon">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <circle cx="42" cy="30" r="26" fill="#EFE6DB" />
          <circle cx="30" cy="26" r="13" fill="#FAF8F5" stroke="#AC8876" strokeWidth="3.5" />
          <line x1="39.5" y1="35.5" x2="49" y2="45" stroke="#AC8876" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="search-empty-title">
        Sorry, we couldn't find any matches for <strong>{query}</strong>
      </div>
      <div className="search-empty-desc">Please try searching with another term.</div>
    </div>
  );
}

export default function Home({ onSelectUni, savedUniversities, onToggleSave, currentUser }) {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
  });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [notifPrefs, setNotifPrefs] = useState(loadPrefs);
  const [readIds, setReadIds] = useState(() => loadRead(currentUser?.id));
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [homeTab, setHomeTab] = useState("foryou"); // foryou | all
  const [showFilter, setShowFilter] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [toast, setToast] = useState(null);
  const searchRef = useRef(null);

  // Fetch specialties + their parent university in one query
  useEffect(() => {
    let cancelled = false;

    async function fetchUniversities() {
      setLoading(true);
      const { data, error } = await supabase
        .from("specialties")
        .select("*, universities(*)");

      if (cancelled) return;

      if (error) {
        console.error("Помилка завантаження університетів:", error);
        setLoadError(error.message);
      } else {
        setUniversities(data.map(mapSpecialty));
        setLoadError(null);
      }
      setLoading(false);
    }

    fetchUniversities();
    return () => { cancelled = true; };
  }, []);

  // Onboarding answers → "Recommended for you"
  useEffect(() => {
    if (!currentUser?.id) return undefined;
    let cancelled = false;
    supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle().then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error("Couldn't load profile:", error.message);
      setProfile(data ?? null);
      setProfileLoaded(true);
    });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

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

  useEffect(() => {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches)); } catch {}
  }, [recentSearches]);

  // settings in Profile → Notifications change what is shown here
  useEffect(() => {
    const update = () => setNotifPrefs(loadPrefs());
    window.addEventListener("unexa-notif-prefs", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("unexa-notif-prefs", update); window.removeEventListener("storage", update); };
  }, []);

  useEffect(() => { setReadIds(loadRead(currentUser?.id)); }, [currentUser?.id]);

  const notifications = useMemo(
    () => buildNotifications(universities, savedUniversities ?? [], notifPrefs),
    [universities, savedUniversities, notifPrefs]
  );

  function markRead(ids) {
    setReadIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      saveRead(currentUser?.id, next);
      return next;
    });
  }

  function openNotification(n) {
    if (n.type === "new" && n.search) {
      setSearch(n.search);
      setShowNotif(false);
    } else if (n.target) {
      setShowNotif(false);
      onSelectUni(n.target);
    }
  }

  const suggestions = useMemo(() => buildSuggestions(universities, search), [universities, search]);
  const dropdownItems = search.trim() ? suggestions : recentSearches;

  function rememberSearch(value) {
    const v = value.trim();
    if (!v) return;
    setRecentSearches(prev => [v, ...prev.filter(r => r.toLowerCase() !== v.toLowerCase())].slice(0, 6));
  }

  function pickSuggestion(item) {
    if (item.type === "program" && item.target) {
      rememberSearch(item.label);
      setSearchFocused(false);
      onSelectUni(item.target);
      return;
    }
    setSearch(item.label);
    rememberSearch(item.label);
    setSearchFocused(false);
    setActiveIndex(-1);
  }

  function handleSearchKey(e) {
    const count = dropdownItems.length;
    if (e.key === "ArrowDown" && count) {
      e.preventDefault();
      setSearchFocused(true);
      setActiveIndex(i => (i + 1) % count);
    } else if (e.key === "ArrowUp" && count) {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? count - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (searchFocused && activeIndex >= 0 && activeIndex < count) {
        const item = dropdownItems[activeIndex];
        pickSuggestion(typeof item === "string" ? { type: "recent", label: item } : item);
      } else {
        rememberSearch(search);
        setSearchFocused(false);
      }
    } else if (e.key === "Escape") {
      setSearchFocused(false);
      e.currentTarget.blur();
    }
  }

  function applyFilters() { setAppliedFilters({ ...filters }); setShowFilter(false); }
  function clearFilters() { setFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); }

  function toggleSave(e, uni) {
    e.stopPropagation();
    const isSaved = savedUniversities.some(u => u.id === uni.id);
    onToggleSave(uni);
    if (!isSaved) {
      setToast(`${uni.name} saved to profile`);
    }
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

  const unreadNotifCount = notifications.filter(n => !readIds.has(n.id)).length;

  const filtered = searchPrograms(universities, search).filter(u => {
    if (appliedFilters.countries.length && !appliedFilters.countries.includes(u.country)) return false;
    if (appliedFilters.degrees.length && !appliedFilters.degrees.includes(u.degree)) return false;
    if (u.tuitionAmount < appliedFilters.tuitionMin || u.tuitionAmount > appliedFilters.tuitionMax) return false;
    if (appliedFilters.languages.length && !appliedFilters.languages.includes(u.language)) return false;
    if (appliedFilters.certification !== null && u.certification !== appliedFilters.certification) return false;
    if (appliedFilters.formats.length && !appliedFilters.formats.includes(u.format)) return false;
    if (appliedFilters.internship !== null && u.internship !== appliedFilters.internship) return false;
    return true;
  });

  // Recommendations only on the untouched list: a search or filter shows exactly what was asked for
  const browsing = !search.trim() && activeCount === 0;
  const recommended = useMemo(
    () => (profile ? recommendPrograms(universities, profile, 12) : []),
    [profile, universities]
  );
  // a search or a filter always shows the full list, so results are never hidden behind "For you"
  const tab = browsing ? homeTab : "all";
  const listed = filtered;

  function openTab(next) {
    if (next === "foryou" && !browsing) {
      setSearch("");
      clearFilters();
    }
    setHomeTab(next);
  }

  function renderCard(uni, reasons) {
    const isSaved = savedUniversities.some(u => u.id === uni.id);
    return (
      <div key={uni.id} className="uni-card-new" onClick={() => onSelectUni(uni)}>
        <UniImage src={uni.image} name={uni.name} className="uni-card-img" />
        {reasons?.length > 0 && <div className="uni-card-why">{reasons.join(" · ")}</div>}
        <div className="uni-card-glass">
          {/* the card photo again, heavily blurred: frosted glass that works in every browser */}
          {uni.image && <img src={uni.image} alt="" aria-hidden="true" className="card-glass-photo" />}
          <div className="uni-card-glass-blur" />
          <div className="uni-card-text">
            <div className="uni-card-title" title={uni.program}>{uni.program}</div>
            <div className="uni-card-subtitle" title={uni.name}>{uni.name}</div>
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
  }

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
    <div className="home-page">
      <div className="home-sticky-header">
        <h1 className="home-title">Welcome back, {currentUser?.name || "there"}</h1>
        <p className="home-desc">Discover design and art universities with Unexa. Everything you need in one place</p>

        <div className="home-search-row">
          <div className={`home-search ${searchFocused ? "active" : ""}`} ref={searchRef} style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search programs, universities, cities…"
              className="home-search-input"
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveIndex(-1); setSearchFocused(true); }}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKey}
              aria-label="Search programs, universities, cities"
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
                items={suggestions}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                onPick={pickSuggestion}
                recentSearches={recentSearches}
                onClearRecent={() => setRecentSearches([])}
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

        {/* same tabs as Community */}
        <div className="community-tabs home-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "foryou"} className={`community-tab ${tab === "foryou" ? "active" : ""}`} onClick={() => openTab("foryou")}>
            For you
            {recommended.length > 0 && <span className="community-tab-count">{recommended.length}</span>}
          </button>
          <button role="tab" aria-selected={tab === "all"} className={`community-tab ${tab === "all" ? "active" : ""}`} onClick={() => openTab("all")}>
            All programs
            {!loading && <span className="community-tab-count">{filtered.length}</span>}
          </button>
        </div>
      </div>

      <div className="home-panel">
      <div className="home-scroll">
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "Nunito", color: "#8a7c70" }}>
            Loading universities...
          </div>
        )}

        {!loading && loadError && (
          <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "Nunito", color: "#c05050" }}>
            Couldn't load universities: {loadError}
          </div>
        )}

        {!loading && !loadError && search.trim() && filtered.length > 0 && (
          <div className="search-results-count">
            {filtered.length} result{filtered.length === 1 ? "" : "s"} for <strong>“{search.trim()}”</strong>
          </div>
        )}

        {!loading && !loadError && tab === "foryou" && profileLoaded && !hasPreferences(profile) && (
          <Link to="/onboarding" className="home-reco-prompt">
            <span className="home-reco-prompt-text">
              <strong>Get programs picked for you</strong>
              <span>Answer a few quick questions and we'll recommend programs that fit your goals.</span>
            </span>
            <span className="home-reco-prompt-cta">Start <span aria-hidden="true">→</span></span>
          </Link>
        )}

        {!loading && !loadError && tab === "foryou" && hasPreferences(profile) && (
          recommended.length > 0 ? (
            <div className="uni-grid">
              {recommended.map((r) => renderCard(r.program, r.reasons))}
            </div>
          ) : (
            <div className="home-reco-empty">
              <strong>No close matches yet</strong>
              <span>We're adding new schools every week. Meanwhile, browse all programs.</span>
              <button className="filter-clear-btn" onClick={() => setHomeTab("all")}>See all programs</button>
            </div>
          )
        )}

        {!loading && !loadError && tab === "all" && (
          <div className="uni-grid">
            {listed.length > 0 ? listed.map((uni) => renderCard(uni)) : search.trim().length > 0 ? (
              <div style={{ gridColumn: "1/-1" }}>
                <SearchEmptyState query={search} />
              </div>
            ) : (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontFamily: "Nunito", fontWeight: 600, fontSize: 16, color: "#4a3f38" }}>No universities match your filters</div>
                <button className="filter-clear-btn" style={{ marginTop: 12 }} onClick={clearFilters}>Clear filters</button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {showFilter && (
        <FilterPanel filters={filters} setFilters={setFilters} universities={universities}
          onClose={() => { setFilters(appliedFilters); setShowFilter(false); }}
          onApply={applyFilters} onClear={clearFilters} />
      )}

      {showNotif && (
        <NotificationPanel
          notifications={notifications}
          readIds={readIds}
          onRead={id => markRead([id])}
          onReadAll={() => markRead(notifications.map(n => n.id))}
          onOpen={openNotification}
          onClose={() => setShowNotif(false)}
        />
      )}

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