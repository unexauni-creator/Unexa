// Smart search over programme cards (output of mapSpecialty).
// - ignores case and accents ("ecole" finds "École")
// - every word must match somewhere ("fashion paris master")
// - understands a few aliases ("uk", "korea", "ma", "ba"...)
// - ranks: programme name > university name > city/country > other details

export const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, " ")
    .trim();

const ALIASES = {
  uk: "united kingdom", england: "united kingdom", london: "london",
  korea: "south korea", seoul: "seoul",
  usa: "united states", us: "united states", america: "united states",
  ba: "bachelor", bsc: "bachelor", bfa: "bachelor", undergraduate: "bachelor",
  ma: "master", msc: "master", mfa: "master", masters: "master", graduate: "master",
  foundation: "foundation year", summer: "summer school", online: "online",
  francais: "french", english: "english", deutsch: "german",
  fashion: "fashion", graphic: "graphic", photo: "photo", film: "film", animation: "animation",
};

// true when a and b differ by at most one letter (typo, missing or extra letter)
function oneEditAway(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

// typo match: the word is one letter off from a word (or the start of a word) in the text
function fuzzyIn(text, token) {
  if (token.length < 4) return false;
  return text.split(" ").some((w) => oneEditAway(w, token) || (w.length > token.length && oneEditAway(w.slice(0, token.length), token)));
}

function fields(u) {
  return [
    [norm(u.program), 10],
    [norm(u.name), 6],
    [norm(`${u.desc} ${u.country}`), 4],
    [norm(`${u.degree} ${u.language} ${u.format}`), 3],
    [norm(`${u.curriculumSummary ?? ""} ${u.description ?? ""}`), 1],
  ];
}

// Returns a score (0 = no match).
export function scoreMatch(u, query) {
  const tokens = norm(query).split(" ").filter(Boolean);
  if (!tokens.length) return 1;
  const f = fields(u);
  let total = 0;
  for (const raw of tokens) {
    const variants = [raw, ALIASES[raw]].filter(Boolean);
    let best = 0;
    for (const [text, weight] of f) {
      for (const t of variants) {
        if (!text.includes(t)) continue;
        // a whole word / word start counts more than a match in the middle of a word
        const atWord = (" " + text).includes(" " + t);
        best = Math.max(best, weight * (atWord ? 2 : 1));
      }
    }
    if (!best) {
      // allow one typo, but such matches rank lower
      for (const [text, weight] of f) if (fuzzyIn(text, raw)) best = Math.max(best, weight * 0.5);
    }
    if (!best) return 0;
    total += best;
  }
  // exact or prefix match on the programme name goes first
  const q = norm(query);
  const program = norm(u.program);
  if (program === q) total += 50;
  else if (program.startsWith(q)) total += 20;
  return total;
}

export function searchPrograms(list, query) {
  if (!norm(query)) return list;
  return list
    .map((u) => ({ u, s: scoreMatch(u, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.u);
}

// Suggestions for the dropdown: programmes, universities and places that match what was typed.
export function buildSuggestions(list, query, limit = 7) {
  const q = norm(query);
  if (!q) return [];
  const seen = new Set();
  const out = [];
  const push = (type, label, sub, target) => {
    const key = `${type}|${norm(label)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ type, label, sub, target });
  };
  const ranked = searchPrograms(list, query);
  for (const u of ranked) {
    if (norm(u.name).includes(q)) push("university", u.name, u.desc, null);
  }
  for (const u of ranked) push("program", u.program, u.name, u);
  for (const u of list) {
    const place = u.desc?.split(",")[0]?.trim();
    if (place && norm(place).startsWith(q)) push("place", place, u.country, null);
    if (u.country && (" " + norm(u.country)).includes(" " + q)) push("place", u.country, "Country", null);
  }
  // places and universities first, then programmes
  const order = { place: 0, university: 1, program: 2 };
  return out.sort((a, b) => order[a.type] - order[b.type]).slice(0, limit);
}

// Splits text into parts so the typed part can be shown in bold.
const fold = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function highlight(text, query) {
  const t = String(text ?? "");
  const q = fold(query).trim();
  const n = fold(t);
  const i = q ? n.indexOf(q) : -1;
  if (i < 0 || n.length !== t.length) return [{ text: t, hit: false }];
  return [
    { text: t.slice(0, i), hit: false },
    { text: t.slice(i, i + q.length), hit: true },
    { text: t.slice(i + q.length), hit: false },
  ].filter((p) => p.text);
}
