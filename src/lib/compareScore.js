// "Best for you" on the Dashboard: reads the compared programmes' fields (free text from school sites),
// turns each criterion into a number, and ranks the programmes by the priorities the student picked.
import { daysBetween, nextDeadline } from "./roadmap.js";

// rough rates to EUR, only to put tuitions in different currencies on one scale
const TO_EUR = { "€": 1, EUR: 1, "$": 0.92, USD: 0.92, "£": 1.17, GBP: 1.17, "C$": 0.68, CAD: 0.68, zł: 0.23, PLN: 0.23, "₴": 0.022, UAH: 0.022, "₩": 0.00068, KRW: 0.00068, "¥": 0.0061, JPY: 0.0061, CNY: 0.13, RMB: 0.13, CHF: 1.05 };
const CUR_BY_COUNTRY = { "United Kingdom": "£", "United States": "$", Canada: "C$", Poland: "zł", Ukraine: "₴", "South Korea": "₩", Japan: "¥", China: "CNY" };

/** Yearly tuition in EUR, or null when the text gives no number. */
export function yearlyTuitionEur(p) {
  const text = String(p.tuition ?? "");
  if (/\b(free|no tuition|tuition-free|no fees)\b/i.test(text)) return 0;
  const m = text.match(/(C\$|[€$£₴₩¥]|zł|EUR|USD|GBP|CAD|PLN|UAH|KRW|JPY|CNY|RMB|CHF)?\s?(\d[\d,.\s]*\d|\d)\s?(C\$|[€$£₴₩¥]|zł|EUR|USD|GBP|CAD|PLN|UAH|KRW|JPY|CNY|RMB|CHF)?/i);
  let value = m ? Number(m[2].replace(/[\s,]/g, "").replace(/\.(?=\d{3}\b)/g, "")) : null;
  let cur = m ? (m[1] || m[3]) : null;
  if (!value && p.tuitionAmount > 0) value = p.tuitionAmount;
  if (!value) return null;
  cur = (cur || CUR_BY_COUNTRY[p.country] || "€").toUpperCase().replace("ZŁ", "zł");
  const rate = TO_EUR[cur] ?? TO_EUR[cur.toLowerCase()] ?? 1;
  const per = /semester|term/i.test(text) ? 2 : /month/i.test(text) ? 10 : /week/i.test(text) ? 40 : 1;
  return Math.round(value * rate * per);
}

/** Years of study, or null. */
export function durationYears(p) {
  const t = String(p.duration ?? "").toLowerCase();
  const n = Number(t.match(/(\d+(?:[.,]\d)?)/)?.[1]?.replace(",", "."));
  if (!n) return null;
  if (/semester/.test(t)) return n / 2;
  if (/month/.test(t)) return n / 12;
  if (/term|trimester|quarter/.test(t) && !/year/.test(t)) return n / 3;
  return n;
}

/** The language level asked for, on an IELTS-like scale (lower is easier to reach), or null. */
export function languageLevel(p) {
  const t = String(p.minLanguageLevel ?? "");
  const ielts = t.match(/IELTS[^\d]{0,12}(\d(?:\.\d)?)/i);
  if (ielts) return Number(ielts[1]);
  const toefl = t.match(/TOEFL[^\d]{0,12}(\d{2,3})/i);
  if (toefl) { const s = Number(toefl[1]); return s >= 110 ? 8 : s >= 102 ? 7.5 : s >= 94 ? 7 : s >= 79 ? 6.5 : s >= 60 ? 6 : 5.5; }
  const hsk = t.match(/HSK[^\d]{0,8}(\d)/i); // Chinese test, levels 1–6
  if (hsk) return [3, 3, 4, 5, 6, 6.5, 7][Number(hsk[1])] ?? null;
  const topik = t.match(/TOPIK[^\d]{0,12}(\d)/i); // Korean test, levels 1–6
  if (topik) return [3, 3.5, 4, 5, 6, 7, 8][Number(topik[1])] ?? null;
  const cefr = t.match(/\b([ABC][12])\b/i)?.[1]?.toUpperCase();
  if (cefr) return { A1: 3, A2: 4, B1: 5, B2: 6, C1: 7, C2: 8.5 }[cefr];
  return null;
}

