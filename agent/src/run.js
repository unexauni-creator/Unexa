// Повний цикл агента: реєстр → сайт → AI (Gemini або Claude) → чернетки в Supabase.
//
// Агент шукає лише ТВОРЧІ програми (мистецтво, дизайн, архітектура, мода, музика, театр, кіно…).
//
// npm run run-agent -- --limit 3                       перші 3 творчі школи
// npm run run-agent -- --only "Beaux-Arts"             лише заклади з цим словом у назві
// npm run run-agent -- --scope universities --limit 3  творчі програми в університетах
// npm run run-agent -- --limit 3 --dry-run             не писати в Supabase, тільки у agent/out/
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
if (args.only) list = list.filter((u) => `${u.name} ${u.nameLocal}`.toLowerCase().includes(args.only.toLowerCase()));
list = list.slice(0, Number(args.limit));
if (args.url) list = list.map((u) => ({ ...u, websiteUrl: args.url }));

console.log(`Реєстр: ${REGISTRIES[args.country.toLowerCase()].label}`);
console.log(`Агент обробить ${list.length} заклад(и), AI: ${aiProvider}${dryRun ? " (dry-run: без запису в базу)" : ""}\n`);
await mkdir("out", { recursive: true });

let ok = 0;
for (const uni of list) {
  console.log(`▶ ${uni.name} — ${uni.websiteUrl}`);
  try {
    const pages = await crawlUniversity(uni.websiteUrl, { maxPages: Number(args.pages), log: console.log });
    if (!pages.length) throw new Error("не вдалося прочитати жодної сторінки");

    const result = await extractUniversityData(uni, pages);
    const n = result.data.specialties.length;
    if (n === 0) {
      console.log("   – творчих програм не знайдено, пропускаю");
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
  }
  console.log();
}

console.log(`Готово: ${ok} з ${list.length}.${supabase ? " Перевірте чернетки: npm run review" : ""}`);
