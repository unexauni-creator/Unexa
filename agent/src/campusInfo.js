// Collects two things from each school's official website, for the Teachers and Housing pages:
//  - faculty: how teaching works (class size, studios, visiting artists) and a few named teachers
//    with their role and a link to their page on the school site (no photos of people are stored);
//  - housing: whether the school has residences, what options cost, how to apply, private-housing tips.
// One Gemini request per school. Results: universities.faculty and universities.housing (jsonb, sql/008).
//
//   npm run campus -- --dry-run --only "RISD"   show the result, no saving
//   npm run campus -- --limit 5                  5 schools that don't have it yet
//   npm run campus -- --force --only "NABA"      collect again
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { crawlUniversity, extractLinks, FACULTY_FOCUS, get, HOUSING_FOCUS, htmlToText } from "./crawl.js";
import { generateStructured, aiProvider } from "./extract.js";
import { getSupabase } from "./db.js";

const { values: args } = parseArgs({
  options: {
    only: { type: "string" },
    limit: { type: "string", default: "100" },
    pages: { type: "string", default: "7" },
    force: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});
const VERSION = 2; // 2: teachers per programme with a short career bio

const Person = z.object({
  name: z.string().describe("Full name exactly as on the page"),
  role: z.string().nullable().describe("Title or role, e.g. 'Professor of Painting', 'Head of Graphic Design', under 60 characters"),
  field: z.string().nullable().describe("Subject they teach, under 40 characters"),
  programmes: z.array(z.string()).describe("Names from the given programme list that this person teaches on, copied exactly; empty if the pages don't say"),
  bio: z.string().nullable().describe("1-2 sentences in English about their career from the pages: their own practice, notable work, exhibitions, studios or companies they worked with. Null if the pages don't say"),
  url: z.string().nullable().describe("Their page on the official site, or the page that lists them"),
});
const Option = z.object({
  name: z.string().describe("Name of the residence or housing option"),
  type: z.string().nullable().describe("e.g. 'Single room', 'Shared flat', 'Partner residence'"),
  price: z.string().nullable().describe("Price as stated, ALWAYS with its currency symbol and period, e.g. '€450 / month'. If the page shows only a number, add the currency used on that page"),
  distance: z.string().nullable().describe("Distance or travel time to campus if stated"),
  url: z.string().nullable(),
});
const Campus = z.object({
  faculty: z.object({
    summary: z.string().nullable().describe("1-2 sentences in English about how teaching works here: who teaches, studio culture, practice-based or not"),
    class_size: z.string().nullable().describe("Class or group size if stated, e.g. '12-15 students per studio'"),
    studios: z.array(z.string()).describe("Up to 6 named studios, workshops or labs students use, each under 40 characters"),
    visiting: z.string().nullable().describe("One sentence about visiting artists, guest lecturers or industry tutors, if stated"),
    people: z.array(Person).describe("Up to 16 current teachers named on the pages, preferring those linked to the given programmes and with career information"),
    url: z.string().nullable().describe("Main official page about faculty or teaching"),
  }),
  housing: z.object({
    available: z.enum(["own", "partner", "none", "unknown"]).describe("own: the school runs residences; partner: it works with residences or a housing service; none: it says it has no housing; unknown: pages don't say"),
    summary: z.string().nullable().describe("1-2 sentences in English about housing for students of this school"),
    guarantee: z.string().nullable().describe("Who is guaranteed or prioritised a place (e.g. first-year or international students), if stated"),
    options: z.array(Option).describe("Up to 6 housing options named on the pages"),
    how_to_apply: z.string().nullable().describe("One or two sentences on how and when to apply for housing"),
    apply_url: z.string().nullable(),
    private_tips: z.string().nullable().describe("One sentence of advice from the pages about finding private housing, if any"),
    url: z.string().nullable().describe("Main official page about housing"),
  }),
});

const SYSTEM = `You collect facts for Unexa, a platform that helps students choose a creative school abroad.
You receive plain text of pages from ONE school's official website (any language). Fill two parts:
1. faculty: how teaching works and teachers named on the pages. Only real names that appear on the pages, with their role. Only CURRENT teaching staff (professors, lecturers, tutors, heads of programmes or departments). Leave out emeritus, retired or former faculty, and university leadership or administrators (rector, vice-chancellor, president, deans of students, office staff). For each person say which of the given programmes they teach on: pages marked "(programme: …)" belong to that programme, so a teacher listed on such a page teaches on it and write a short career bio from the pages. Never invent people, roles, programmes, careers, numbers or studios.
2. housing: residences or housing services for this school's students, prices exactly as written, how to apply.
Write in English, short and concrete. Use null or empty lists when the pages don't say. Every url must be a page from the input.`;

// The school's programme pages (saved by the agent in specialties.source_note) and the faculty pages they link to:
// that is where art schools list who teaches on each programme.
const FACULTY_LINK = /faculty|staff|people|teachers|tutors|lecturers|team|docenti|enseignant|profesor|lehrende|kadra|wykładow|викладач/i;
async function fetchText(url, limit) {
  const res = await get(url).catch(() => null);
  return res ? { url: res.url, html: res.body, text: htmlToText(res.body).slice(0, limit) } : null;
}
const commonPrefix = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; };

