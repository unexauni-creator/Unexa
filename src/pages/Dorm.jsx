import { lazy, Suspense } from "react";
import "../styles/campus.css";
import "../styles/student-life.css";

// Housing for one school, collected by the Unexa agent from its official website (universities.housing):
// whether the school has residences, the options with prices, how to apply, tips for private housing.
const AVAILABLE = {
  own: { label: "School residences", tone: "green" },
  partner: { label: "Partner housing", tone: "blue" },
  none: { label: "No school housing", tone: "orange" },
  unknown: { label: "Housing not stated", tone: "grey" },
};

// When the site gives a bare number ("318 / month"), show the school country's currency
const CURRENCY = { "United Kingdom": "£", "United States": "$", Canada: "C$", Poland: "zł", Ukraine: "₴", "South Korea": "₩", Japan: "¥", China: "¥", Switzerland: "CHF" };
const currencyOf = (country) => CURRENCY[country] ?? "€";

// "£230, £249, or £264 per week" → { value: 230, text: "£230 / week" }
function parsePrice(s, fallbackCur = "") {
  if (!s) return null;
  const m = String(s).match(/([£€$₴]|zł|PLN|EUR|GBP|USD|UAH)?\s?(\d[\d.,\s]*\d|\d)\s?([£€$₴]|zł|PLN|EUR|GBP|USD|UAH)?/i);
  if (!m) return null;
  const value = Number(m[2].replace(/[\s,]/g, "").replace(/\.(?=\d{3}\b)/g, ""));
  if (!value) return null;
  const cur = m[1] || m[3] || fallbackCur;
  const per = (String(s).match(/\b(week|month|year|term|semester|night)\b/i) || [])[1];
  const amount = /^([£€$₴₩¥]|C\$)$/.test(cur) ? `${cur}${value.toLocaleString("en-GB")}` : `${value.toLocaleString("en-GB")} ${cur}`.trim();
  return { value, text: per ? `${amount} / ${per.toLowerCase()}` : amount };
}

// the first date in a sentence, e.g. "open on 8 June" → "8 June"
const firstDate = (s) => (String(s ?? "").match(/\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2})\b/i) || [])[1] ?? null;

const DormMap = lazy(() => import("../components/DormMap"));
const walkText = (o) => (o.walk_min === 0 ? "On campus" : o.walk_min != null ? `${o.walk_min} min walk to the school` : o.distance);

function WalkIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.5" r="1.8" /><path d="M10 21l2-6 3 3v3M9 12l2-4 4 2 2 3M11 8l-2 5" /></svg>;
}