/** Minimum grades on a 0–4 scale, or null. */
export function minGrade(p) {
  const n = Number(String(p.minCGPA ?? "").match(/(\d+(?:[.,]\d+)?)/)?.[1]?.replace(",", "."));
  if (!n) return null;
  if (n > 10) return (n / 100) * 4; // percent
  if (n > 5) return (n / 10) * 4;   // 10-point scale
  if (n > 4) return (n / 5) * 4;    // 5-point scale
  return n;
}

const hasScholarship = (p) => (p.scholarshipsText && !/^(none|no|n\/a)\b/i.test(p.scholarshipsText.trim()) ? 1 : 0);
function daysToDeadline(p) {
  const d = nextDeadline(p, null);
  return d ? daysBetween(new Date(), d.date) : null;
}

// higher: true when a bigger value is better
export const CRITERIA = [
  { id: "cost", label: "Low tuition", best: "Lowest tuition", get: yearlyTuitionEur, higher: false },
  { id: "scholarships", label: "Scholarships", best: "Lists scholarships", get: hasScholarship, higher: true },
  { id: "language", label: "Easy language entry", best: "Lowest language bar", get: languageLevel, higher: false },
  { id: "grades", label: "Easy grade entry", best: "Lowest grade requirement", get: minGrade, higher: false },
  { id: "deadline", label: "Time to apply", best: "Most time to apply", get: daysToDeadline, higher: true },
  { id: "duration", label: "Shorter programme", best: "Shortest programme", get: durationYears, higher: false },
];

export const DEFAULT_WEIGHTS = { cost: 3, scholarships: 2, language: 2, grades: 1, deadline: 2, duration: 1 };

/**
 * Ranks programmes by the chosen weights (0 = doesn't matter … 3 = very important).
 * A criterion counts only when at least two programmes have it and their values differ;
 * a programme without that field gets the middle score, so missing data can't win or lose on its own.
 * @returns {{ ranked: Array<{program, score, match, reasons: string[]}>, best: Record<string, any[]>, used: string[] }}
 */
export function rankPrograms(programs, weights) {
  const values = Object.fromEntries(CRITERIA.map((c) => [c.id, programs.map((p) => c.get(p))]));
  // a criterion counts only when at least two programmes have it and they differ
  const differs = (id) => { const k = values[id].filter((v) => v != null); return k.length >= 2 && Math.min(...k) !== Math.max(...k); };
  const used = CRITERIA.filter((c) => weights[c.id] > 0 && differs(c.id));
  const best = {};
  const norm = {};
  for (const c of CRITERIA) {
    const known = values[c.id].filter((v) => v != null);
    if (known.length < 2) continue;
    const lo = Math.min(...known), hi = Math.max(...known);
    norm[c.id] = values[c.id].map((v) => (v == null ? null : hi === lo ? 1 : c.higher ? (v - lo) / (hi - lo) : (hi - v) / (hi - lo)));
    const top = c.higher ? hi : lo;
    if (hi !== lo) best[c.id] = programs.filter((_, i) => values[c.id][i] === top).map((p) => p.id);
  }
  const ranked = programs.map((program, i) => {
    let sum = 0, w = 0;
    const strengths = [];
    for (const c of used) {
      // no data for this programme: counted as the middle, neither for nor against it
      const s = norm[c.id][i] ?? 0.5;
      sum += s * weights[c.id];
      w += weights[c.id];
      if (best[c.id]?.includes(program.id)) strengths.push({ label: c.best, weight: weights[c.id] });
    }
    const score = w ? sum / w : 0;
    return { program, score, match: Math.round(score * 100), reasons: strengths.sort((a, b) => b.weight - a.weight).map((s) => s.label).slice(0, 3) };
  }).sort((a, b) => b.score - a.score);
  return { ranked, best, used: used.map((c) => c.id) };
}
