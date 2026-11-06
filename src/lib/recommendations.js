// Recommendations for the Home page, based on the answers given during onboarding (table: profiles).
// Each programme gets points for what it matches; a programme must match the student's field of study
// (or, if they chose none, their country) to be recommended.

// Onboarding option → words to look for in the programme name and description
const FIELD_WORDS = {
  "Graphic Design": ["graphic", "visual communication", "communication design", "typograph", "grafik", "grafica", "grafika"],
  "Product / UX Design": ["product design", "ux", "interaction", "user experience", "digital product", "service design"],
  "Fine Arts": ["fine art", "painting", "sculpture", "drawing", "visual arts", "pittura", "scultura", "malerei", "printmaking", "intermedia"],
  Architecture: ["architect", "urban", "landscape"],
  "Fashion Design": ["fashion", "costume", "clothing", "textile", "moda"],
  "Film & Animation": ["film", "cinema", "animation", "television", "directing", "motion picture", "media art", "audiovisual"],
  Illustration: ["illustration", "comic", "printed image"],
  Photography: ["photo"],
  "Interior Design": ["interior", "spatial", "scenograph", "stage design"],
  "Game Design": ["game", "video game", "interactive"],
  "Industrial Design": ["industrial design", "object design", "product design", "design engineering"],
  "Art History": ["art history", "history of art", "curator", "art theory", "art research", "storia dell"],
};

const LEVEL_TO_DEGREES = {
  Bachelor: ["Bachelor"],
  Master: ["Master"],
  "Foundation year": ["Foundation Year"],
  "Short course / Summer school": ["Short Course", "Summer School"],
};

const FORMAT_TO_VALUE = { "On campus": "On Campus", Hybrid: "Hybrid", Online: "Online" };
const BUDGET_LIMIT = { "Under $5,000": 5000, "$5,000 – $15,000": 15000, "$15,000 – $30,000": 30000 };

const fold = (s) => ` ${String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ")}`;
// whole words or word beginnings only: "ux" must not match "luxury", nor "moda" match "modal"
const hasWord = (text, word) => text.includes(` ${word}`);

export function hasPreferences(profile) {
  return Boolean(profile?.study_fields?.length || profile?.countries?.length || profile?.study_level);
}

function scoreProgram(p, profile) {
  const name = fold(p.program);
  const about = fold(`${p.curriculumSummary ?? ""}`);
  const reasons = [];
  let score = 0;

  // field of study matters most; a match in the programme name beats one in its description
  let fieldMatch = null;
  for (const field of profile.study_fields ?? []) {
    const words = FIELD_WORDS[field] ?? [fold(field).trim()];
    if (words.some((w) => hasWord(name, w))) { fieldMatch = field; score += 10; break; }
    if (!fieldMatch && words.some((w) => hasWord(about, w))) { fieldMatch = field; score += 4; }
  }
  if (fieldMatch) reasons.push(fieldMatch);

  const countryMatch = profile.countries?.includes(p.country);
  if (countryMatch) { score += 5; reasons.push(p.country); }

  const degrees = LEVEL_TO_DEGREES[profile.study_level];
  if (degrees?.includes(p.degree)) { score += 4; reasons.push(p.degree); }

  // language: a programme taught in "French/English" suits anyone who chose either
  const langs = profile.languages ?? [];
  if (langs.some((l) => (p.language ?? "").split("/").includes(l))) score += 2;

  const format = (profile.formats ?? []).map((f) => FORMAT_TO_VALUE[f]);
  if (format.includes(p.format)) score += 1;

  // tuition_amount = 0 means "unknown", so it neither helps nor hurts
  const limit = BUDGET_LIMIT[profile.budget];
  if (limit && p.tuitionAmount > 0) score += p.tuitionAmount <= limit ? 2 : -3;

  const priorities = profile.priorities ?? [];
  if (priorities.includes("Scholarships & funding") && p.scholarshipsText) score += 2;
  if (priorities.includes("Internships & industry links") && p.internship) score += 2;

  const relevant = profile.study_fields?.length ? Boolean(fieldMatch) : Boolean(countryMatch);
  return { score: relevant ? score : 0, reasons };
}

// The best programmes for this student: at most 2 per school, so the list isn't one university.
export function recommendPrograms(programs, profile, limit = 6) {
  if (!hasPreferences(profile)) return [];
  const ranked = programs
    .map((p) => ({ p, ...scoreProgram(p, profile) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const perSchool = new Map();
  const out = [];
  for (const r of ranked) {
    const n = perSchool.get(r.p.universityId) ?? 0;
    if (n >= 2) continue;
    perSchool.set(r.p.universityId, n + 1);
    out.push({ program: r.p, reasons: r.reasons.slice(0, 3) });
    if (out.length >= limit) break;
  }
  return out;
}
