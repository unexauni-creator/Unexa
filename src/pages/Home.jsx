import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { mapSpecialty } from "../lib/mapSpecialty.js";
import UniImage from "../components/UniImage.jsx";
import { searchPrograms, buildSuggestions, highlight } from "../lib/search.js";
import { buildNotifications, loadGone, loadPrefs, loadRead, saveGone, saveRead, timeAgo } from "../lib/notifications.js";
import { hasPreferences, matchScores } from "../lib/recommendations.js";

const DEGREES = ["Bachelor", "Master", "Foundation Year", "Short Course", "Summer School", "Online Course"];
const LANGUAGES = ["French", "English", "French/English", "German", "Spanish", "Italian", "Polish", "Ukrainian", "Korean", "Japanese", "Chinese"];
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
const BUDGET_PRESETS = [
  { label: "Under $1,000", hint: "many public schools in Europe", max: 1000 },
  { label: "Under $5,000", max: 5000 },
  { label: "Under $15,000", max: 15000 },
  { label: "Any budget", max: MAX_PRICE },
];

// Does a programme pass the filters? `skip` leaves one group out, to count what each option would add.
// Fees that a school doesn't list (0) never hide a programme: the student can't know them either.
function passes(u, f, skip) {
  if (skip !== "countries" && f.countries.length && !f.countries.includes(u.country)) return false;
  if (skip !== "degrees" && f.degrees.length && !f.degrees.includes(u.degree)) return false;
  // the top of the slider means "no upper limit", so the most expensive schools are never hidden by default
  if (skip !== "tuition" && u.tuitionAmount > 0 && (u.tuitionAmount < f.tuitionMin || (f.tuitionMax < MAX_PRICE && u.tuitionAmount > f.tuitionMax))) return false;
  if (skip !== "languages" && f.languages.length && !f.languages.includes(u.language)) return false;
  if (skip !== "certification" && f.certification !== null && u.certification !== f.certification) return false;
  if (skip !== "formats" && f.formats.length && !f.formats.includes(u.format)) return false;
  if (skip !== "internship" && f.internship !== null && u.internship !== f.internship) return false;
  return true;
}

const money = (n) => `$${n.toLocaleString("en-US")}`;

