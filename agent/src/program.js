// The Program tab, from each school's official website: what a student will learn and when.
// The subjects year by year, the academic year (semesters, holidays, exam periods), how exams work,
// the internship, the final project and the programme's own page. Facts already shown on the
// Information tab (degree, length, language, fees) are not collected here.
//  1. collects every link of the school's site (home, sections, sitemap.xml), PDFs included;
//  2. AI picks each programme's own page, its curriculum / module pages and study-plan PDFs;
//  3. reads them and writes specialties.program_details (and description, if it is empty).
// Results are kept in out/program-<school>.json, so a run that stops continues where it left off,
// and --save-only writes those files to the database without reading the sites again.
//
//   npm run program -- --dry-run --only "RISD"     show what would be written
//   npm run program                                every school whose programmes have no details yet
//   npm run program -- --force                     every school again
//   npm run program -- --save-only                 write the saved results (after sql/010_program_details.sql)
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { generateStructured, aiProvider } from "./extract.js";
import { getSupabase, SPECIALTY_FK } from "./db.js";
import { HUB, collectLinks, readPages } from "./site.js";

const { values: args } = parseArgs({
  options: {
    only: { type: "string" },
    limit: { type: "string", default: "100" },
    pages: { type: "string", default: "14" }, // pages per group of programmes
    pdfs: { type: "string", default: "4" },
    batch: { type: "string", default: "5" }, // programmes per AI request
    force: { type: "boolean", default: false },
    "save-only": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});
const dryRun = args["dry-run"];
const supabase = getSupabase();
const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const done = (f) => access(f).then(() => true, () => false);
await mkdir("out", { recursive: true });

function sameProgram(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const ta = new Set(x.split(" ")), tb = new Set(y.split(" "));
  return [...ta].filter((t) => tb.has(t)).length / Math.min(ta.size, tb.size) >= 0.75;
}

const Details = z.object({
  name: z.string().describe("Programme name exactly as given in the list"),
  url: z.string().nullable().describe("The programme's own official page, copied from the input"),
  structure: z.array(z.object({
    period: z.string().describe("e.g. 'Year 1', 'Semester 1', 'Semesters 1-2', 'Foundation year'"),
    focus: z.string().nullable().describe("One short sentence: what this period is about"),
    modules: z.array(z.string()).describe("The subjects / courses / modules studied in this period, as the school names them, translated to English, at most 12"),
  })).describe("The subjects, in order of study. Empty if the pages don't say"),
  electives: z.array(z.string()).describe("Elective or optional subjects the student can choose, at most 10"),
  exams: z.string().nullable().describe("1-2 sentences: how and when students are assessed (end-of-semester exams, juries, portfolio reviews, interim exam after semester 4...)"),
  internship: z.string().nullable().describe("1-2 sentences: is there an internship or work placement, is it compulsory, when and how long. Null if not stated"),
  final_project: z.string().nullable().describe("1 sentence on the final project / thesis / degree show, if stated"),
  confidence: z.number().describe("0-1: how sure you are these facts are about THIS programme"),
});
const Result = z.object({ programmes: z.array(Details) });

const SYSTEM = `You collect facts for Unexa, a platform that helps students choose a creative school abroad.
You receive plain text of pages (and maybe PDFs) from ONE school's official website, in any language.
For each programme in the list, say what a prospective student will learn and when: the subjects year by year or semester by semester (from the curriculum, study plan or module handbook), electives, how exams and assessment work, the internship, the final project.
Write in English, short and concrete. Translate subject names to English. Use only what the pages say about THAT programme; never invent subjects or numbers. Leave a field null or empty when the pages don't say, and lower confidence when a page is about a different programme or the whole school. Every url must come from the input.`;

const Plan = z.object({ pages: z.array(z.object({ url: z.string(), for: z.string() })) });

// The academic year is the same for every programme of a school: read it once
const Calendar = z.object({
  year: z.string().nullable().describe("Academic year the dates are for, e.g. '2025/26'"),
  terms: z.array(z.object({ name: z.string().describe("e.g. 'Winter semester', 'Autumn term'"), dates: z.string().describe("Start and end as stated, e.g. '1 Oct 2025 – 31 Mar 2026'") })).describe("Semesters / terms and their teaching or lecture periods"),
  breaks: z.array(z.object({ name: z.string().describe("e.g. 'Christmas holidays', 'Lecture-free period', 'Summer break'"), dates: z.string() })).describe("Holidays and breaks with dates"),
  exam_periods: z.array(z.object({ name: z.string(), dates: z.string() })).describe("Exam sessions or jury periods with dates"),
  url: z.string().nullable().describe("The calendar page, copied from the input"),
});
async function schoolCalendar(uni, links) {
  const cal = /calendar|kalender|calendario|calendrier|kalendarz|academic year|semester ?dates|term ?dates|semesterzeit|vorlesungszeit|lecture period|holiday|ferien|vacanz|vacances|ferie|exam session|sessione|anno accademico|rok akademicki|harmonogram|академ|학사일정/i;
  const cands = [...links].filter(([u, t]) => cal.test(`${u} ${t}`)).slice(0, 300);
  if (!cands.length) return null;
  const { data } = await generateStructured({
    system: "From the list of links of a university's official website, choose the pages or PDFs with the CURRENT or next academic calendar: semester / term dates, holidays and breaks, exam periods. At most 5 URLs, copied exactly. Never invent URLs.",
    user: `University: ${uni.name}\n\n${cands.map(([u, t]) => `${u} | ${t}`).join("\n")}`,
    schema: Plan,
  });
  const urls = [...new Set(data.pages.map((p) => p.url).filter((u) => links.has(u)))].slice(0, 5);
  const { pages, pdfs } = await readPages(urls, () => {}, { maxPdfs: 2, maxChars: 14000 });
  if (!pages.length && !pdfs.length) return null;
  const { data: c } = await generateStructured({
    system: `You read a university's official academic calendar. Give the semesters / terms, holidays and breaks, and exam periods with their dates, for the most recent academic year the pages show (prefer ${new Date().getFullYear()}/${String(new Date().getFullYear() + 1).slice(2)} or later). Write names in English and dates as stated (translate month names). Never invent dates; leave lists empty when the pages don't say.`,
    user: `University: ${uni.name}\n\n${pages.map((p) => `=== PAGE: ${p.url} ===\n${p.text}`).join("\n\n")}` + (pdfs.length ? `\n\nAttached PDFs, in order:\n${pdfs.map((p) => p.url).join("\n")}` : ""),
    schema: Calendar,
    pdfs,
  });
  const all = [...pages.map((p) => p.url), ...pdfs.map((p) => p.url)];
  const out = { year: c.year, terms: c.terms.slice(0, 4), breaks: c.breaks.slice(0, 8), exam_periods: c.exam_periods.slice(0, 6), url: c.url && all.includes(c.url) ? c.url : all[0] ?? null };
  return out.terms.length || out.breaks.length || out.exam_periods.length ? out : null;
}
async function planPages(uni, group, links) {
  const words = (s) => norm(s).split(" ").filter((w) => w.length > 3);
  const ranked = [...links].map(([u, t]) => {
    const hay = norm(`${u} ${t}`);
    const score = (HUB.test(`${u} ${t}`) ? 1 : 0) + (/curricul|module|study plan|studienplan|piano di studi|plan studiow|syllab|course structure|programme structure/i.test(`${u} ${t}`) ? 3 : 0)
      + (/\.pdf$/i.test(u) ? 1 : 0) + group.reduce((a, s) => a + (words(s.name).some((w) => hay.includes(w)) ? 3 : 0), 0);
    return { u, t, score };
  }).sort((a, b) => b.score - a.score).slice(0, 1000);
  const system = `You help an agent read a university's official website. From the list of links, choose for each listed programme:
1. the programme's own page (the site may name it in its own language, e.g. "Pittura" = Painting, "Grafika" = Graphic Design);
2. its curriculum / modules / study plan / module handbook (page or PDF);
3. its exam or study regulations (assessment, exams) and internship / work placement page, if separate.
Return at most ${args.pages} URLs, copied exactly from the list. Never invent URLs.`;
  const user = `University: ${uni.name} (${uni.city}, ${uni.country})\nProgrammes:\n${group.map((s) => `- ${s.name} (${s.degree ?? "?"})`).join("\n")}\n\nLinks (url | link text):\n${ranked.map((r) => `${r.u} | ${r.t}`).join("\n")}`;
  const { data } = await generateStructured({ system, user, schema: Plan });
  return [...new Set(data.pages.map((p) => p.url).filter((u) => links.has(u)))].slice(0, Number(args.pages));
}

const clean = (d, pageUrls) => {
  const list = (a, n) => [...new Set((a ?? []).map((x) => String(x).trim()).filter(Boolean))].slice(0, n);
  return {
    url: d.url && pageUrls.includes(d.url) ? d.url : null,
    structure: (d.structure ?? []).map((p) => ({ period: p.period, focus: p.focus?.trim() || null, modules: list(p.modules, 12) })).filter((p) => p.modules.length || p.focus).slice(0, 10),
    electives: list(d.electives, 10),
    exams: d.exams?.trim() || null,
    internship: d.internship?.trim() || null,
    final_project: d.final_project?.trim() || null,
  };
};
const filledCount = (x) => ["exams", "internship", "final_project"].filter((k) => x[k]).length + (x.structure.length ? 2 : 0) + (x.electives.length ? 1 : 0) + (x.calendar?.terms?.length ? 1 : 0);

const { data: unis, error } = await supabase.from("universities").select("id,name,city,country,website_url").order("name");
if (error) throw new Error(error.message);
const { data: specs, error: sErr } = await supabase.from("specialties").select("*");
if (sErr) throw new Error(sErr.message);
const hasColumn = specs.length > 0 && "program_details" in specs[0];
if (!hasColumn && !dryRun) console.log("! Колонки program_details ще немає: результати зберігаю у файли out/program-*.json. Після sql/010_program_details.sql запустіть npm run program -- --save-only\n");

async function save(uni, rows) {
  if (dryRun || !hasColumn) return 0;
  let n = 0;
  for (const spec of specs.filter((s) => s[SPECIALTY_FK] === uni.id)) {
    const found = rows.find((r) => sameProgram(r.name, spec.name));
    if (!found || found.confidence < 0.5 || filledCount(found.details) < 1) continue;
    const patch = { program_details: { ...found.details, collected_at: found.collected_at } };
    const { error: e } = await supabase.from("specialties").update(patch).eq("id", spec.id);
    if (e) { console.log(`   ✗ ${spec.name}: ${e.message}`); continue; }
    n++;
  }
  return n;
}

let list = unis.filter((u) => u.website_url && specs.some((s) => s[SPECIALTY_FK] === u.id && (args.force || !s.program_details)));
if (args.only) list = unis.filter((u) => norm(u.name).includes(norm(args.only)));

if (args["save-only"]) {
  if (!hasColumn) { console.log("Спершу виконайте sql/010_program_details.sql у Supabase → SQL Editor."); process.exit(1); }
  let total = 0;
  for (const uni of unis) {
    const file = `out/program-${uni.id}.json`;
    if (!(await done(file))) continue;
    const n = await save(uni, JSON.parse(await readFile(file, "utf8")).programmes);
    console.log(`${uni.name}: записано ${n}`);
    total += n;
  }
  console.log(`\nГотово: ${total} програм.`);
  process.exit(0);
}

if (!args.force) {
  const flags = await Promise.all(list.map((u) => done(`out/program-${u.id}.json`)));
  list = list.filter((_, i) => !flags[i] || args.only);
}
list = list.slice(0, Number(args.limit));
console.log(`Програми: ${list.length} школ(и), AI: ${aiProvider}${dryRun ? " (dry-run)" : ""}\n`);

let written = 0, found = 0;
for (const uni of list) {
  const own = specs.filter((s) => s[SPECIALTY_FK] === uni.id);
  console.log(`▶ ${uni.name}: ${own.length} програм`);
  try {
    const links = await collectLinks(uni.website_url);
    console.log(`   посилань на сайті: ${links.size}`);
    const calendar = await schoolCalendar(uni, links).catch((e) => { console.log(`   календар: ${e.message}`); return null; });
    console.log(`   календар: ${calendar ? `семестрів ${calendar.terms.length}, канікул ${calendar.breaks.length}, сесій ${calendar.exam_periods.length}` : "не знайдено"}`);
    const rows = [];
    const size = Number(args.batch);
    for (let i = 0; i < own.length; i += size) {
      const group = own.slice(i, i + size);
      const chosen = await planPages(uni, group, links);
      const { pages, pdfs } = await readPages(chosen, () => {}, { maxPdfs: Number(args.pdfs), maxChars: 16000 });
      console.log(`   ${group.map((s) => s.name).join(", ").slice(0, 90)}: сторінок ${pages.length}, PDF ${pdfs.length}`);
      if (!pages.length && !pdfs.length) {
        if (calendar) for (const spec of group) rows.push({ name: spec.name, confidence: 0.6, details: { url: null, structure: [], electives: [], exams: null, internship: null, final_project: null, calendar }, sources: [calendar.url].filter(Boolean), collected_at: new Date().toISOString() });
        continue;
      }
      const pageUrls = [...pages.map((p) => p.url), ...pdfs.map((p) => p.url)];
      const result = await generateStructured({
        system: SYSTEM,
        user: `School: ${uni.name} (${uni.city}, ${uni.country})\nProgrammes:\n${group.map((s) => `- ${s.name}`).join("\n")}\n\n${pages.map((p) => `=== PAGE: ${p.url} ===\n${p.text}`).join("\n\n")}` +
          (pdfs.length ? `\n\nAttached PDFs, in order:\n${pdfs.map((p) => p.url).join("\n")}` : ""),
        schema: Result,
        pdfs,
      });
      for (const spec of group) {
        const d = result.data.programmes.find((p) => sameProgram(p.name, spec.name));
        if (!d) { console.log(`   – ${spec.name}: не знайдено`); continue; }
        const details = { ...clean(d, pageUrls), calendar };
        console.log(`   ${d.confidence >= 0.5 && filledCount(details) >= 2 ? "+" : "–"} ${spec.name}: предметів ${details.structure.reduce((a, p) => a + p.modules.length, 0)}, іспити ${details.exams ? "так" : "ні"}, практика ${details.internship ? "так" : "ні"}, впевненість ${d.confidence}`);
        rows.push({ name: spec.name, confidence: d.confidence, details, sources: pageUrls, collected_at: new Date().toISOString() });
      }
    }
    found += rows.filter((r) => r.confidence >= 0.5 && filledCount(r.details) >= 1).length;
    if (!dryRun) await writeFile(`out/program-${uni.id}.json`, JSON.stringify({ uni: uni.name, programmes: rows }, null, 2));
    const n = await save(uni, rows);
    written += n;
    console.log(`   ✓ ${hasColumn && !dryRun ? `записано ${n}` : "збережено у файл"}`);
  } catch (err) {
    console.log(`   ✗ пропущено: ${err.message}`);
    if (/ліміт/i.test(err.message)) { console.log("\nЛіміт Gemini вичерпано. Запустіть цю ж команду пізніше: продовжить з цього місця."); break; }
  }
  console.log();
}
console.log(`Готово: знайдено опис для ${found} програм, записано ${written}.`);