async function programmePages(uni, maxPeople = 5) {
  const pages = [];
  const seen = new Set();
  const progs = uni.specialties
    .map((p) => ({ name: p.name, url: (String(p.source_note ?? "").match(/https?:\/\/[^\s,]+/g) ?? []).find((u) => !/wikimedia|wikipedia/.test(u) && new URL(u).pathname.length > 1) }))
    .filter((p) => p.url)
    .slice(0, 8);
  for (const prog of progs) {
    const page = await fetchText(prog.url, 8000);
    if (!page) continue;
    if (!seen.has(page.url)) { seen.add(page.url); pages.push({ url: page.url, programme: prog.name, text: page.text }); }
    // the faculty page closest to this programme (same path prefix wins)
    const host = new URL(page.url).host;
    const path = new URL(page.url).pathname;
    const fac = [...extractLinks(page.html, page.url)]
      .filter(([href, label]) => new URL(href).host === host && (FACULTY_LINK.test(new URL(href).pathname) || FACULTY_LINK.test(label)))
      .map(([href]) => href)
      .sort((a, b) => commonPrefix(new URL(b).pathname, path) - commonPrefix(new URL(a).pathname, path))[0];
    if (!fac || seen.has(fac)) continue;
    const list = await fetchText(fac, 8000);
    if (!list) continue;
    seen.add(list.url);
    pages.push({ url: list.url, programme: prog.name, text: list.text });
    // each teacher's own page holds the career: links one level below the faculty page
    const base = new URL(list.url).pathname.replace(/\/$/, "");
    const people = [...new Set([...extractLinks(list.html, list.url)].map(([href]) => href.split("#")[0])
      .filter((href) => { const u = new URL(href); return u.host === host && u.pathname.startsWith(base + "/") && u.pathname.split("/").length === base.split("/").length + 1; }))]
      .slice(0, maxPeople);
    for (const href of people) {
      if (seen.has(href)) continue;
      const person = await fetchText(href, 3000);
      if (person) { seen.add(person.url); pages.push({ url: person.url, programme: prog.name, text: person.text }); }
    }
  }
  return pages;
}

const supabase = getSupabase();
const dryRun = args["dry-run"];
await mkdir("out", { recursive: true });

const { error: colErr } = await supabase.from("universities").select("faculty, housing").limit(1);
if (colErr && !dryRun) throw new Error("Спершу виконайте agent/sql/008_faculty_housing.sql у Supabase");