function CheckItem({ label, checked, onChange, count }) {
  return (
    <div className={`filter-check-item ${count === 0 && !checked ? "is-empty" : ""}`} onClick={onChange}>
      <span className="filter-check-label">{label}{count != null && <span className="filter-check-count">{count}</span>}</span>
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
        <CheckItem key={value} label={value} count={counts[value] || 0} checked={selected.includes(value)} onChange={() => onToggle(value)} />
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
  // each number says how many programmes you'd see with that option, given the other choices
  const facet = (key, field) => countBy(universities.filter(u => passes(u, filters, key)), field);
  const yesNo = (key) => { const l = universities.filter(u => passes(u, filters, key)); return { Yes: l.filter(u => u[key] === true).length, No: l.filter(u => u[key] === false).length }; };
  const total = universities.filter(u => passes(u, filters)).length;

  // budget: a small chart of how many programmes cost what, like price filters on housing sites
  const priced = universities.filter(u => passes(u, filters, "tuition") && u.tuitionAmount > 0);
  const unlisted = universities.filter(u => passes(u, filters, "tuition") && !(u.tuitionAmount > 0)).length;
  const BUCKETS = 20, step = (MAX_PRICE - MIN_PRICE) / BUCKETS;
  const bars = Array.from({ length: BUCKETS }, (_, i) => priced.filter(u => Math.min(BUCKETS - 1, Math.floor((u.tuitionAmount - MIN_PRICE) / step)) === i).length);
  const tallest = Math.max(1, ...bars);
  const minPct = ((filters.tuitionMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const maxPct = ((filters.tuitionMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const setBudget = (max) => setFilters(f => ({ ...f, tuitionMin: MIN_PRICE, tuitionMax: max }));

  return (
    <div className="filter-backdrop" onClick={onClose}>
      <div className="filter-panel" onClick={e => e.stopPropagation()}>
        <div className="filter-handle-bar" />
        <div className="filter-header">
          <span className="filter-title">Filters</span>
          <button className="filter-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="filter-body">
          <CollapsibleSection title="Country" selectedCount={filters.countries.length}>
            <FilterOptionList options={COUNTRIES} selected={filters.countries} counts={facet("countries", "country")} onToggle={c => toggle("countries", c)} />
          </CollapsibleSection>
          <CollapsibleSection title="Degree level" selectedCount={filters.degrees.length}>
            <FilterOptionList options={DEGREES} selected={filters.degrees} counts={facet("degrees", "degree")} onToggle={d => toggle("degrees", d)} />
          </CollapsibleSection>

          {/* Tuition: always open */}
          <div className="filter-section">
            <div className="filter-section-header" style={{ cursor: "default" }}>
              <span className="filter-group-title">
                Yearly tuition
                {(filters.tuitionMin > MIN_PRICE || filters.tuitionMax < MAX_PRICE) && <span className="filter-section-badge">1</span>}
              </span>
            </div>
            <div className="filter-section-body">
              <p className="filter-note">Not sure about your budget? Start with a quick choice. Many art schools in Europe are public and cost very little.</p>
              <div className="filter-presets">
                {BUDGET_PRESETS.map(b => (
                  <button key={b.label} type="button" className={`filter-preset ${filters.tuitionMin === MIN_PRICE && filters.tuitionMax === b.max ? "is-on" : ""}`} onClick={() => setBudget(b.max)}>
                    {b.label}
                  </button>
                ))}
              </div>
              <div className="filter-hist" aria-hidden="true">
                {bars.map((n, i) => {
                  const from = MIN_PRICE + i * step;
                  const inside = from + step > filters.tuitionMin && from < filters.tuitionMax;
                  return <i key={i} className={inside ? "in" : ""} style={{ height: `${n ? 8 + (n / tallest) * 92 : 0}%` }} />;
                })}
              </div>
              <div className="filter-slider-wrap">
                <div className="filter-slider-track">
                  <div className="filter-slider-range" style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }} />
                </div>
                <input type="range" className="filter-slider" min={MIN_PRICE} max={MAX_PRICE} step={500} value={filters.tuitionMin} aria-label="Lowest tuition"
                  onChange={e => setFilters(f => ({ ...f, tuitionMin: Math.min(Number(e.target.value), f.tuitionMax - 500) }))} />
                <input type="range" className="filter-slider" min={MIN_PRICE} max={MAX_PRICE} step={500} value={filters.tuitionMax} aria-label="Highest tuition"
                  onChange={e => setFilters(f => ({ ...f, tuitionMax: Math.max(Number(e.target.value), f.tuitionMin + 500) }))} />
              </div>
              <div className="filter-price-inputs">
                <div className="filter-price-box">
                  <span className="filter-price-currency">from $</span>
                  <input className="filter-price-input" type="number" value={filters.tuitionMin} min={MIN_PRICE} max={filters.tuitionMax}
                    onChange={e => setFilters(f => ({ ...f, tuitionMin: Math.min(Number(e.target.value), f.tuitionMax - 500) }))} />
                </div>
                <div className="filter-price-sep">—</div>
                <div className="filter-price-box">
                  <span className="filter-price-currency">to $</span>
                  <input className="filter-price-input" type="number" value={filters.tuitionMax} min={filters.tuitionMin} max={MAX_PRICE} title={filters.tuitionMax >= MAX_PRICE ? "and more" : undefined}
                    onChange={e => setFilters(f => ({ ...f, tuitionMax: Math.max(Number(e.target.value), f.tuitionMin + 500) }))} />
                </div>
              </div>
              {filters.tuitionMax >= MAX_PRICE && <p className="filter-note">The top of the scale includes schools above {money(MAX_PRICE)}.</p>}
              {unlisted > 0 && <p className="filter-note">+ {unlisted} programme{unlisted === 1 ? "" : "s"} whose school doesn't list the fee are always shown.</p>}
            </div>
          </div>

          <CollapsibleSection title="Language of teaching" selectedCount={filters.languages.length}>
            <FilterOptionList options={LANGUAGES} selected={filters.languages} counts={facet("languages", "language")} onToggle={l => toggle("languages", l)} />
          </CollapsibleSection>
          <CollapsibleSection title="Language certificate needed" selectedCount={filters.certification !== null ? 1 : 0}>
            {(() => { const c = yesNo("certification"); return <>
              <CheckItem label="Yes" count={c.Yes} checked={filters.certification === true} onChange={() => setFilters(f => ({ ...f, certification: f.certification === true ? null : true }))} />
              <CheckItem label="No" count={c.No} checked={filters.certification === false} onChange={() => setFilters(f => ({ ...f, certification: f.certification === false ? null : false }))} />
            </>; })()}
          </CollapsibleSection>
          <CollapsibleSection title="Format" selectedCount={filters.formats.length}>
            {(() => { const c = facet("formats", "format"); return FORMATS.map(f => <CheckItem key={f} label={f} count={c[f] || 0} checked={filters.formats.includes(f)} onChange={() => toggle("formats", f)} />); })()}
          </CollapsibleSection>
          <CollapsibleSection title="Internship" selectedCount={filters.internship !== null ? 1 : 0}>
            {(() => { const c = yesNo("internship"); return <>
              <CheckItem label="Yes" count={c.Yes} checked={filters.internship === true} onChange={() => setFilters(f => ({ ...f, internship: f.internship === true ? null : true }))} />
              <CheckItem label="No" count={c.No} checked={filters.internship === false} onChange={() => setFilters(f => ({ ...f, internship: f.internship === false ? null : false }))} />
            </>; })()}
          </CollapsibleSection>
        </div>
        <div className="filter-footer">
          {total === 0 && <span className="filter-zero">Nothing fits all of these. Untick one.</span>}
          <button className="filter-clear-btn" onClick={onClear}>Clear all</button>
          <button className="filter-save-btn" onClick={onApply} disabled={total === 0}>Save</button>
        </div>
      </div>
    </div>
  );
}

function NotificationPanel({ notifications, readIds, onRead, onReadAll, onDelete, onDeleteAll, onOpen, onClose }) {
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
            {notifications.length > 0 && <button className="notif-mark-read notif-clear" onClick={onDeleteAll}>Clear all</button>}
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
                <button className="notif-delete" onClick={e => { e.stopPropagation(); onDelete(n.id); }} aria-label="Delete notification" title="Delete">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                </button>
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

function activeTagsOf(f) {
  return [
    ...f.countries.map(v => ({ label: v, key: "countries", value: v })),
    ...f.degrees.map(v => ({ label: v, key: "degrees", value: v })),
    ...f.languages.map(v => ({ label: v, key: "languages", value: v })),
    ...f.formats.map(v => ({ label: v, key: "formats", value: v })),
    ...(f.internship !== null ? [{ label: `Internship: ${f.internship ? "Yes" : "No"}`, key: "internship", value: null }] : []),
    ...(f.certification !== null ? [{ label: `Certificate: ${f.certification ? "Yes" : "No"}`, key: "certification", value: null }] : []),
    ...(f.tuitionMin > MIN_PRICE || f.tuitionMax < MAX_PRICE ? [{ label: f.tuitionMin > MIN_PRICE ? `${money(f.tuitionMin)} – ${money(f.tuitionMax)}` : `Under ${money(f.tuitionMax)}`, key: "tuition", value: null }] : []),
  ];
}

function withoutTag(f, tag) {
  if (tag.key === "tuition") return { ...f, tuitionMin: MIN_PRICE, tuitionMax: MAX_PRICE };
  if (tag.key === "certification" || tag.key === "internship") return { ...f, [tag.key]: null };
  return { ...f, [tag.key]: f[tag.key].filter(x => x !== tag.value) };
}

// demoProfile: local test page only (/dev/home), stands in for the onboarding answers of a signed-in student
export default function Home({ onSelectUni, savedUniversities, onToggleSave, currentUser, demoProfile }) {
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
  const [profile, setProfile] = useState(demoProfile ?? null);
  const [profileLoaded, setProfileLoaded] = useState(Boolean(demoProfile));
  const [onlyForYou, setOnlyForYou] = useState(Boolean(demoProfile));
  const [goneIds, setGoneIds] = useState(() => loadGone(currentUser?.id));
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
      if (hasPreferences(data)) setOnlyForYou(true);
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

  useEffect(() => { setReadIds(loadRead(currentUser?.id)); setGoneIds(loadGone(currentUser?.id)); }, [currentUser?.id]);

  const notifications = useMemo(
    () => buildNotifications(universities, savedUniversities ?? [], notifPrefs).filter(n => !goneIds.has(n.id)),
    [universities, savedUniversities, notifPrefs, goneIds]
  );
  function deleteNotifications(ids) {
    setGoneIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      saveGone(currentUser?.id, next);
      return next;
    });
  }

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
    setAppliedFilters(f => withoutTag(f, { key, value }));
    setFilters(f => withoutTag(f, { key, value }));
  }

  const activeCount = [appliedFilters.countries, appliedFilters.degrees, appliedFilters.languages, appliedFilters.formats].flat().length +
    (appliedFilters.internship !== null ? 1 : 0) + (appliedFilters.certification !== null ? 1 : 0) +
    (appliedFilters.tuitionMin > MIN_PRICE || appliedFilters.tuitionMax < MAX_PRICE ? 1 : 0);

  const unreadNotifCount = notifications.filter(n => !readIds.has(n.id)).length;

  // One list. Programmes that fit the onboarding answers are marked "For you" and come first
  // (unless the student searched: then the best text match comes first).
  const scores = useMemo(() => matchScores(universities, profile), [universities, profile]);
  const searched = searchPrograms(universities, search);
  const matching = searched.filter(u => passes(u, appliedFilters));
  const forYouCount = matching.filter(u => scores.has(u.id)).length;
  const listed = (onlyForYou ? matching.filter(u => scores.has(u.id)) : matching)
    .map((u, i) => ({ u, i }))
    .sort((a, b) => (search.trim() ? 0 : (scores.get(b.u.id)?.score ?? 0) - (scores.get(a.u.id)?.score ?? 0)) || a.i - b.i)
    .map(x => x.u);

  // nothing fits: say which single filter to remove, and show the closest programmes
  const relax = listed.length === 0 && activeCount > 0 ? activeTagsOf(appliedFilters).map(tag => {
    const f = withoutTag(appliedFilters, tag);
    return { tag, count: searched.filter(u => passes(u, f) && (!onlyForYou || scores.has(u.id))).length };
  }).filter(r => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 3) : [];
  const closest = relax.length
    ? searched.filter(u => passes(u, withoutTag(appliedFilters, relax[0].tag)) && (!onlyForYou || scores.has(u.id)))
      .sort((a, b) => (scores.get(b.id)?.score ?? 0) - (scores.get(a.id)?.score ?? 0)).slice(0, 6)
    : [];

  function renderCard(uni) {
    const isSaved = savedUniversities.some(u => u.id === uni.id);
    const match = scores.get(uni.id);
    return (
      <div key={uni.id} className="uni-card-new" onClick={() => onSelectUni(uni)}>
        <UniImage src={uni.image} name={uni.name} className="uni-card-img" />
        {match && <span className="uni-card-match" title={match.reasons.length ? `Fits your answers: ${match.reasons.join(", ")}` : "Fits your answers"}>✳ For you</span>}
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
            <button className="home-filter-btn" onClick={() => { setFilters(appliedFilters); setShowFilter(true); }} aria-label="Filters">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
              <span className="home-btn-label">Filters</span>
              {activeCount > 0 && <span className="home-filter-count">{activeCount}</span>}
            </button>
            <button className="home-icon-btn filter-trigger" onClick={() => setShowNotif(true)} aria-label="Notifications">
              <img src="/notification.svg" alt="Notifications" />
              {unreadNotifCount > 0 && <span className="filter-badge">{unreadNotifCount}</span>}
            </button>
          </div>
        </div>

        {/* same tabs as before; both numbers follow the search and the filters */}
        <div className="home-tabs-row">
          <div className="community-tabs home-tabs" role="tablist">
            {hasPreferences(profile) && (
              <button role="tab" aria-selected={onlyForYou} className={`community-tab ${onlyForYou ? "active" : ""}`} onClick={() => setOnlyForYou(true)}>
                For you
                {!loading && <span className="community-tab-count">{forYouCount}</span>}
              </button>
            )}
            <button role="tab" aria-selected={!onlyForYou} className={`community-tab ${!onlyForYou ? "active" : ""}`} onClick={() => setOnlyForYou(false)}>
              All programs
              {!loading && <span className="community-tab-count">{matching.length}</span>}
            </button>
          </div>
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

        {!loading && !loadError && search.trim() && listed.length > 0 && (
          <div className="search-results-count">
            {listed.length} result{listed.length === 1 ? "" : "s"} for <strong>“{search.trim()}”</strong>
          </div>
        )}

        {!loading && !loadError && profileLoaded && !hasPreferences(profile) && !search.trim() && (
          <Link to="/onboarding" className="home-reco-prompt">
            <span className="home-reco-prompt-text">
              <strong>Get programs picked for you</strong>
              <span>Answer a few quick questions and we'll mark the programmes that fit your goals.</span>
            </span>
            <span className="home-reco-prompt-cta">Start <span aria-hidden="true">→</span></span>
          </Link>
        )}

        {!loading && !loadError && (
          listed.length > 0 ? (
            <div className="uni-grid">{listed.map(uni => renderCard(uni))}</div>
          ) : search.trim() && activeCount === 0 && !onlyForYou ? (
            <SearchEmptyState query={search} />
          ) : (
            <div className="home-soft-empty">
              <strong>No programme fits every choice</strong>
              <span>{relax.length ? "You are close. Remove one of these to see more:" : onlyForYou ? "None of the programmes that fit your answers match this. Show all programmes instead." : "Try fewer filters."}</span>
              <div className="home-soft-actions">
                {relax.map(r => (
                  <button key={r.tag.label} type="button" className="home-soft-chip" onClick={() => removeTag(r.tag.key, r.tag.value)}>
                    Without “{r.tag.label}” <b>{r.count}</b>
                  </button>
                ))}
                {onlyForYou && <button type="button" className="home-soft-chip" onClick={() => setOnlyForYou(false)}>Show all programmes</button>}
                {activeCount > 0 && <button type="button" className="filter-clear-btn" onClick={clearFilters}>Clear all filters</button>}
              </div>
              {closest.length > 0 && (
                <>
                  <div className="home-soft-label">Closest to what you asked</div>
                  <div className="uni-grid">{closest.map(uni => renderCard(uni))}</div>
                </>
              )}
            </div>
          )
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
          onDelete={id => deleteNotifications([id])}
          onDeleteAll={() => deleteNotifications(notifications.map(n => n.id))}
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