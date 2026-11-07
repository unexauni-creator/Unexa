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
import { crawlUniversity, FACULTY_FOCUS, HOUSING_FOCUS } from "./crawl.js";
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
const VERSION = 1;

const Person = z.object({
  name: z.string().describe("Full name exactly as on the page"),
  role: z.string().nullable().describe("Title or role, e.g. 'Professor of Painting', 'Head of Graphic Design', under 60 characters"),
  field: z.string().nullable().describe("Subject or programme they teach, under 40 characters"),
  url: z.string().nullable().describe("Their page on the official site, or the page that lists them"),
});
const Option = z.object({
  name: z.string().describe("Name of the residence or housing option"),
  type: z.string().nullable().describe("e.g. 'Single room', 'Shared flat', 'Partner residence'"),
  price: z.string().nullable().describe("Price exactly as stated, with currency and period, e.g. '€450 / month'"),
  distance: z.string().nullable().describe("Distance or travel time to campus if stated"),
  url: z.string().nullable(),
});
const Campus = z.object({
  faculty: z.object({
    summary: z.string().nullable().describe("1-2 sentences in English about how teaching works here: who teaches, studio culture, practice-based or not"),
    class_size: z.string().nullable().describe("Class or group size if stated, e.g. '12-15 students per studio'"),
    studios: z.array(z.string()).describe("Up to 6 named studios, workshops or labs students use, each under 40 characters"),
    visiting: z.string().nullable().describe("One sentence about visiting artists, guest lecturers or industry tutors, if stated"),
    people: z.array(Person).describe("Up to 8 teachers named on the pages, preferring heads of programmes and professors in art and design"),
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
1. faculty: how teaching works and teachers named on the pages. Only real names that appear on the pages, with their role. People who teach (professors, lecturers, tutors, heads of programmes or departments), not university leadership or administrators (rector, vice-chancellor, president, dean of students, staff in offices). Never invent people, roles, numbers or studios.
2. housing: residences or housing services for this school's students, prices exactly as written, how to apply.
Write in English, short and concrete. Use null or empty lists when the pages don't say. Every url must be a page from the input.`;

const supabase = getSupabase();
const dryRun = args["dry-run"];
await mkdir("out", { recursive: true });

const { error: colErr } = await supabase.from("universities").select("faculty, housing").limit(1);
if (colErr && !dryRun) throw new Error("Спершу виконайте agent/sql/008_faculty_housing.sql у Supabase");

const { data: unis, error } = await supabase.from("universities").select(colErr ? "id,name,city,website_url" : "id,name,city,website_url,faculty,housing").order("name");
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
    const pages = [...new Map([...fPages, ...hPages].map((p) => [p.url, p])).values()];
    if (!pages.length) throw new Error("сайт не відкрився або блокує агента");

    const corpus = pages.map((p) => `=== PAGE: ${p.url} ===\n${p.text.slice(0, 12000)}`).join("\n\n");
    const result = await generateStructured({ system: SYSTEM, user: `School: ${uni.name}${uni.city ? ` (${uni.city})` : ""}\n\n${corpus}`, schema: Campus });
    const known = new Set(pages.map((p) => p.url));
    const okUrl = (u) => (u && /^https?:\/\//.test(u) ? u : null);
    const { faculty, housing } = result.data;
    // names must really be on the collected pages: drop any the model could have invented
    const text = pages.map((p) => p.text).join(" ").toLowerCase();
    faculty.people = faculty.people.filter((p) => p.name && text.includes(p.name.toLowerCase().split(" ").at(-1))).slice(0, 8).map((p) => ({ ...p, url: okUrl(p.url) }));
    faculty.studios = faculty.studios.slice(0, 6);
    housing.options = housing.options.slice(0, 6).map((o) => ({ ...o, url: okUrl(o.url) }));
    for (const part of [faculty, housing]) part.url = okUrl(part.url);
    housing.apply_url = okUrl(housing.apply_url);

    const stamp = { version: VERSION, collected_at: new Date().toISOString(), source_urls: [...known] };
    const out = { faculty: { ...faculty, ...stamp }, housing: { ...housing, ...stamp } };
    await writeFile(`out/campus-${uni.id}.json`, JSON.stringify({ name: uni.name, ...out }, null, 2));
    console.log(`   викладачів: ${faculty.people.length}, студій: ${faculty.studios.length}; житло: ${housing.available}, варіантів: ${housing.options.length} (${result.model})`);
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