const { data: unis, error } = await supabase.from("universities").select(colErr ? "id,name,city,website_url,specialties(name,source_note)" : "id,name,city,website_url,faculty,housing,specialties(name,source_note)").order("name");
if (error) throw new Error(error.message);
const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
let list = unis.filter((u) => u.website_url && (args.force || u.faculty?.version !== VERSION));
if (args.only) list = list.filter((u) => norm(u.name).includes(norm(args.only)));
list = list.slice(0, Number(args.limit));

console.log(`Викладачі й житло: ${list.length} школ(и), AI: ${aiProvider}\n`);
let ok = 0;
for (const uni of list) {
  console.log(`▶ ${uni.name}`);
  try {
    const site = uni.website_url.replace(/[?#].*$/, "");
    const max = Number(args.pages);
    const [fPages, hPages] = [
      await crawlUniversity(site, { maxPages: max, focus: FACULTY_FOCUS }),
      await crawlUniversity(site, { maxPages: max, focus: HOUSING_FOCUS }),
    ];
    const progPages = await programmePages(uni);
    const pages = [...new Map([...progPages, ...fPages, ...hPages].map((p) => [p.url, p])).values()];
    if (!pages.length) throw new Error("сайт не відкрився або блокує агента");

    const corpus = pages.map((p) => `=== PAGE: ${p.url}${p.programme ? ` (programme: ${p.programme})` : ""} ===\n${p.text.slice(0, 12000)}`).join("\n\n");
    const programmeList = uni.specialties.map((p) => `- ${p.name}`).join("\n");
    const result = await generateStructured({ system: SYSTEM, user: `School: ${uni.name}${uni.city ? ` (${uni.city})` : ""}\nProgrammes on Unexa:\n${programmeList}\n\n${corpus}`, schema: Campus });
    const known = new Set(pages.map((p) => p.url));
    const okUrl = (u) => (u && /^https?:\/\//.test(u) ? u : null);
    const { faculty, housing } = result.data;
    // names must really be on the collected pages: drop any the model could have invented
    const text = pages.map((p) => p.text).join(" ").toLowerCase();
    const names = new Set(uni.specialties.map((p) => p.name));
    faculty.people = faculty.people
      .filter((p) => p.name && text.includes(p.name.toLowerCase().split(" ").at(-1)) && !/emerit|retired|former/i.test(p.role ?? ""))
      .slice(0, 16)
      .map((p) => ({ ...p, programmes: (p.programmes ?? []).filter((n) => names.has(n)), url: okUrl(p.url) }));
    faculty.studios = faculty.studios.slice(0, 6);
    housing.options = housing.options.slice(0, 6).map((o) => ({ ...o, url: okUrl(o.url) }));
    for (const part of [faculty, housing]) part.url = okUrl(part.url);
    housing.apply_url = okUrl(housing.apply_url);

    const stamp = { version: VERSION, collected_at: new Date().toISOString(), source_urls: [...known] };
    const out = { faculty: { ...faculty, ...stamp }, housing: { ...housing, ...stamp } };
    await writeFile(`out/campus-${uni.id}.json`, JSON.stringify({ name: uni.name, ...out }, null, 2));
    console.log(`   викладачів: ${faculty.people.length} (з програмою: ${faculty.people.filter((p) => p.programmes.length).length}, з біо: ${faculty.people.filter((p) => p.bio).length}), студій: ${faculty.studios.length}; житло: ${housing.available}, варіантів: ${housing.options.length} (${result.model})`);
    if (!dryRun) {
      const { error: e } = await supabase.from("universities").update(out).eq("id", uni.id);
      if (e) throw new Error(e.message);
      console.log("   ✓ записано в базу");
    }
    ok++;
  } catch (e) {
    console.log(`   ✗ ${e.message}`);
    if (/ліміт/i.test(e.message)) { console.log("\nЛіміт Gemini вичерпано. Запустіть цю ж команду пізніше: вона продовжить з цього місця."); break; }
  }
}
console.log(`\nГотово: ${ok} з ${list.length}.`);
