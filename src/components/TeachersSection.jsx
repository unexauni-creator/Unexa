import { getInitials } from "../lib/initials.js";
import "../styles/campus.css";

// Teachers of one school, collected by the Unexa agent from its official website (universities.faculty):
// how teaching works, studios and workshops, and teachers named on the site with a link to their page.
// No photos of people are stored: each teacher gets a monogram instead.
const TONES = ["t1", "t2", "t3", "t4", "t5"];
// "Prof. Dr. Sarah Ciston" → "SC": titles are not part of the monogram
const monogram = (name) => getInitials(name.replace(/\b(prof|professor|dr|mr|mrs|ms|mx|arch|ing|dott|dssa|mgr|hab|phd)\.?(\s|$)/gi, "").trim() || name);
const toneOf = (name) => TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

// "Graphic Design Master's Programs" and "Graphic Design Bachelor's Program" share their subject: "graphic design"
const subjectOf = (name) => String(name ?? "").toLowerCase()
  .replace(/\b(bachelor|master|masters|ba|ma|bfa|mfa|msc|bsc|phd|degree|programs?|programmes?|course|hons|of|in|the|arts?\s*\(hons\))\b|'s|[()&,:/-]/g, " ")
  .replace(/\s+/g, " ").trim();
function teachesOn(person, programme) {
  const want = subjectOf(programme);
  return (person.programmes ?? []).some((p) => p === programme || (want && (subjectOf(p) === want || subjectOf(p).includes(want) || want.includes(subjectOf(p)))));
}

export default function TeachersSection({ onBack, uni }) {
  const f = uni?.faculty;
  const allPeople = f?.people ?? [];
  // this course first; everyone else at the school below
  const people = allPeople.filter((p) => teachesOn(p, uni?.program));
  const others = allPeople.filter((p) => !people.includes(p));
  const studios = f?.studios ?? [];
  const hasAny = f && (f.summary || allPeople.length || studios.length);

  function renderPerson(p, i, withBio) {
    const Row = p.url ? "a" : "div";
    return (
      <Row key={p.name} className={`tc-row ${withBio && p.bio ? "has-bio" : ""}`} {...(p.url ? { href: p.url, target: "_blank", rel: "noopener noreferrer" } : {})}>
        <span className="tc-num">{String(i + 1).padStart(2, "0")}</span>
        <span className={`tc-mono ${toneOf(p.name)}`} aria-hidden="true">{monogram(p.name)}</span>
        <span className="tc-who">
          <span className="tc-name">{p.name}</span>
          {p.role && <span className="tc-role">{p.role}</span>}
          {withBio && p.bio && <span className="tc-bio">{p.bio}</span>}
          {!withBio && p.programmes?.[0] && <span className="tc-role">{p.programmes[0]}</span>}
        </span>
        {p.url && <span className="tc-arrow" aria-hidden="true">↗</span>}
      </Row>
    );
  }

  return (
    <div className="campus-page">
      <div className="dorm-top-row">
        <button className="dorm-back-icon-btn" onClick={onBack} aria-label="Go back">
          <img src="/arrow-left.svg" alt="" className="dorm-back-icon-img" />
        </button>
        <div className="dorm-heading">
          <div className="dorm-heading-title">Teachers</div>
          <div className="dorm-heading-desc">{uni?.program ? `Who teaches ${uni.program} at ${uni.name}` : uni?.name ? `Who teaches at ${uni.name}` : "Who teaches and how."}</div>
        </div>
      </div>

      {!hasAny ? (
        <div className="campus-empty">
          <div className="campus-empty-mark" aria-hidden="true">Aa</div>
          <div className="campus-empty-title">We haven't collected teachers for this school yet</div>
          <p className="campus-muted">Our agent reads each school's official website. Until then, you can find the faculty there.</p>
          {uni?.website && <a className="campus-btn" href={uni.website} target="_blank" rel="noopener noreferrer">Visit the official website ↗</a>}
        </div>
      ) : (
        <div className="tc-layout">
          {/* left: the editorial part, stays in view while the list scrolls */}
          <aside className="tc-intro">
            <div className="tc-kicker">How teaching works</div>
            {f.summary && <p className="tc-quote">{f.summary}</p>}

            <div className="tc-stats">
              {people.length > 0 && <div><strong>{people.length}</strong><span>on this course</span></div>}
              {studios.length > 0 && <div><strong>{studios.length}</strong><span>studios & labs</span></div>}
              {f.class_size && <div className="wide"><strong className="small">{f.class_size}</strong><span>class size</span></div>}
            </div>

            {f.visiting && (
              <div className="tc-note">
                <span className="tc-note-label">Visiting artists</span>
                {f.visiting}
              </div>
            )}

            {studios.length > 0 && (
              <div className="tc-studios">
                <div className="tc-kicker">Studios & workshops</div>
                <ul>{studios.map((s) => <li key={s}><span aria-hidden="true" />{s}</li>)}</ul>
              </div>
            )}
            {f.url && <a className="tc-link" href={f.url} target="_blank" rel="noopener noreferrer">All faculty on the school's website <span aria-hidden="true">→</span></a>}
          </aside>

          {/* right: the teachers of this course with their career, then others at the school */}
          <section className="tc-directory">
            {people.length > 0 ? (
              <>
                <div className="tc-dir-head"><span>Teaching on this course</span><span>{people.length}</span></div>
                {people.map((p, i) => renderPerson(p, i, true))}
              </>
            ) : (
              <div className="tc-dir-empty">The school's website doesn't say who teaches {uni?.program ? <b>{uni.program}</b> : "this course"}.{others.length ? " Here are teachers from other programmes at the school." : " See the faculty page for who teaches each programme."}</div>
            )}
            {others.length > 0 && (
              <details className="tc-others" open={people.length === 0}>
                <summary><span>Other teachers at {uni?.name}</span><span>{others.length}</span></summary>
                {others.map((p, i) => renderPerson(p, i, false))}
              </details>
            )}
            <p className="campus-source">Collected from {uni?.name}'s official website. Details can change, so check the linked pages.</p>
          </section>
        </div>
      )}
    </div>
  );
}
