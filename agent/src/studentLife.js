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
import { collectGalleryPhotos, findCommonsImages } from "./photo.js";
import { mirrorImage } from "./storage.js";

const { values: args } = parseArgs({
  options: {
    only: { type: "string" },
    limit: { type: "string", default: "100" },
    pages: { type: "string", default: "10" },
    force: { type: "boolean", default: false },
    upload: { type: "boolean", default: false },
    "photos-only": { type: "boolean", default: false }, // лише заново підібрати фото школам, де їх не вистачає
    "dry-run": { type: "boolean", default: false },
  },
});

// Лише студентські АКТИВНОСТІ. Житло має окрему сторінку Dorm; оплати, гранти, візи — не сюди.
// Лише студентські АКТИВНОСТІ. Житло має окрему сторінку Dorm; оплати, гранти, візи, сервіси — не сюди.
const CATEGORIES = ["clubs", "sports", "events", "exhibitions", "workshops", "community", "trips"];
const VERSION = 3; // школи зі старішою версією даних збираються заново (можна продовжити після ліміту Gemini)

const Section = z.object({
  category: z.enum(CATEGORIES),
  title: z.string().describe("Short heading, e.g. 'Student associations', 'Annual graduate show', 'University sport'"),
  text: z.string().describe("1-2 sentences in English (under 220 characters) about what students actually do here"),
  highlights: z.array(z.string()).describe("Up to 4 concrete names from the page, each under 40 characters, e.g. 'Film club', 'Summer exhibition', 'Climbing group'"),
  url: z.string().nullable().describe("Official page this section comes from"),
});
const StudentLife = z.object({
  summary: z.string().nullable().describe("1-2 sentences in English about student life at this school"),
  sections: z.array(Section).describe("3 to 8 activities, only what the pages state"),
});

const SYSTEM = `You describe STUDENT LIFE at one school for Unexa, a platform for students choosing where to study creative subjects abroad.

You receive plain text of pages from the school's official website (they may be in any language). Describe only student ACTIVITIES the pages mention: student associations and clubs, student union events, sport, festivals, exhibitions and graduate shows, workshops and open studios, community and volunteering projects, study trips and summer schools.

Do NOT include, not even in the summary: housing or residences (the site has a separate dorm page), tuition, fees, payments, grants, scholarships, visas, insurance, health services, counselling, support offices, administration. Never invent names, numbers or events. If the pages say almost nothing about student activities, return an empty sections list.

Write in English, short and concrete, in a friendly tone. Each section's url must be the page it comes from.`;

// Gemini дивиться на самі фото: де є студенти / люди, які фото повторюють одне одне, до якої активності підходить
const PhotoReview = z.object({
  photos: z.array(z.object({
    index: z.number().describe("Number of the photo, as given in the text before it"),
    shows_people: z.boolean().describe("True when students or other people are clearly visible"),
    is_real_photo: z.boolean().describe("False for logos, posters, diagrams, screenshots, stock objects, documents, plain graphics"),
    duplicate_of: z.number().nullable().describe("Index of an earlier photo showing the same scene or nearly the same image, else null"),
    best_section: z.number().nullable().describe("Number of the activity this photo fits best, or null if none"),
  })),
});

const PHOTO_SYSTEM = `You choose photos for a gallery of student activities at one school. For each numbered photo decide: does it clearly show students or other people, is it a real photograph (not a logo, poster, diagram, screenshot, document or stock picture of an object), is it a duplicate or near-duplicate of an earlier photo, and which numbered activity it fits best. Judge only what you can see.`;

