// Small animated charts for the "Unexa today" numbers, drawn from the real data in the database
// (with the last known values when the page can't reach it). They play once, when they come on screen.
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];
const view = { once: true, amount: 0.4 };

/** Schools per country: bars that grow. */
export function CountryBars({ byCountry }) {
  const rows = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...rows.map((r) => r[1]), 1);
  return (
    <div className="sc-bars">
      {rows.map(([c, n], i) => (
        <div key={c} className="sc-bar-row">
          <span className="sc-bar-label">{c.replace("United Kingdom", "UK").replace("United States", "USA")}</span>
          <span className="sc-bar-track">
            <motion.i initial={{ width: 0 }} whileInView={{ width: `${(n / max) * 100}%` }} viewport={view} transition={{ duration: 1, ease: EASE, delay: 0.15 + i * 0.08 }} />
          </span>
          <span className="sc-bar-n">{n}</span>
        </div>
      ))}
    </div>
  );
}

/** Programmes by degree: one stacked bar plus a legend. */
export function DegreeSplit({ byDegree }) {
  const parts = Object.entries(byDegree).filter(([, n]) => n > 0);
  const total = parts.reduce((s, [, n]) => s + n, 0) || 1;
  const tones = ["#614E45", "#AC8876", "#D2B8A6", "#E8DCCF", "#F1EAE2"];
  return (
    <div className="sc-split">
      <div className="sc-split-bar">
        {parts.map(([k, n], i) => (
          <motion.i key={k} style={{ background: tones[i % tones.length] }}
            initial={{ width: 0 }} whileInView={{ width: `${(n / total) * 100}%` }} viewport={view} transition={{ duration: 1.1, ease: EASE, delay: 0.15 + i * 0.12 }} />
        ))}
      </div>
      <ul className="sc-legend">
        {parts.map(([k, n], i) => (
          <motion.li key={k} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={view} transition={{ duration: 0.5, ease: EASE, delay: 0.5 + i * 0.08 }}>
            <i style={{ background: tones[i % tones.length] }} />{k}<b>{n}</b>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/** Countries: names that pop in one after another. */
export function CountryChips({ countries }) {
  return (
    <div className="sc-chips">
      {countries.map((c, i) => (
        <motion.span key={c} initial={{ opacity: 0, scale: 0.7, y: 10 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={view}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 + i * 0.06 }}>{c}</motion.span>
      ))}
    </div>
  );
}

/** Student groups: their topics, scrolling up slowly. */
export function GroupTicker({ groups }) {
  // two identical blocks, so moving up by exactly one block loops without a jump
  const block = (k) => <div className="sc-ticker-block" key={k}>{groups.map((g) => <span key={g}><i>✳</i>{g}</span>)}</div>;
  return (
    <div className="sc-ticker" aria-hidden="true">
      <div className="sc-ticker-col">{block("a")}{block("b")}</div>
    </div>
  );
}
