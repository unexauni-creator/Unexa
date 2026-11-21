// Дозаповнює ПОРОЖНІ поля програм, які вже є на сайті, глибше, ніж enrich:
//  1. збирає всі посилання школи (головна, розділи, sitemap.xml), включно з PDF;
//  2. AI вибирає, які саме сторінки прочитати для кожної програми і для вартості / вступу / стипендій;
//  3. читає ці сторінки й PDF і заповнює поля; загальні для школи факти переносить на всі її програми;
//  4. віза, підтвердження коштів і державні стипендії беруться з офіційних урядових сайтів країни.
// Заповнене не перезаписує, нових програм не додає.
//
//   npm run complete -- --dry-run              показати, що буде заповнено
//   npm run complete                           усі школи, де є порожні поля, потім країни
//   npm run complete -- --only "RISD"          одна школа
//   npm run complete -- --countries-only       лише віза / кошти / державні стипендії
//   npm run complete -- --refresh              щомісячне оновлення: перечитує всі школи й ОНОВЛЮЄ
//                                              дедлайни, вартість, intake, вимоги й стипендії, якщо вони змінились
import { access, mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { get, htmlToText, extractLinks } from "./crawl.js";
import { generateStructured, aiProvider } from "./extract.js";
import { Extraction, SYSTEM_PROMPT, buildUserPrompt } from "./schema.js";
import { getSupabase, SPECIALTY_FK } from "./db.js";
import { yearlyTuitionEur } from "../../src/lib/compareScore.js";

const { values: args } = parseArgs({
  options: {
    only: { type: "string" },
    limit: { type: "string", default: "100" },
    pages: { type: "string", default: "22" },
    "min-confidence": { type: "string", default: "0.5" },
    "dry-run": { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    "countries-only": { type: "boolean", default: false },
    "no-countries": { type: "boolean", default: false },
    refresh: { type: "boolean", default: false },
  },
});
const dryRun = args["dry-run"];
const minConfidence = Number(args["min-confidence"]);
const supabase = getSupabase();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const USER_AGENT = "UnexaUniversityAgent/0.1 (+student study-abroad platform)";

const PH = /^(not (in source|specified|stated|available|mentioned|provided)|n\/?a|unknown|none|null|-+)$/i;
const isEmpty = (v) => v === null || v === undefined || v === "" || (typeof v === "string" && PH.test(v.trim()));
const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// поля, які видно студенту на сторінці програми
const FIELDS = [
  "teaching_language", "study_format", "academic_tuition_fee", "academic_duration", "academic_study_mode",
  "intake", "application_deadlines", "application_fee", "class_size", "campus_facilities", "submission_period",
  "min_language_level", "min_cgpa", "doc_language", "doc_diploma", "doc_visa", "doc_bank_statement",
  "curriculum_summary", "scholarships_text", "has_internship", "has_certification",
];
const refresh = args.refresh;
// поля, які змінюються щороку: у режимі --refresh їх можна перезаписати новим значенням з сайту
const REFRESHABLE = ["academic_tuition_fee", "tuition_amount", "intake", "application_deadlines", "application_fee", "submission_period", "min_language_level", "scholarships_text"];
const missingOf = (spec) => FIELDS.filter((f) => isEmpty(spec[f]));
const toCheck = (spec) => (refresh ? [...new Set([...missingOf(spec), ...REFRESHABLE.filter((f) => f !== "tuition_amount")])] : missingOf(spec));

function sameProgram(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const ta = new Set(x.split(" ")), tb = new Set(y.split(" "));
  return [...ta].filter((t) => tb.has(t)).length / Math.min(ta.size, tb.size) >= 0.75;
}

// ---------- 1. усі посилання школи ----------
const SKIP = /\/(news|press|events?|agenda|calendar|blog|tag|category|author|login|intranet|search|shop|jobs?|vacanc|career-staff|alumni-stories)(\/|$)|\.(jpe?g|png|gif|svg|webp|zip|mp4|mp3|docx?|xlsx?|pptx?)$/i;
const HUB = /admission|apply|applicat|study|studies|programm|courses?|degrees?|international|fees|tuition|scholar|funding|financial|undergrad|postgrad|graduate|bachelor|master|studium|studien|bewerbung|studiare|ammission|iscrizion|offerta|corsi|didattica|estudios|admision|matricula|grados?|rekrutacja|studia|kandyd|oplat|formation|candidat|admission|вступ|абітурієнт|освітні|навчання|вартість|入学|입학/i;

async function sitemapUrls(origin) {
  const found = new Set();
  const robots = await get(`${origin}/robots.txt`).catch(() => null);
  const maps = [...(robots?.body.matchAll(/^sitemap:\s*(\S+)/gim) ?? [])].map((m) => m[1]);
  if (!maps.length) maps.push(`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`);
  const queue = [...maps];
  let reads = 0;
  while (queue.length && reads < 10 && found.size < 5000) {
    const page = await get(queue.shift()).catch(() => null);
    reads++;
    if (!page) continue;
    const locs = [...page.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
    if (/<sitemapindex/i.test(page.body)) {
      // в індексі спершу беремо карти сторінок / програм, а не новин чи зображень
      locs.sort((a, b) => Number(/news|post|event|image|tag|author/i.test(a)) - Number(/news|post|event|image|tag|author/i.test(b)));
      queue.push(...locs.slice(0, 8));
    } else locs.forEach((l) => found.add(l));
  }
  return [...found];
}

async function collectLinks(site) {
  const start = new URL(site);
  const root = start.hostname.split(".").slice(-2).join(".");
  const own = (u) => { try { return new URL(u).hostname.endsWith(root); } catch { return false; } };
  const links = new Map(); // url -> текст посилання
  const add = (url, text = "") => { if (own(url) && !SKIP.test(url) && !links.has(url.split("#")[0])) links.set(url.split("#")[0], text); };

  const home = await get(start.href).catch(() => null);
  if (!home) throw new Error("головна сторінка не відкривається (сайт блокує агента)");
  for (const [u, t] of extractLinks(home.body, home.url)) add(u, t);

  // один рівень углиб: розділи вступу / навчання / міжнародних студентів
  const hubs = [...links].filter(([u, t]) => HUB.test(`${u} ${t}`)).slice(0, 8);
  for (const [hub] of hubs) {
    await sleep(800);
    const page = await get(hub).catch(() => null);
    if (page) for (const [u, t] of extractLinks(page.body, page.url)) add(u, t);
  }
  for (const u of await sitemapUrls(start.origin)) add(u);
  return links;
}

// ---------- 2. AI вибирає сторінки ----------
const Plan = z.object({
  pages: z.array(z.object({ url: z.string(), for: z.string().describe("which programme or topic this page is for") })),
});

async function planPages(uni, specs, links) {
  // спершу посилання, схожі на корисні; список обмежений, щоб не перевантажити модель
  const ranked = [...links].map(([u, t]) => ({ u, t, s: (HUB.test(`${u} ${t}`) ? 2 : 0) + (/\.pdf$/i.test(u) ? 1 : 0) + specs.reduce((a, s) => a + (norm(s.name).split(" ").some((w) => w.length > 4 && norm(`${u} ${t}`).includes(w)) ? 2 : 0), 0) }))
    .sort((a, b) => b.s - a.s).slice(0, 1200);
  const programmes = specs.map((s) => `- ${s.name} (${s.degree ?? "?"}) — ${refresh ? "check" : "missing"}: ${toCheck(s).join(", ")}`).join("\n");
  const system = `You help an agent read a university's official website. From the list of links, choose the pages (HTML or PDF) most likely to state the missing facts for the listed programmes.
Choose, in this order of priority:
1. each programme's own page and its admission / requirements / curriculum sub-pages (the site may name programmes in its own language, e.g. "Pittura" = Painting, "Grafika" = Graphic Design);
2. tuition fees and costs for international / non-EU students (fee tables, often PDFs);
3. how to apply, admission calendar and deadlines, entrance exams, application fee;
4. entry requirements for international students: language certificates, diploma recognition, documents;
5. scholarships, grants, fee waivers, financial aid;
6. visa and proof of funds for international students, if the school has such a page.
Return at most ${args.pages} URLs, copied exactly from the list. Never invent URLs.`;
  const user = `University: ${uni.name} (${uni.city}, ${uni.country})\nProgrammes with gaps:\n${programmes}\n\nLinks (url | link text):\n${ranked.map((r) => `${r.u} | ${r.t}`).join("\n")}`;
  const { data } = await generateStructured({ system, user, schema: Plan });
  return [...new Set(data.pages.map((p) => p.url).filter((u) => links.has(u)))].slice(0, Number(args.pages));
}

// ---------- 3. читання сторінок і PDF ----------
async function fetchPdf(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow", signal: AbortSignal.timeout(30000) }).catch(() => null);
  if (!res?.ok || !/pdf/i.test(res.headers.get("content-type") ?? "")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) return null;
  return { url, data: buf.toString("base64") };
}

async function readPages(urls, log) {
  const pages = [], pdfs = [];
  for (const url of urls) {
    await sleep(1200);
    if (/\.pdf($|\?)/i.test(url)) {
      if (pdfs.length >= 5) continue;
      const pdf = await fetchPdf(url);
      if (pdf) { pdfs.push(pdf); log(`   PDF: ${url}`); }
      continue;
    }
    const page = await get(url).catch(() => null);
    if (!page) continue;
    const text = htmlToText(page.body).slice(0, 20000);
    if (text.length > 200) { pages.push({ url: page.url, text }); log(`   прочитано: ${page.url}`); }
  }
  return { pages, pdfs };
}

const COMPLETE_RULES = `

THIS RUN FILLS GAPS for programmes that are already on Unexa. Extra rules:
- Facts the school states for everyone (tuition fee table, application fee, application calendar/deadlines, language certificate, required documents, scholarships, visa advice) apply to EVERY listed programme of the matching degree level: copy them into each programme unless a programme-specific value is given.
- Fees: write them as stated with the currency and period, e.g. "€2,000 / year (non-EU)" or "₴38,000 / year". If fees differ for EU and non-EU students, give the non-EU one and mention EU in brackets. If the school states study is free, write "No tuition fee" and tuition_amount 0.
- Deadlines: give the date(s) and the intake they are for, e.g. "15 January 2027 (Fall 2027 intake)". A recurring rule without a year ("every year by 31 March") is fine.
- Scholarships: list the school's own scholarships, grants and fee waivers, and any external ones the site names, as "Name (who / how much), Name (…)".
- PDF files attached to this message are official documents from the same website; read them too and cite their URLs.`;

// ---------- 4. урядові джерела за країною ----------
const COUNTRY_SOURCES = {
  France: ["https://www.campusfrance.org/en/student-visa-France", "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence", "https://france-visas.gouv.fr/en/web/france-visas/student"],
  Germany: ["https://www.study-in-germany.de/en/plan-your-studies/requirements/visa/", "https://www.daad.de/en/study-and-research-in-germany/plan-your-studies/entry-and-residence/", "https://www.daad.de/en/studying-in-germany/scholarships/"],
  Italy: ["https://studyinitaly.esteri.it/en/home", "https://vistoperitalia.esteri.it/home/en", "https://www.esteri.it/en/opportunita/borse-di-studio/per-cittadini-stranieri-e-italiani-residenti-allestero/"],
  Spain: ["https://www.exteriores.gob.es/en/ServiciosAlCiudadano/Paginas/Visados-de-estudios.aspx", "https://www.universidades.gob.es/estudiar-en-espana/"],
  Poland: ["https://study.gov.pl/", "https://nawa.gov.pl/en/students/foreign-students", "https://www.gov.pl/web/udsc-en/students"],
  "United Kingdom": ["https://www.gov.uk/student-visa", "https://www.gov.uk/student-visa/money", "https://www.chevening.org/scholarships/"],
  "United States": ["https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html", "https://foreign.fulbrightonline.org/about/foreign-student-program", "https://educationusa.state.gov/your-5-steps-us-study/finance-your-studies"],
  Canada: ["https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html", "https://www.educanada.ca/scholarships-bourses/non_can/opportunities-opportunites.aspx?lang=eng"],
  Japan: ["https://www.studyinjapan.go.jp/en/planning/visa/", "https://www.studyinjapan.go.jp/en/planning/scholarships/", "https://www.mofa.go.jp/j_info/visit/visa/long/visa6.html"],
  "South Korea": ["https://www.studyinkorea.go.kr/en/main.do", "https://www.studyinkorea.go.kr/en/sub/gks/allnew_invite.do", "https://www.visa.go.kr/openPage.do?MENU_ID=10102"],
  China: ["https://www.campuschina.org/", "https://www.campuschina.org/content/details3_74776.html", "https://www.visaforchina.cn/"],
  Ukraine: ["https://studyinukraine.gov.ua/en/", "https://mfa.gov.ua/en/consular-affairs/entering-ukraine/visa-requirements-for-foreigners", "https://dcis.gov.ua/en/"],
};

const CountryFacts = z.object({
  visa: z.string().nullable().describe("Short: which visa / permit a non-EU (or international) student needs and where to apply, under 160 chars"),
  proof_of_funds: z.string().nullable().describe("Short: how much money must be shown and how, e.g. '€11,904 / year in a blocked account', under 160 chars"),
  scholarships: z.string().nullable().describe("Government scholarships for international students, as 'Name (who / how much), Name (…)'"),
  source_urls: z.array(z.string()),
});

async function countryFacts(country, log) {
  const pages = [];
  for (const url of COUNTRY_SOURCES[country] ?? []) {
    await sleep(1000);
    const page = await get(url).catch(() => null);
    if (!page) { log(`   ✗ не відкрилось: ${url}`); continue; }
    pages.push({ url: page.url, text: htmlToText(page.body).slice(0, 20000) });
    log(`   прочитано: ${page.url}`);
    // одна-дві вкладені сторінки про візу / кошти / стипендії
    const extra = [...extractLinks(page.body, page.url).keys()].filter((u) => new URL(u).hostname === new URL(page.url).hostname && /visa|fund|money|financ|scholar|blocked|permit|stipend|bors/i.test(u)).slice(0, 2);
    for (const u of extra) {
      await sleep(1000);
      const p = await get(u).catch(() => null);
      if (p) { pages.push({ url: p.url, text: htmlToText(p.body).slice(0, 12000) }); log(`   прочитано: ${p.url}`); }
    }
  }
  if (!pages.length) return null;
  const system = `You read official government pages about studying in ${country}. Return only what the pages state, for a student from outside the EU / outside ${country}. Keep each field short and in English; null when not stated. Never invent amounts.`;
  const user = pages.map((p) => `=== PAGE: ${p.url} ===\n${p.text}`).join("\n\n");
  const { data } = await generateStructured({ system, user, schema: CountryFacts });
  return data;
}

// ---------- запуск ----------
const { data: unis, error } = await supabase.from("universities").select("*").order("name");
if (error) throw new Error(error.message);
const { data: specs, error: sErr } = await supabase.from("specialties").select("*");
if (sErr) throw new Error(sErr.message);

await mkdir("out", { recursive: true });
const done = (f) => access(f).then(() => true, () => false);
const appendNote = (note, line) => (note && note.includes(line) ? note : [note, line].filter(Boolean).join("\n"));
let filled = 0;

async function save(spec, patch, label) {
  const keys = Object.keys(patch).filter((k) => k !== "source_note");
  if (!keys.length) return;
  console.log(`   + ${spec.name}: ${keys.join(", ")}${label ? ` (${label})` : ""}`);
  filled += keys.length;
  Object.assign(spec, patch);
  if (!dryRun) {
    const { error: e } = await supabase.from("specialties").update(patch).eq("id", spec.id);
    if (e) throw new Error(`${spec.name}: ${e.message}`);
  }
}

if (!args["countries-only"]) {
  let list = unis.filter((u) => u.website_url && specs.some((s) => s[SPECIALTY_FK] === u.id && toCheck(s).length));
  if (args.only) list = list.filter((u) => norm(u.name).includes(norm(args.only)));
  if (!args.force && !refresh) {
    const flags = await Promise.all(list.map((u) => done(`out/complete-${u.id}.json`)));
    list = list.filter((_, i) => !flags[i]);
  }
  list = list.slice(0, Number(args.limit));
  console.log(`Дозаповню ${list.length} школ(и), AI: ${aiProvider}${dryRun ? " (dry-run: без запису)" : ""}\n`);

  for (const uni of list) {
    const own = specs.filter((s) => s[SPECIALTY_FK] === uni.id);
    const gaps = own.filter((s) => toCheck(s).length);
    console.log(`▶ ${uni.name} — ${refresh ? `перевіряю ${gaps.length} програм` : `${gaps.length} з ${own.length} програм мають порожні поля`}`);
    try {
      const links = await collectLinks(uni.website_url);
      console.log(`   посилань на сайті: ${links.size}`);
      const chosen = await planPages(uni, gaps, links);
      const { pages, pdfs } = await readPages([uni.website_url, ...chosen], console.log);
      if (!pages.length && !pdfs.length) throw new Error("не вдалося прочитати жодної сторінки");

      const result = await generateStructured({
        system: SYSTEM_PROMPT + COMPLETE_RULES,
        user: buildUserPrompt({ name: uni.name, city: uni.city, knownPrograms: gaps.map((s) => s.name) }, pages) +
          (pdfs.length ? `\n\nAttached PDFs, in order:\n${pdfs.map((p) => p.url).join("\n")}` : ""),
        schema: Extraction,
        pdfs,
      });
      if (!dryRun) await writeFile(`out/complete-${uni.id}.json`, JSON.stringify({ uni: uni.name, pages: pages.map((p) => p.url), pdfs: pdfs.map((p) => p.url), ...result.data }, null, 2));

      for (const spec of gaps) {
        const found = result.data.specialties.find((p) => sameProgram(p.name, spec.name));
        if (!found) { console.log(`   – ${spec.name}: не знайдено`); continue; }
        if ((found.confidence ?? 0) < minConfidence) { console.log(`   – ${spec.name}: низька впевненість (${found.confidence})`); continue; }
        const { name, confidence, source_urls, degree, ...payload } = found;
        const patch = Object.fromEntries(Object.entries(payload).filter(([k, v]) => !isEmpty(v) && k in spec &&
          (isEmpty(spec[k]) || (refresh && REFRESHABLE.includes(k) && String(v) !== String(spec[k])))));
        // число для порівняння на Dashboard, якщо модель дала лише текст
        const feeText = patch.academic_tuition_fee ?? spec.academic_tuition_fee;
        // tuition_amount is always EUR per year; models sometimes give it in £ / $, so work it out from the text
        if ((!spec.tuition_amount || refresh) && feeText) {
          const eur = yearlyTuitionEur({ tuition: feeText, country: uni.country });
          if (eur != null) patch.tuition_amount = eur;
          else delete patch.tuition_amount;
        }
        if (!spec.tuition_amount && patch.tuition_amount === 0 && !/no tuition|free/i.test(feeText ?? "")) delete patch.tuition_amount;
        if (Object.keys(patch).length && source_urls?.length) patch.source_note = appendNote(spec.source_note, `Unexa agent: ${source_urls.slice(0, 4).join(", ")}`);
        await save(spec, patch);
      }
      // коли школу востаннє звірено з її офіційним сайтом (показується на сторінці програми)
      if (!dryRun) {
        const { error: vErr } = await supabase.from("universities").update({ verified_at: new Date().toISOString() }).eq("id", uni.id);
        if (vErr) console.log(`   ! дату перевірки не записано: ${vErr.message} (виконайте sql/009_verified_at.sql)`);
      }
      console.log(`   ✓ (${result.model})`);
    } catch (err) {
      console.log(`   ✗ пропущено: ${err.message}`);
      if (/ліміт/i.test(err.message)) { console.log("\nЛіміт Gemini вичерпано. Запустіть цю ж команду пізніше — вона продовжить."); process.exit(0); }
    }
    console.log();
  }
}

if (!args["no-countries"]) {
  const countries = [...new Set(unis.map((u) => u.country))].filter((c) => COUNTRY_SOURCES[c]);
  console.log(`Віза, кошти й державні стипендії: ${countries.length} країн\n`);
  for (const country of countries) {
    const ids = new Set(unis.filter((u) => u.country === country && (!args.only || norm(u.name).includes(norm(args.only)))).map((u) => u.id));
    const targets = specs.filter((s) => ids.has(s[SPECIALTY_FK]) && ["doc_visa", "doc_bank_statement", "scholarships_text"].some((f) => isEmpty(s[f])));
    if (!targets.length) continue;
    const cacheFile = `out/country-${norm(country).replace(/ /g, "-")}.json`;
    console.log(`▶ ${country} — ${targets.length} програм`);
    try {
      let facts = null;
      if (!args.force && await done(cacheFile)) facts = JSON.parse(await (await import("node:fs/promises")).readFile(cacheFile, "utf8"));
      else {
        facts = await countryFacts(country, console.log);
        if (facts && !dryRun) await writeFile(cacheFile, JSON.stringify(facts, null, 2));
      }
      if (!facts) { console.log("   ✗ жодне джерело не відкрилось"); continue; }
      for (const spec of targets) {
        const patch = {};
        if (isEmpty(spec.doc_visa) && !isEmpty(facts.visa)) patch.doc_visa = facts.visa;
        if (isEmpty(spec.doc_bank_statement) && !isEmpty(facts.proof_of_funds)) patch.doc_bank_statement = facts.proof_of_funds;
        if (isEmpty(spec.scholarships_text) && !isEmpty(facts.scholarships)) patch.scholarships_text = facts.scholarships;
        if (Object.keys(patch).length && facts.source_urls?.length) patch.source_note = appendNote(spec.source_note, `Country info (official): ${facts.source_urls.slice(0, 3).join(", ")}`);
        await save(spec, patch, "урядове джерело");
      }
    } catch (err) {
      console.log(`   ✗ ${err.message}`);
      if (/ліміт/i.test(err.message)) break;
    }
    console.log();
  }
}

console.log(`Готово. ${dryRun ? "Було б заповнено" : "Заповнено"} полів: ${filled}.`);