async function downloadPhoto(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 UnexaAgent/0.1 (https://github.com/unexauni-creator/Unexa)" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) return null;
  const type = res.headers.get("content-type") ?? "";
  if (!/image\/(jpeg|webp|png)/.test(type)) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  return bytes.length > 3_000_000 ? null : { mimeType: type.split(";")[0], data: bytes.toString("base64") };
}

// Розподіляє фото: спершу фото з людьми, без повторів; кожне фото лише в одній активності.
// Хороші фото без людей (студії, виставки) заповнюють активності, яким не вистачило фото з людьми.
// Якщо на сайті школи фото мало, додаємо вільні фото з Wikimedia Commons (з підписом автора).
async function assignPhotos(sections, pageUrls, uni) {
  for (const s of sections) { s.images = []; s.image = null; s.credits = {}; }
  const candidates = (await collectGalleryPhotos([...new Set([...sections.map((s) => s.url).filter(Boolean), ...pageUrls])], 24))
    .map((url) => ({ url }));
  if (candidates.length < 8) {
    const commons = await findCommonsImages(uni.name, 8).catch(() => []);
    candidates.push(...commons.map((c) => ({ url: c.url, credit: { text: c.credit, url: c.page } })));
  }

  const loaded = [];
  for (const c of candidates.slice(0, 24)) {
    const inline = await downloadPhoto(c.url).catch(() => null);
    if (inline) loaded.push({ ...c, inline });
    if (c.credit) await new Promise((r) => setTimeout(r, 1000)); // ввічливо до Wikimedia
  }
  if (!loaded.length) return { total: 0, withPeople: 0 };

  const list = sections.map((s, i) => `${i}. ${s.title}: ${s.text}`).join("\n");
  const parts = [{ text: `Activities:\n${list}\n\nPhotos:` }];
  loaded.forEach((p, i) => parts.push({ text: `Photo ${i}:` }, { inlineData: p.inline }));
  const review = await generateStructured({ system: PHOTO_SYSTEM, user: [{ role: "user", parts }], schema: PhotoReview });

  const good = review.data.photos.filter((p) => loaded[p.index] && p.is_real_photo && p.duplicate_of === null);
  const withPeople = good.filter((p) => p.shows_people);
  const noPeople = good.filter((p) => !p.shows_people);

  const place = (p, s) => { s.images.push(p); };
  const rest = [];
  for (const p of withPeople) {
    const s = sections[p.best_section];
    if (s && s.images.length < 3) place(p, s);
    else rest.push(p);
  }
  // активності без фото: спершу вільні фото з людьми, потім підхожі фото без людей, потім будь-які
  const spareNoPeople = [...noPeople];
  for (const s of sections) {
    if (s.images.length) continue;
    const i = sections.indexOf(s);
    const match = spareNoPeople.findIndex((p) => p.best_section === i);
    if (rest.length) place(rest.shift(), s);
    else if (match >= 0) place(spareNoPeople.splice(match, 1)[0], s);
    else if (spareNoPeople.length) place(spareNoPeople.shift(), s);
  }

  // фото з Commons копіюємо у своє сховище (Wikimedia обмежує кількість запитів)
  let n = 0;
  for (const s of sections) {
    const urls = [];
    for (const p of s.images) {
      const photo = loaded[p.index];
      let url = photo.url;
      if (photo.credit) {
        try { url = await mirrorImage(supabase, photo.url, `student-life-${uni.id}-${n++}`); }
        catch (e) { console.log(`     ! ${e.message}`); }
        s.credits[url] = photo.credit;
      }
      urls.push(url);
    }
    s.images = urls;
    s.image = urls[0] ?? null;
  }
  return { total: sections.reduce((a, s) => a + s.images.length, 0), withPeople: withPeople.length };
}

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

const PHOTOS_VERSION = 2;
const hasColumn = await columnExists();
if (!hasColumn && !dryRun) {
  console.log("ℹ️  Колонки student_life ще немає — результати збережу в agent/out/, а після sql/003 запустіть: npm run student-life -- --upload\n");
}

const { data: unis, error } = await supabase.from("universities").select(hasColumn ? "id,name,city,website_url,student_life" : "id,name,city,website_url").order("name");
if (error) throw new Error(error.message);
const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const lacksPhotos = (sl) => sl?.sections?.some((s) => !s.images?.length);
let list = args["photos-only"]
  ? unis.filter((u) => u.student_life?.version === VERSION && u.student_life.photos_version !== PHOTOS_VERSION && lacksPhotos(u.student_life))
  : unis.filter((u) => u.website_url && (args.force || u.student_life?.version !== VERSION));
if (args.only) list = list.filter((u) => norm(u.name).includes(norm(args.only)));
list = list.slice(0, Number(args.limit));

console.log(`Студентське життя: ${list.length} школ(и), AI: ${aiProvider}\n`);
let ok = 0;
for (const uni of list) {
  console.log(`▶ ${uni.name}`);
  try {
    if (args["photos-only"]) {
      // текст лишається, Gemini потрібен лише для перегляду фото (економить безкоштовний ліміт)
      const data = uni.student_life;
      const photos = await assignPhotos(data.sections, data.source_urls ?? [], uni);
      data.photos_version = PHOTOS_VERSION;
      console.log(`   фото: ${photos.total} (з людьми: ${photos.withPeople}), активностей без фото: ${data.sections.filter((s) => !s.images.length).length} з ${data.sections.length}`);
      await writeFile(`out/student-life-${uni.id}.json`, JSON.stringify({ uniId: uni.id, name: uni.name, data }, null, 2));
      if (!dryRun) await save(uni.id, data);
      ok++;
      continue;
    }
    const site = uni.website_url.replace(/[?#].*$/, "");
    const pages = await crawlUniversity(site, { maxPages: Number(args.pages), focus: STUDENT_LIFE_FOCUS });
    if (!pages.length) throw new Error("сайт не відкрився або блокує агента");

    const corpus = pages.map((p) => `=== PAGE: ${p.url} ===\n${p.text}`).join("\n\n");
    const result = await generateStructured({ system: SYSTEM, user: `School: ${uni.name}${uni.city ? ` (${uni.city})` : ""}\n\n${corpus}`, schema: StudentLife });
    const sections = result.data.sections.slice(0, 8);
    if (!sections.length) { console.log("   – на сайті майже немає інформації про студентське життя"); continue; }

    const photos = await assignPhotos(sections, pages.map((p) => p.url), uni);

    const data = { version: VERSION, photos_version: PHOTOS_VERSION, summary: result.data.summary, sections, collected_at: new Date().toISOString(), source_urls: pages.map((p) => p.url) };
    await writeFile(`out/student-life-${uni.id}.json`, JSON.stringify({ uniId: uni.id, name: uni.name, data }, null, 2));
    console.log(`   ${sections.length} активностей, фото: ${photos.total} (з людьми: ${photos.withPeople}), ${result.model}`);
    if (!dryRun && hasColumn) {
      await save(uni.id, data);
      console.log("   ✓ записано в базу");
    }
    ok++;
  } catch (e) {
    console.log(`   ✗ ${e.message}`);
    // ліміт Gemini: далі немає сенсу, наступний запуск продовжить із цього місця
    if (/ліміт/i.test(e.message)) { console.log("\nЛіміт Gemini вичерпано. Запустіть цю ж команду пізніше: вона продовжить з цього місця."); break; }
  }
}
console.log(`\nГотово: ${ok} з ${list.length}.`);
