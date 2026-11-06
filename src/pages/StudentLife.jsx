import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

// Student life of one school as a photo gallery of student ACTIVITIES, collected by the Unexa agent
// from the school's official website (universities.student_life). Housing lives on the Dorm page,
// so it (and fees, grants, offices) is never shown here.
const CATEGORY = {
  clubs: "Clubs",
  sports: "Sport",
  events: "Events",
  exhibitions: "Exhibitions",
  workshops: "Workshops",
  community: "Community",
  trips: "Trips",
};

function CategoryIcon({ category, size = 28 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (category) {
    case "clubs": return <svg {...p}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15 14.2c3 .2 5 2 5 4.8" /></svg>;
    case "sports": return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M4.5 9.5c3 1 5 3.5 5.5 10.3M19.5 14.5c-3-1-5-3.5-5.5-10.3" /></svg>;
    case "exhibitions": return <svg {...p}><rect x="4" y="4" width="16" height="12" rx="1.5" /><path d="M4 13l4-4 4 4 3-3 5 5M9 20h6M12 16v4" /></svg>;
    case "workshops": return <svg {...p}><path d="M14 4l6 6-9 9H5v-6z" /><path d="M12 6l6 6" /></svg>;
    case "community": return <svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>;
    case "trips": return <svg {...p}><path d="M3 12l18-8-8 18-2-8z" /></svg>;
    default: return <svg {...p}><path d="M5 20V5l8-1 6 3-6 3-8 1" /><path d="M5 20h4" /></svg>;
  }
}

const imagesOf = (s) => (s.images?.length ? s.images : s.image ? [s.image] : []);

// Rows of a 4-column grid, so there are never empty holes: 2+1+1, then 1+1+2, …
// what's left at the end fills its row (one tile = 4 columns, two tiles = 2+2).
function tileSpans(count) {
  const spans = [];
  let left = count;
  let flip = false;
  while (left > 0) {
    if (left >= 3) { spans.push(...(flip ? [1, 1, 2] : [2, 1, 1])); left -= 3; flip = !flip; }
    else if (left === 2) { spans.push(2, 2); left = 0; }
    else { spans.push(4); left = 0; }
  }
  return spans;
}

function Tile({ section, span, onOpen }) {
  const [broken, setBroken] = useState(false);
  const imgs = imagesOf(section);
  const cover = !broken ? imgs[0] : null;
  return (
    <button type="button" className={`sl-tile span-${span} ${cover ? "" : "is-placeholder"}`} onClick={onOpen}>
      {cover ? (
        <img src={cover} alt="" loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <span className="sl-tile-icon"><CategoryIcon category={section.category} size={34} /></span>
      )}
      <span className="sl-tile-pill">{CATEGORY[section.category] ?? "Activity"}</span>
      {imgs.length > 1 && <span className="sl-tile-count">{imgs.length} photos</span>}
      <span className="sl-tile-caption">
        <span className="sl-tile-title">{section.title}</span>
        <span className="sl-tile-text">{section.text}</span>
      </span>
    </button>
  );
}

function Lightbox({ section, onClose }) {
  const imgs = imagesOf(section);
  const [i, setI] = useState(0);
  const prev = useCallback(() => setI((n) => (n - 1 + imgs.length) % imgs.length), [imgs.length]);
  const next = useCallback(() => setI((n) => (n + 1) % imgs.length), [imgs.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (imgs.length > 1 && e.key === "ArrowLeft") prev();
      if (imgs.length > 1 && e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imgs.length, onClose, prev, next]);

  return createPortal(
    <div className="sl-lightbox" role="dialog" aria-modal="true" aria-label={section.title} onClick={onClose}>
      <div className="sl-lightbox-panel" onClick={(e) => e.stopPropagation()}>
        <div className={`sl-lightbox-media ${imgs.length ? "" : "is-placeholder"}`}>
          {imgs.length ? <img key={imgs[i]} src={imgs[i]} alt="" /> : <span className="sl-tile-icon"><CategoryIcon category={section.category} size={44} /></span>}
          {imgs.length > 1 && (
            <>
              <button type="button" className="sl-lightbox-nav is-prev" onClick={prev} aria-label="Previous photo">‹</button>
              <button type="button" className="sl-lightbox-nav is-next" onClick={next} aria-label="Next photo">›</button>
              <div className="sl-lightbox-dots">{imgs.map((u, n) => <span key={u} className={n === i ? "is-active" : ""} />)}</div>
            </>
          )}
        </div>
        <div className="sl-lightbox-info">
          <span className="sl-lightbox-pill"><CategoryIcon category={section.category} size={16} /> {CATEGORY[section.category] ?? "Activity"}</span>
          <h3>{section.title}</h3>
          <p>{section.text}</p>
          {section.highlights?.length > 0 && (
            <ul className="sl-lightbox-highlights">{section.highlights.slice(0, 4).map((h) => <li key={h}>{h}</li>)}</ul>
          )}
          {section.url && (
            <a className="sl-lightbox-link" href={section.url} target="_blank" rel="noopener noreferrer">Official page <span aria-hidden="true">↗</span></a>
          )}
        </div>
        <button type="button" className="sl-lightbox-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
    </div>,
    document.body
  );
}

export default function StudentLife({ onBack, uni }) {
  const data = uni?.studentLife;
  // only activities — older data may still contain housing / payments / offices
  const sections = useMemo(() => (data?.sections ?? []).filter((s) => CATEGORY[s.category]), [data]);
  const spans = useMemo(() => tileSpans(sections.length), [sections.length]);
  const [open, setOpen] = useState(null);

  return (
    <div className="student-life-page">
      {/* like Home: the header stays put, only the gallery below scrolls and fades out at the top */}
      <header className="sl-page-header">
        <div className="sl-top-row">
          <button className="sl-back-icon-btn" onClick={onBack} aria-label="Go back">
            <img src="/arrow-left.svg" alt="" className="sl-back-icon" />
          </button>
          <div className="sl-heading">
            <div className="sl-heading-title">Student Life</div>
            <div className="sl-heading-desc">{uni?.name ? `Clubs, events and creative life at ${uni.name}` : "Clubs, events, and campus culture."}</div>
          </div>
        </div>
        {sections.length > 0 && data.summary && <p className="sl-summary">{data.summary}</p>}
      </header>

      <div className="sl-scroll">
      {sections.length === 0 ? (
        <div className="sl-empty">
          <div className="sl-empty-icon"><CategoryIcon category="clubs" /></div>
          <div className="sl-empty-title">We haven't collected student activities for this school yet</div>
          <p className="sl-empty-text">Clubs, events, exhibitions and sport will appear here once our agent has read the school's official website.</p>
          {uni?.website && (
            <a className="sl-lightbox-link" href={uni.website} target="_blank" rel="noopener noreferrer">Visit the official website <span aria-hidden="true">↗</span></a>
          )}
        </div>
      ) : (
        <>
          <div className="sl-gallery">
            {sections.map((s, i) => (
              <Tile key={`${s.category}-${s.title}`} section={s} span={spans[i]} onOpen={() => setOpen(s)} />
            ))}
          </div>

          <p className="sl-source">Collected from {uni?.name}'s official website. Click a photo to see details and the source page.</p>
        </>
      )}
      </div>

      {open && <Lightbox section={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
