import { useEffect, useMemo, useRef, useState } from "react";

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

// Pinterest-style board: every photo keeps its own shape, with the activity's text on the photo.
// The first photo of an activity carries its full description, extra photos only the title.
function Pin({ section, image, main }) {
  const [broken, setBroken] = useState(false);
  const [pinHeight, setPinHeight] = useState(0);
  const pinRef = useRef(null);
  const showImage = image && !broken;
  // the blurred photo inside the glass plate lines up with the photo behind it
  useEffect(() => {
    const el = pinRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPinHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!showImage && !main) return null;
  const credit = section.credits?.[image];
  return (
    <article className={`sl-pin ${main ? "is-main" : "is-extra"} ${showImage ? "" : "is-placeholder"}`} ref={pinRef} style={{ "--pin-h": `${pinHeight}px` }}>
      {showImage ? (
        <img className="sl-pin-img" src={image} alt="" loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <div className="sl-pin-icon"><CategoryIcon category={section.category} size={36} /></div>
      )}
      <span className="sl-pin-pill">{CATEGORY[section.category] ?? "Activity"}</span>
      <div className="sl-pin-caption">
        {/* same frosted plate as the programme cards: a blurred copy of the photo, works in every browser */}
        {showImage && <img className="sl-pin-frost" src={image} alt="" aria-hidden="true" loading="lazy" />}
        <div className="sl-pin-tint" aria-hidden="true" />
        <h3 className="sl-pin-title">{section.title}</h3>
        {main && section.text && <div className="sl-pin-more"><p className="sl-pin-text">{section.text}</p></div>}
        {credit && (
          <a className="sl-pin-credit" href={credit.url} target="_blank" rel="noopener noreferrer">Photo: {credit.text}</a>
        )}
      </div>
    </article>
  );
}

export default function StudentLife({ onBack, uni }) {
  const data = uni?.studentLife;
  // only activities — older data may still contain housing / payments / offices
  const sections = useMemo(() => (data?.sections ?? []).filter((s) => CATEGORY[s.category]), [data]);
  // first photo of each activity with its text, then the extra photos spread through the board
  const pins = useMemo(() => {
    const main = sections.map((sec) => ({ section: sec, image: imagesOf(sec)[0] ?? null, main: true }));
    const extra = sections.flatMap((sec) => imagesOf(sec).slice(1).map((image) => ({ section: sec, image, main: false })));
    const out = [];
    main.forEach((p, i) => { out.push(p); if (extra[i]) out.push(extra[i]); });
    return [...out, ...extra.slice(main.length)];
  }, [sections]);

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
          <div className="sl-board">
            {pins.map((p, i) => <Pin key={`${p.section.title}-${i}`} {...p} />)}
          </div>

          <p className="sl-source">Collected from {uni?.name}'s official website. Details can change, so check the linked pages before you apply.</p>
        </>
      )}
      </div>

    </div>
  );
}