export default function Dorm({ onBack, uni }) {
  const h = uni?.housing;
  const options = h?.options ?? [];
  const hasAny = h && (h.summary || options.length || h.how_to_apply || h.available !== "unknown");
  // the dorm itself first; the school's photo only when no housing photo was found
  const photo = options.find((o) => o.image)?.image || h?.image || uni?.universityImage || uni?.image;
  const badge = AVAILABLE[h?.available] ?? AVAILABLE.unknown;
  const cur = currencyOf(uni?.country);
  const prices = options.map((o) => parsePrice(o.price, cur)).filter(Boolean).sort((a, b) => a.value - b.value);
  const opens = firstDate(h?.how_to_apply);
  // the at-a-glance row: only facts we actually have
  const glance = [
    { k: "Provided by", v: h?.provider || badge.label },
    prices.length ? { k: "Rooms from", v: prices[0].text } : options.length ? { k: "Options", v: `${options.length} residences` } : null,
    opens ? { k: "Applications", v: opens } : null,
    h?.city_rent ? { k: "Private rent", v: h.city_rent.replace(/^[^:]*:\s*/, "") } : null,
  ].filter(Boolean);

  return (
    <div className="student-life-page dm2">
      {/* the same container as Student Life: the header stays put, the content scrolls under it */}
      <header className="sl-page-header">
        <div className="sl-top-row">
          <button className="sl-back-icon-btn" onClick={onBack} aria-label="Go back">
            <img src="/arrow-left.svg" alt="" className="sl-back-icon" />
          </button>
          <div className="sl-heading">
            <div className="sl-heading-title">Dorm</div>
            <div className="sl-heading-desc">{uni?.name ? `Where students of ${uni.name} live` : "Housing options."}</div>
          </div>
        </div>
      </header>

      <div className="sl-scroll dm2-scroll">

      {!hasAny ? (
        <div className="campus-empty">
          <div className="campus-empty-mark" aria-hidden="true">⌂</div>
          <div className="campus-empty-title">We haven't found housing information for this school yet</div>
          <p className="campus-muted">Some schools keep it on a separate website. Check the official site, or ask in Community → Housing & Roommates.</p>
          {uni?.website && <a className="campus-btn" href={uni.website} target="_blank" rel="noopener noreferrer">Visit the official website ↗</a>}
        </div>
      ) : (
        <>
          <div className={`dm2-top${h.map?.school ? " has-map" : ""}`}>
          <section className="dm2-hero" style={photo ? { "--hero": `url("${photo}")` } : undefined}>
            <span className={`campus-badge ${badge.tone}`}>{badge.label}</span>
            <div className="dm2-hero-bottom">
              <h3 className="dm2-title">Living at<br />{uni?.name}</h3>
              {/* the key facts as small glass chips on the photo */}
              <div className="dm2-chips">
                {glance.filter((g) => g.k !== "Provided by" || h.provider).map((g) => <span key={g.k}><small>{g.k}</small>{g.v}</span>)}
              </div>
            </div>
          </section>
          {h.map?.school && (
            <Suspense fallback={<div className="dmap" />}>
              <DormMap school={h.map.school} schoolName={uni?.name} options={options} />
            </Suspense>
          )}
          </div>

          {/* how it works, in three short steps, built from what the official pages say */}
          <section className="dm2-how">
            <div className="dm2-step">
              <span className="dm2-n">1</span>
              <b>Pick what suits you</b>
              <p>{options.length > 1
                ? `${h.provider || uni?.name} has ${options.length} residences. They differ in price, room type and how far they are from campus, so compare them below.`
                : options.length === 1 ? `Students live at ${options[0].name}. Check the room types and price on its page.`
                : `${h.provider || uni?.name} helps students find a room. See the official housing page for what is available.`}</p>
            </div>
            <div className="dm2-step">
              <span className="dm2-n">2</span>
              <b>Apply for a room</b>
              <p>{h.how_to_apply || "Housing is a separate application from your study place. The dates are on the official housing page."}</p>
              {(h.apply_url || h.url) && <a className="dm2-step-link" href={h.apply_url || h.url} target="_blank" rel="noopener noreferrer">{h.apply_url ? "Apply for housing" : "Housing page"} ↗</a>}
            </div>
            <div className="dm2-step">
              <span className="dm2-n">3</span>
              <b>How places are given</b>
              <p>{h.allocation || h.guarantee || "Places are limited. The official housing page explains who gets one first, so apply as soon as you accept your study offer."}</p>
            </div>
          </section>

          {options.length > 0 && (
            <section>
              <div className="campus-section-head"><h3>Where you could live</h3><span className="campus-muted">{h.provider ? `From ${h.provider}` : "From official pages"}</span></div>
              <div className="dm-listings">
                {options.map((o, i) => {
                  const Card = o.url ? "a" : "div";
                  const price = parsePrice(o.price, cur);
                  return (
                    <Card key={o.name} className={`dm-listing${o.image ? " has-photo" : ""}`} {...(o.url ? { href: o.url, target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {o.image && (
                        <div className="dm-listing-photo">
                          <img src={o.image} alt="" loading="lazy" />
                          {price && <span className="dm-listing-pill">{price.text}</span>}
                        </div>
                      )}
                      {!o.image && (
                        <div className="dm-listing-top">
                          <span className="dm-index">{String(i + 1).padStart(2, "0")}</span>
                          {price ? <span className="dm-price">{price.text}</span> : <span className="dm-price muted">Price on their site</span>}
                        </div>
                      )}
                      <div className="dm-listing-name">{o.name}</div>
                      {o.type && <div className="dm-listing-type">{o.type}</div>}
                      {walkText(o) && <div className="dm-walk"><WalkIcon />{walkText(o)}</div>}
                      {o.url && <span className="dm-listing-go">See this residence <span aria-hidden="true">→</span></span>}
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          <section className="dm2-apply dm2-apply-one">
            <div className="dm2-apply-side">
              <div className="tc-kicker">If you rent privately</div>
              <p>{h.private_tips || "Start looking 2–3 months before you arrive, never pay a deposit before seeing a contract, and ask in Community → Housing & Roommates who is looking for a flatmate."}</p>
              {h.city_rent && <p className="dm2-rent">{h.city_rent}</p>}
            </div>
          </section>

          <div className="dm-foot">
            {h.url && <a className="tc-link" href={h.url} target="_blank" rel="noopener noreferrer">Official housing page <span aria-hidden="true">→</span></a>}
            <p className="campus-source">Collected from {h.provider ? `${h.provider} and ` : ""}{uni?.name}'s official pages. Prices and rules change, so check before you apply.</p>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
