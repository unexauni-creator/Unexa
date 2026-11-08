import "../styles/campus.css";

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

function WalkIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.5" r="1.8" /><path d="M10 21l2-6 3 3v3M9 12l2-4 4 2 2 3M11 8l-2 5" /></svg>;
}

export default function Dorm({ onBack, uni }) {
  const h = uni?.housing;
  const options = h?.options ?? [];
  const hasAny = h && (h.summary || options.length || h.how_to_apply || h.available !== "unknown");
  const photo = uni?.universityImage || uni?.image;
  const badge = AVAILABLE[h?.available] ?? AVAILABLE.unknown;
  const cur = currencyOf(uni?.country);
  const prices = options.map((o) => parsePrice(o.price, cur)).filter(Boolean).sort((a, b) => a.value - b.value);
  const opens = firstDate(h?.how_to_apply);

  return (
    <div className="campus-page">
      <div className="dorm-top-row">
        <button className="dorm-back-icon-btn" onClick={onBack} aria-label="Go back">
          <img src="/arrow-left.svg" alt="" className="dorm-back-icon-img" />
        </button>
        <div className="dorm-heading">
          <div className="dorm-heading-title">Dorm</div>
          <div className="dorm-heading-desc">{uni?.name ? `Where students of ${uni.name} live` : "Housing options."}</div>
        </div>
      </div>

      {!hasAny ? (
        <div className="campus-empty">
          <div className="campus-empty-mark" aria-hidden="true">⌂</div>
          <div className="campus-empty-title">We haven't found housing information for this school yet</div>
          <p className="campus-muted">Some schools keep it on a separate website. Check the official site, or ask in Community → Housing & Roommates.</p>
          {uni?.website && <a className="campus-btn" href={uni.website} target="_blank" rel="noopener noreferrer">Visit the official website ↗</a>}
        </div>
      ) : (
        <>
          {/* the school's own photo, a big title and the key facts in one strip */}
          <section className="dm-hero" style={photo ? { "--hero": `url("${photo}")` } : undefined}>
            <div className="dm-hero-top">
              <span className={`campus-badge ${badge.tone}`}>{badge.label}</span>
            </div>
            <div className="dm-hero-bottom">
              <h3 className="dm-hero-title">Living at<br />{uni?.name}</h3>
              <div className="dm-facts">
                {options.length > 0 && <div><span>Options</span><strong>{options.length}</strong></div>}
                {prices.length > 0 && <div><span>From</span><strong>{prices[0].text}</strong></div>}
                {opens && <div><span>Applications open</span><strong>{opens}</strong></div>}
                {!options.length && !prices.length && !opens && <div><span>Status</span><strong>{badge.label}</strong></div>}
              </div>
            </div>
          </section>

          {(h.summary || h.guarantee) && (
            <div className="dm-intro">
              {h.summary && <p className="dm-lead">{h.summary}</p>}
              {h.guarantee && <div className="dm-guarantee"><span>Who gets a place</span>{h.guarantee}</div>}
            </div>
          )}

          {options.length > 0 && (
            <section>
              <div className="campus-section-head"><h3>Where you could live</h3><span className="campus-muted">From the school's website</span></div>
              <div className="dm-listings">
                {options.map((o, i) => {
                  const Card = o.url ? "a" : "div";
                  const price = parsePrice(o.price, cur);
                  return (
                    <Card key={o.name} className="dm-listing" {...(o.url ? { href: o.url, target: "_blank", rel: "noopener noreferrer" } : {})}>
                      <div className="dm-listing-top">
                        <span className="dm-index">{String(i + 1).padStart(2, "0")}</span>
                        {price ? <span className="dm-price">{price.text}</span> : <span className="dm-price muted">Price on request</span>}
                      </div>
                      <div className="dm-listing-name">{o.name}</div>
                      {o.type && <div className="dm-listing-type">{o.type}</div>}
                      {o.distance && <div className="dm-walk"><WalkIcon />{o.distance}</div>}
                      {o.url && <span className="dm-listing-go">View on the school's site <span aria-hidden="true">→</span></span>}
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {(h.how_to_apply || h.apply_url || h.private_tips) && (
            <section className="dm-apply">
              <div className="dm-apply-main">
                <div className="tc-kicker">How to apply</div>
                {h.how_to_apply && <p>{h.how_to_apply}</p>}
                {h.apply_url && <a className="campus-btn" href={h.apply_url} target="_blank" rel="noopener noreferrer">Apply for housing ↗</a>}
              </div>
              {h.private_tips && (
                <div className="dm-apply-side">
                  <div className="tc-kicker">Renting privately</div>
                  <p>{h.private_tips}</p>
                </div>
              )}
            </section>
          )}

          <div className="dm-foot">
            {h.url && <a className="tc-link" href={h.url} target="_blank" rel="noopener noreferrer">Housing on the school's website <span aria-hidden="true">→</span></a>}
            <p className="campus-source">Collected from {uni?.name}'s official website. Prices and rules change, so check before you apply.</p>
          </div>
        </>
      )}
    </div>
  );
}
