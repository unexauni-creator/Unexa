// Builds a personal application plan from the programmes a student saved and the intake they chose
// in onboarding (profiles.start_year). Deadlines come from the school sites as free text
// ("15 January 2027", "June 15 (Autumn intake)", "Jan 19 – Feb 19"), so they are read here.

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DAY_MS = 86400000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), 28));

/** "Fall 2027" → 1 Sep 2027, "Spring 2028" → 1 Feb 2028; null when the student isn't sure yet. */
export function intakeDate(startYear) {
  const s = String(startYear ?? "").toLowerCase();
  const year = Number(s.match(/20\d\d/)?.[0]);
  if (!year) return null;
  if (/spring/.test(s)) return new Date(year, 1, 1);
  return new Date(year, 8, 1); // fall, or "2029 or later"
}

/** Every "day month [year]" / "month day[, year]" in a text. */
function findDates(text) {
  const t = String(text ?? "").toLowerCase();
  const out = [];
  const a = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_RE}\\.?(?:,?\\s+(20\\d\\d))?`, "g");
  const b = new RegExp(`${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?!\\d)(?:,?\\s+(20\\d\\d))?`, "g");
  for (const m of t.matchAll(a)) out.push({ at: m.index, end: m.index + m[0].length, day: +m[1], month: MONTHS.indexOf(m[2].slice(0, 3)), year: m[3] ? +m[3] : null });
  for (const m of t.matchAll(b)) out.push({ at: m.index, end: m.index + m[0].length, day: +m[2], month: MONTHS.indexOf(m[1].slice(0, 3)), year: m[3] ? +m[3] : null });
  // a year written once at the end ("Jan 19 – Feb 19, 2026") belongs to the dates before it
  const tailYear = Number(t.match(/(20\d\d)(?!.*20\d\d)/)?.[1]) || null;
  const dates = out.filter((d) => d.month >= 0 && d.day >= 1 && d.day <= 31).sort((x, y) => x.at - y.at);
  return dates
    // "19 Jan – 19 Feb": the deadline is the end of the range, not its start
    .filter((d, i) => !(dates[i + 1] && /^\s*(-|–|—|to|until|till)\s*$/.test(t.slice(d.end, dates[i + 1].at))))
    // "Starts 1 March": a start date, not a deadline
    .filter((d) => !/(start|begin|commence)s?\s*(on\s*)?$/.test(t.slice(Math.max(0, d.at - 16), d.at)))
    .map((d) => ({ ...d, year: d.year ?? tailYear }));
}

/**
 * The application deadline of a programme for the student's intake: the last one before the start month.
 * Schools publish last year's dates too; such dates are moved to the coming year and marked as expected.
 * @returns {{date: Date, expected: boolean} | null}
 */
export function nextDeadline(program, start, today = new Date()) {
  const text = [program.applicationDeadline, program.submissionPeriod].filter(Boolean).join(" ; ");
  const found = findDates(text);
  if (!found.length) return null;
  const limit = start ? addMonths(start, -1) : addMonths(today, 24);
  let best = null;
  for (const f of found) {
    let year = f.year ?? today.getFullYear();
    let expected = !f.year;
    let date = new Date(year, f.month, f.day);
    while (date < startOfDay(today)) { year += 1; date = new Date(year, f.month, f.day); expected = true; }
    if (date > limit) continue;
    if (!best || date > best.date) best = { date, expected };
  }
  // nothing before the start month: show the first coming date anyway, so the student still sees it
  if (!best) {
    const f = found[0];
    let date = new Date(f.year ?? today.getFullYear(), f.month, f.day);
    let expected = !f.year;
    while (date < startOfDay(today)) { date = new Date(date.getFullYear() + 1, f.month, f.day); expected = true; }
    best = { date, expected };
  }
  return best;
}

/** What a programme asks for, from the fields the agent collected, plus what every art school asks for. */
export function programChecklist(p) {
  const items = [
    { id: "portfolio", label: "Portfolio ready" },
    { id: "letter", label: "Motivation letter written" },
  ];
  if (p.minLanguageLevel || p.documents?.language) items.push({ id: "language", label: `Language certificate${p.minLanguageLevel ? ` (${p.minLanguageLevel})` : ""}` });
  items.push({ id: "diploma", label: p.documents?.diploma ? "Diploma and transcripts (translated)" : "Diploma and transcripts" });
  if (p.documents?.bankStatement) items.push({ id: "bank", label: "Bank statement" });
  items.push({ id: "submitted", label: `Application sent${p.applicationFee ? ` (fee: ${p.applicationFee})` : ""}` });
  return items;
}

/**
 * Stages of the whole plan, with dates counted back from the earliest deadline.
 * Each step has an id (for the checklist saved in the account), a date and the stage it belongs to.
 */
export function buildPlan({ programs, startYear, today = new Date() }) {
  const start = intakeDate(startYear);
  const withDeadlines = programs.map((p) => ({ program: p, deadline: nextDeadline(p, start, today) }));
  const dated = withDeadlines.filter((x) => x.deadline).sort((a, b) => a.deadline.date - b.deadline.date);
  const first = dated[0]?.deadline.date ?? (start ? addMonths(start, -8) : addMonths(today, 6));
  const last = dated.at(-1)?.deadline.date ?? first;
  const startDate = start ?? addMonths(first, 8);
  const at = (d) => (d < today ? startOfDay(today) : d);

  const steps = [
    { id: "shortlist", stage: "research", title: "Shortlist 3–5 programmes", hint: "Save the ones you like on Home, then compare them on Dashboard.", date: at(addMonths(first, -6)) },
    { id: "requirements", stage: "research", title: "Read each programme's requirements", hint: "Portfolio size, language level, documents and fees differ a lot.", date: at(addMonths(first, -5)) },
    { id: "portfolio-start", stage: "portfolio", title: "Start your portfolio", hint: "Choose 10–20 of your strongest works and plan what is missing.", date: at(addMonths(first, -5)) },
    { id: "language-book", stage: "tests", title: "Book a language test", hint: "IELTS, TOEFL or the test the school asks for. Results take 2–3 weeks.", date: at(addMonths(first, -4)) },
    { id: "language-take", stage: "tests", title: "Take the language test", hint: "Leave time to retake it if the score is too low.", date: at(addMonths(first, -2)) },
    { id: "letter", stage: "portfolio", title: "Write your motivation letter", hint: "Why this school, why this programme, what you want to make.", date: at(addDays(first, -45)) },
    { id: "documents", stage: "apply", title: "Translate diploma and transcripts", hint: "Certified translations can take a few weeks.", date: at(addDays(first, -30)) },
    { id: "portfolio-done", stage: "portfolio", title: "Finish the portfolio", hint: "Ask a teacher or a friend for honest feedback first.", date: at(addDays(first, -21)) },
    { id: "apply", stage: "apply", title: "Send your applications", hint: dated.length > 1 ? `${dated.length} deadlines, the last on ${fmt(last)}.` : "Submit before the deadline, not on the day.", date: at(first) },
    { id: "interview", stage: "apply", title: "Prepare for interviews", hint: "Many art schools talk through your portfolio online.", date: at(addDays(first, 21)) },
    { id: "visa", stage: "visa", title: "Apply for a student visa", hint: "Start as soon as you have an offer; it can take 2–3 months.", date: at(addMonths(startDate, -4)) },
    { id: "housing", stage: "visa", title: "Find housing", hint: "Check the school's dorms first; they fill up early.", date: at(addMonths(startDate, -3)) },
    { id: "start", stage: "start", title: "Start your studies", hint: "Arrive a week early for orientation.", date: startDate },
  ].sort((a, b) => a.date - b.date);

  return { start: startDate, startKnown: Boolean(start), deadlines: dated, undated: withDeadlines.filter((x) => !x.deadline).map((x) => x.program), steps };
}

export const STAGES = [
  { id: "research", label: "Research" },
  { id: "portfolio", label: "Portfolio" },
  { id: "tests", label: "Tests" },
  { id: "apply", label: "Apply" },
  { id: "visa", label: "Visa & housing" },
  { id: "start", label: "Start" },
];

export function fmt(d, withYear = true) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });
}

// ── Editable to-do list ──────────────────────────────────────────────────────
// The plan above only seeds the list; after that the student owns it: rename, re-date, add, delete, move.
// Saved in profiles.roadmap_progress as { version: 2, tasks: [...] }.
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromIso = (s) => (s ? new Date(`${s}T00:00:00`) : null);
export const newId = () => Math.random().toString(36).slice(2, 10);

export function seedTasks(plan) {
  const tasks = plan.steps
    .filter((s) => s.id !== "apply")
    .map((s) => ({ id: s.id, title: s.title, note: s.hint, date: iso(s.date), stage: s.stage, status: "todo" }));
  return tasks;
}

/** One "Apply" task per saved programme, added when the programme is saved; never removed automatically. */
export function withProgramTasks(tasks, plan, programs) {
  const have = new Set(tasks.filter((t) => t.programId).map((t) => String(t.programId)));
  const added = programs
    .filter((p) => !have.has(String(p.id)))
    .map((p) => {
      const d = plan.deadlines.find((x) => x.program.id === p.id)?.deadline;
      return {
        id: `apply-${p.id}`, programId: p.id, stage: "apply", status: "todo",
        title: `Apply: ${p.program}`, note: `${p.name}${d?.expected ? " · date based on last year" : ""}`,
        date: d ? iso(d.date) : "",
      };
    });
  return added.length ? [...tasks, ...added] : tasks;
}
