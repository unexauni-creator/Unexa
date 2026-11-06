// Повний цикл агента: реєстр → сайт → AI (Gemini або Claude) → чернетки в Supabase.
//
// Агент шукає лише ТВОРЧІ програми (мистецтво, дизайн, архітектура, мода, музика, театр, кіно…).
//
// npm run run-agent -- --limit 3                       перші 3 творчі школи
// npm run run-agent -- --only "Beaux-Arts"             лише заклади з цим словом у назві
// npm run run-agent -- --scope universities --limit 3  творчі програми в університетах
// npm run run-agent -- --limit 3 --dry-run             не писати в Supabase, тільки у agent/out/
// npm run run-agent -- --country us --only "Pratt|Cooper" --limit 2   кілька шкіл через |
//
// --limit рахує школи, які вдалося зібрати. Якщо сайт блокує агента або на ньому не видно програм,
// школа НЕ додається: агент просто переходить до наступної. Школи, які вже є на сайті, пропускаються.
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { fetchInstitutions, REGISTRIES } from "./registry/index.js";
import { crawlUniversity } from "./crawl.js";
import { extractUniversityData, aiProvider } from "./extract.js";
import { getSupabase, saveDraft } from "./db.js";

const { values: args } = parseArgs({
  options: {
    limit: { type: "string", default: "3" },
    country: { type: "string", default: "fr" }, // fr | ua | pl | es | it | de
    url: { type: "string" }, // інша адреса сайту, якщо в реєстрі вона застаріла
    only: { type: "string" },
    scope: { type: "string", default: "creative" }, // creative | universities | all
    "dry-run": { type: "boolean", default: false },
    pages: { type: "string", default: "12" },
  },
});

const dryRun = args["dry-run"];
const supabase = dryRun ? null : getSupabase();

let list = await fetchInstitutions(args.country, { scope: args.scope });
if (args.only) {
  const wanted = args.only.toLowerCase().split("|").map((w) => w.trim());
  const position = (u) => wanted.findIndex((w) => `${u.name} ${u.nameLocal}`.toLowerCase().includes(w));
  list = list.filter((u) => position(u) >= 0).sort((a, b) => position(a) - position(b)); // у вказаному порядку
}
if (args.url) list = list.map((u) => ({ ...u, websiteUrl: args.url }));

// школи, які вже є на сайті, не обробляємо вдруге
if (supabase) {
  const norm = (s) => (s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; } };
  const { data: existing } = await supabase.from("universities").select("name, website_url");
  const names = new Set(existing.map((u) => norm(u.name)));
  const hosts = new Set(existing.map((u) => host(u.website_url)).filter(Boolean));
  list = list.filter((u) => !names.has(norm(u.name)) && !hosts.has(host(u.websiteUrl)));
}
const limit = Number(args.limit);

console.log(`Реєстр: ${REGISTRIES[args.country.toLowerCase()].label}`);
console.log(`Кандидатів: ${list.length}, мета: ${limit} шкіл, AI: ${aiProvider}${dryRun ? " (dry-run: без запису в базу)" : ""}\n`);
await mkdir("out", { recursive: true });

let ok = 0;
for (const uni of list) {
  if (ok >= limit) break;
  console.log(`▶ ${uni.name} — ${uni.websiteUrl}`);
  try {
    const pages = await crawlUniversity(uni.websiteUrl, { maxPages: Number(args.pages), log: console.log });
    if (!pages.length) throw new Error("сайт блокує агента або не відкривається: школу не додаю");

    const result = await extractUniversityData(uni, pages);
    const n = result.data.specialties.length;
    if (n === 0) {
      console.log("   – програм на сайті не видно: школу не додаю");
      console.log();
      continue;
    }
    console.log(`   ${result.model} знайшов програм: ${n} (вхід ${result.usage.input} / вихід ${result.usage.output} токенів)`);

    await writeFile(`out/${uni.registryId}.json`, JSON.stringify({ uni, pages: pages.map((p) => p.url), ...result.data }, null, 2));

    if (supabase) {
      const id = await saveDraft(supabase, uni, result, pages);
      console.log(`   ✓ чернетку збережено в Supabase (${id.slice(0, 8)})`);
    } else {
      console.log(`   ✓ збережено у agent/out/${uni.registryId}.json`);
    }
    ok++;
  } catch (err) {
    console.log(`   ✗ пропущено: ${err.message}`);
    // ліміт Gemini: далі немає сенсу, запустіть цю ж команду пізніше
    if (/ліміт/i.test(err.message)) break;
  }
  console.log();
}

console.log(`Готово: зібрано ${ok} з ${limit}.${supabase ? " Перевірте чернетки: npm run review" : ""}`);
