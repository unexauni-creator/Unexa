// Доповнює школи, які ВЖЕ є на сайті: читає їхній офіційний сайт і заповнює
// ПОРОЖНІ поля наявних програм (intake, дедлайни, вартість заявки, розмір групи, кампус…).
// Нових програм не додає і нічого заповненого не перезаписує.
//
//   npm run enrich -- --dry-run                 показати, що буде заповнено (без запису)
//   npm run enrich                              усі школи
//   npm run enrich -- --only "UdK" --pages 14   лише одна школа
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { crawlUniversity } from "./crawl.js";
import { extractUniversityData, aiProvider } from "./extract.js";
import { getSupabase, SPECIALTY_FK } from "./db.js";

const { values: args } = parseArgs({
  options: {
    only: { type: "string" },
    limit: { type: "string", default: "100" },
    pages: { type: "string", default: "12" },
    "min-confidence": { type: "string", default: "0.6" },
    "dry-run": { type: "boolean", default: false },
  },
});

const dryRun = args["dry-run"];
const minConfidence = Number(args["min-confidence"]);
const supabase = getSupabase();

const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const isEmpty = (v) => v === null || v === undefined || v === "" ||
  (typeof v === "string" && /^(not (in source|specified|stated|available|mentioned|provided)|n\/?a|unknown|none|-+)$/i.test(v.trim()));

// the same programme can be written a bit differently ("BFA Fashion Design" vs "Fashion Design")
function sameProgram(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const ta = new Set(x.split(" ")), tb = new Set(y.split(" "));
  const common = [...ta].filter((t) => tb.has(t)).length;
  return common / Math.min(ta.size, tb.size) >= 0.75;
}

// strip tracking parameters (?utm_source=…) from saved website links
function cleanUrl(url) {
  try {
    const u = new URL(url);
    [...u.searchParams.keys()].forEach((k) => { if (/^(utm_|gclid|gbraid|gad_)/i.test(k)) u.searchParams.delete(k); });
    return u.toString();
  } catch { return url; }
}

const { data: unis, error } = await supabase.from("universities").select("*").order("name");
if (error) throw new Error(error.message);
const { data: specs, error: sErr } = await supabase.from("specialties").select("*");
if (sErr) throw new Error(sErr.message);

let list = unis.filter((u) => u.website_url && specs.some((s) => s[SPECIALTY_FK] === u.id));
if (args.only) list = list.filter((u) => norm(u.name).includes(norm(args.only)));
list = list.slice(0, Number(args.limit));

console.log(`Доповню ${list.length} школ(и), AI: ${aiProvider}${dryRun ? " (dry-run: без запису)" : ""}\n`);
await mkdir("out", { recursive: true });

let totalFields = 0;
for (const uni of list) {
  const own = specs.filter((s) => s[SPECIALTY_FK] === uni.id);
  const site = cleanUrl(uni.website_url);
  console.log(`▶ ${uni.name} — ${own.length} програм — ${site}`);
  try {
    const pages = await crawlUniversity(site, { maxPages: Number(args.pages), log: console.log });
    if (!pages.length) throw new Error("не вдалося прочитати жодної сторінки (сайт блокує агента)");

    const result = await extractUniversityData(
      { name: uni.name, city: uni.city, knownPrograms: own.map((s) => s.name) },
      pages,
    );
    await writeFile(`out/enrich-${uni.id}.json`, JSON.stringify({ uni: uni.name, pages: pages.map((p) => p.url), ...result.data }, null, 2));

    let fields = 0;
    for (const spec of own) {
      const found = result.data.specialties.find((p) => sameProgram(p.name, spec.name));
      if (!found) { console.log(`   – ${spec.name}: на сайті не знайдено`); continue; }
      if ((found.confidence ?? 0) < minConfidence) { console.log(`   – ${spec.name}: низька впевненість (${found.confidence})`); continue; }

      const { name, confidence, source_urls, ...payload } = found;
      const patch = Object.fromEntries(
        Object.entries(payload).filter(([k, v]) => !isEmpty(v) && k in spec && isEmpty(spec[k])),
      );
      if (isEmpty(spec.source_note) && source_urls?.length) patch.source_note = `Unexa agent: ${source_urls.join(", ")}`;
      const keys = Object.keys(patch).filter((k) => k !== "source_note");
      if (!keys.length) { console.log(`   = ${spec.name}: нового нічого`); continue; }

      console.log(`   + ${spec.name}: ${keys.join(", ")}`);
      fields += keys.length;
      if (!dryRun) {
        const { error: e } = await supabase.from("specialties").update(patch).eq("id", spec.id);
        if (e) throw new Error(`${spec.name}: ${e.message}`);
      }
    }

    // порожній опис школи
    if (isEmpty(uni.description) && result.data.university_description) {
      console.log("   + опис школи");
      if (!dryRun) await supabase.from("universities").update({ description: result.data.university_description }).eq("id", uni.id);
    }
    // прибрати рекламні параметри з посилання на сайт
    if (site !== uni.website_url && !dryRun) await supabase.from("universities").update({ website_url: site }).eq("id", uni.id);

    console.log(`   ✓ заповнено полів: ${fields} (${result.model})`);
    totalFields += fields;
  } catch (err) {
    console.log(`   ✗ пропущено: ${err.message}`);
  }
  console.log();
}

console.log(`Готово. ${dryRun ? "Було б заповнено" : "Заповнено"} полів: ${totalFields}.`);
