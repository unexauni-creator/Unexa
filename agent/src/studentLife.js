// Збирає «Студентське життя» школи з її офіційного сайту: клуби й об'єднання, спорт, події й культура,
// підтримка студентів, житло, міжнародні студенти. Результат — universities.student_life (jsonb).
//
//   npm run student-life -- --dry-run --only "Brera"   показати результат (без запису в базу)
//   npm run student-life -- --limit 5                  5 шкіл, у яких ще немає даних
//   npm run student-life -- --force --only "UAL"       зібрати заново
//   npm run student-life -- --upload                   записати в базу вже зібрані файли з agent/out/
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { crawlUniversity, STUDENT_LIFE_FOCUS } from "./crawl.js";
import { generateStructured, aiProvider } from "./extract.js";
import { getSupabase } from "./db.js";
import { findPageImage } from "./photo.js";

const { values: args } = parseArgs({
  options: {
    only: { type: "string" },
    limit: { type: "string", default: "100" },
    pages: { type: "string", default: "10" },
    force: { type: "boolean", default: false },
    upload: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});

const CATEGORIES = ["clubs", "sports", "events", "support", "housing", "international", "wellbeing", "facilities"];

const Section = z.object({
  category: z.enum(CATEGORIES),
  title: z.string().describe("Short heading, e.g. 'Student associations', 'University sport', 'Halls of residence'"),
  text: z.string().describe("1-2 sentences in English (under 220 characters) about what students actually get here"),
  highlights: z.array(z.string()).describe("Up to 4 concrete names or facts from the page, each under 40 characters, e.g. 'Film club', 'Free gym', '3 residences'"),
  url: z.string().nullable().describe("Official page this section comes from"),
});
const StudentLife = z.object({
  summary: z.string().nullable().describe("1-2 sentences in English about student life at this school"),
  sections: z.array(Section).describe("3 to 6 sections, only what the pages state"),
});

const SYSTEM = `You describe STUDENT LIFE at one school for Unexa, a platform for students choosing where to study creative subjects abroad.

You receive plain text of pages from the school's official website (they may be in any language). Describe only what the pages state: student associations and clubs, sport, events and culture, student support and counselling, housing and residences, help for international students, well-being, campus facilities students can use. Never invent numbers, names or services. If a topic is not on the pages, leave that section out. If the pages say almost nothing about student life, return an empty sections list.

Write in English, short and concrete, in a friendly tone. Each section's url must be the page it comes from.`;

const supabase = getSupabase();
const dryRun = args["dry-run"];
await mkdir("out", { recursive: true });

// Колонка student_life з'являється після sql/003_student_life.sql
async function columnExists() {
  const { error } = await supabase.from("universities").select("student_life").limit(1);
  return !error;
}

async function save(uniId, data) {
  const { error } = await supabase.from("universities").update({ student_life: data }).eq("id", uniId);
  if (error) throw new Error(error.message);
}

if (args.upload) {
  if (!(await columnExists())) throw new Error("Спершу виконайте agent/sql/003_student_life.sql у Supabase");
  const files = (await readdir("out")).filter((f) => f.startsWith("student-life-"));
  for (const f of files) {
    const { uniId, name, data } = JSON.parse(await readFile(`out/${f}`, "utf8"));
    await save(uniId, data);
    console.log(`✓ ${name}`);
  }
  console.log(`Записано: ${files.length}`);
  process.exit(0);
}

const hasColumn = await columnExists();
if (!hasColumn && !dryRun) {
  console.log("ℹ️  Колонки student_life ще немає — результати збережу в agent/out/, а після sql/003 запустіть: npm run student-life -- --upload\n");
}

const { data: unis, error } = await supabase.from("universities").select(hasColumn ? "id,name,city,website_url,student_life" : "id,name,city,website_url").order("name");
if (error) throw new Error(error.message);
const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
let list = unis.filter((u) => u.website_url && (args.force || !u.student_life));
if (args.only) list = list.filter((u) => norm(u.name).includes(norm(args.only)));
list = list.slice(0, Number(args.limit));

console.log(`Студентське життя: ${list.length} школ(и), AI: ${aiProvider}\n`);
let ok = 0;
for (const uni of list) {
  console.log(`▶ ${uni.name}`);
  try {
    const site = uni.website_url.replace(/[?#].*$/, "");
    const pages = await crawlUniversity(site, { maxPages: Number(args.pages), focus: STUDENT_LIFE_FOCUS });
    if (!pages.length) throw new Error("сайт не відкрився або блокує агента");

    const corpus = pages.map((p) => `=== PAGE: ${p.url} ===\n${p.text}`).join("\n\n");
    const result = await generateStructured({ system: SYSTEM, user: `School: ${uni.name}${uni.city ? ` (${uni.city})` : ""}\n\n${corpus}`, schema: StudentLife });
    const sections = result.data.sections.slice(0, 6);
    if (!sections.length) { console.log("   – на сайті майже немає інформації про студентське життя"); continue; }

    // фото до розділу — зі сторінки, звідки взято текст (офіційний сайт школи)
    const used = new Set();
    for (const s of sections) {
      s.image = s.url ? await findPageImage(s.url, used).catch(() => null) : null;
      if (s.image) used.add(s.image);
    }

    const data = { summary: result.data.summary, sections, collected_at: new Date().toISOString(), source_urls: pages.map((p) => p.url) };
    await writeFile(`out/student-life-${uni.id}.json`, JSON.stringify({ uniId: uni.id, name: uni.name, data }, null, 2));
    console.log(`   ${sections.length} розділів: ${sections.map((s) => s.category).join(", ")} (${result.model})`);
    if (!dryRun && hasColumn) {
      await save(uni.id, data);
      console.log("   ✓ записано в базу");
    }
    ok++;
  } catch (e) {
    console.log(`   ✗ ${e.message}`);
  }
}
console.log(`\nГотово: ${ok} з ${list.length}.`);
