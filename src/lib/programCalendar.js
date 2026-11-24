// Turns the school's calendar text ("12 October 2026 to 12 February 2027", "24 Dec. 2026 to 03 Jan. 2027",
// "01 May 2027 / 06 May 2027") into date ranges, so the Program tab can draw the academic year as a timetable.
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const DATE = /(\d{1,2})\.?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{4})?|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?/gi;

function datesIn(text, fallbackYear) {
  const out = [];
  for (const m of String(text ?? "").matchAll(DATE)) {
    const day = Number(m[1] ?? m[5]);
    const mon = MONTHS[(m[2] ?? m[4]).slice(0, 3).toLowerCase()];
    const year = Number(m[3] ?? m[6]) || null;
    out.push({ day, mon, year });
  }
  // a date without a year takes the year of the next one that has it (or the one before)
  for (let i = 0; i < out.length; i++) {
    if (out[i].year) continue;
    const next = out.slice(i + 1).find((d) => d.year);
    const prev = out.slice(0, i).reverse().find((d) => d.year);
    out[i].year = next ? (out[i].mon > next.mon ? next.year - 1 : next.year) : prev?.year ?? fallbackYear;
  }
  return out.filter((d) => d.year).map((d) => new Date(d.year, d.mon, d.day));
}

// one range per item: first date to last date ("/"-separated single days become separate one-day ranges)
export function rangesOf(item, fallbackYear) {
  const text = String(item?.dates ?? "");
  if (text.includes("/") && !/to|–|-|until|bis/i.test(text)) return datesIn(text, fallbackYear).map((d) => ({ start: d, end: d }));
  const ds = datesIn(text, fallbackYear);
  if (!ds.length) return [];
  const start = ds[0], end = ds[ds.length - 1];
  return [{ start, end: end < start ? start : end }];
}

// The academic year window: from the first month of the first semester, twelve months
export function yearWindow(calendar) {
  const fy = Number(String(calendar?.year ?? "").match(/\d{4}/)?.[0]) || new Date().getFullYear();
  const all = [...(calendar?.terms ?? []), ...(calendar?.breaks ?? []), ...(calendar?.exam_periods ?? [])].flatMap((x) => rangesOf(x, fy));
  if (!all.length) return null;
  const termStarts = (calendar?.terms ?? []).flatMap((x) => rangesOf(x, fy)).map((r) => r.start);
  const first = new Date(Math.min(...(termStarts.length ? termStarts : all.map((r) => r.start))));
  const start = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(start.getFullYear() + 1, start.getMonth(), 1);
  return { start, end, fallbackYear: fy };
}
