// Deeper housing for the Dorm page. Many art schools only say "ask the regional agency", so besides the
// school's own housing pages this reads the official student-housing agency the school points to
// (EDISU, ESU, DSU, CROUS, Studierendenwerk…) and collects real residences with monthly prices,
// plus the typical private rent in the city when an official page states it.
// Writes universities.housing (version 3). Keeps the old data when the new pass finds less.
//
//   npm run housing -- --dry-run --only "Albertina"   show the result, no saving
//   npm run housing                                    schools with no prices yet
//   npm run housing -- --force                         every school again
//   npm run housing -- --no-prices                     only schools whose residences have no price yet
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { crawlUniversity, extractLinks, get, HOUSING_FOCUS, htmlToText } from "./crawl.js";
import { generateStructured, aiProvider } from "./extract.js";
import { getSupabase } from "./db.js";
import { findPageImage } from "./photo.js";

const { values: args } = parseArgs({
  options: {
    only: { type: "string" },
    limit: { type: "string", default: "100" },
    force: { type: "boolean", default: false },
    "no-prices": { type: "boolean", default: false }, // only schools whose residences still have no price
    "dry-run": { type: "boolean", default: false },
  },
});
const VERSION = 3;

// Official regional student-service bodies that run residences, by city (only ones we are sure of)
const AGENCIES = {
  Turin: "https://www.edisu.piemonte.it/en",
  Venice: "https://www.esuvenezia.it/",
  Florence: "https://www.dsu.toscana.it/",
  Paris: "https://www.crous-paris.fr/",
  Berlin: "https://www.stw.berlin/en/",
  Halle: "https://www.studentenwerk-halle.de/",
  Karlsruhe: "https://www.sw-ka.de/en/",
  Offenbach: "https://www.swffm.de/en/",
  Cologne: "https://www.kstw.de/",
};
// words that mark a link to a housing agency on another site
const AGENCY_LINK = /edisu|esu|dsu|crous|studentenwerk|studierendenwerk|stw\.|housing agency|student housing|residence hall|accommodation office|wohnheim|alloggi|residenze|résidence|akademik|гуртож/i;

const Option = z.object({
  name: z.string().describe("Name of the residence or housing option"),
  type: z.string().nullable().describe("e.g. 'Single room', 'Double room', 'Studio', 'Shared flat'"),
  price: z.string().nullable().describe("Monthly price as stated, ALWAYS with currency and period, e.g. '€320 / month' or '€280–€410 / month'. Convert a yearly or weekly price only if the page gives it that way, and say so"),
  distance: z.string().nullable().describe("Distance or travel time to the school if stated"),
  url: z.string().nullable(),
});
const Housing = z.object({
  available: z.enum(["own", "partner", "none", "unknown"]).describe("own: the school runs residences; partner: an agency or partner residences house its students; none: it says there is no housing; unknown"),
  provider: z.string().nullable().describe("Who runs the housing, e.g. 'EDISU Piemonte (regional agency)', 'the school'"),
  summary: z.string().nullable().describe("1-2 sentences in English: what housing exists for students of this school"),
  guarantee: z.string().nullable().describe("Who gets a place or priority (e.g. scholarship holders, first-year, international students), if stated"),
  options: z.array(Option).describe("Up to 6 real residences or room types, preferring ones with prices"),
  how_to_apply: z.string().nullable().describe("1-2 sentences: how and when to apply, with the deadline or period if stated"),
  apply_url: z.string().nullable(),
  allocation: z.string().nullable().describe("1-2 short sentences: how rooms are given out (choose preferences, ranking, lottery, first come first served, scholarship list) and what the price includes (bills, contract length), as stated"),
  city_rent: z.string().nullable().describe("Typical private rent in the city as stated on an official page, e.g. 'Room in a shared flat: €400–€550 / month'. Null if no page states it"),
  private_tips: z.string().nullable().describe("One sentence of advice from the pages about finding private housing"),
  url: z.string().nullable().describe("Main official housing page"),
});

const SYSTEM = `You collect facts for Unexa, a platform that helps students choose a creative school abroad.
You receive plain text of pages from ONE school's official website and, where it exists, the official student-housing agency that serves its students (pages may be in any language).
Fill the housing facts for international students of this school: who provides housing, real residences or room types WITH MONTHLY PRICES exactly as written (with currency), how and when to apply, how rooms are allocated and what the price includes, and the typical private rent in the city if an official page states it.
Write in English, short and concrete. Never invent residences, prices, deadlines or numbers: use null or empty lists when the pages don't say. Every url must be a page from the input.`;

async function readSite(url, max) {
  return crawlUniversity(url, { maxPages: max, focus: HOUSING_FOCUS }).catch(() => []);
}

const supabase = getSupabase();
const dryRun = args["dry-run"];
await mkdir("out", { recursive: true });

const { data: unis, error } = await supabase.from("universities").select("id,name,city,website_url,housing").order("name");
if (error) throw new Error(error.message);
const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const hasPrices = (h) => (h?.options ?? []).some((o) => o.price);
let list = unis.filter((u) => u.website_url && (args.force || (h => h?.version !== VERSION && !hasPrices(h))(u.housing)));
if (args["no-prices"]) list = unis.filter((u) => u.website_url && !hasPrices(u.housing));
if (args.only) list = unis.filter((u) => norm(u.name).includes(norm(args.only)));
list = list.slice(0, Number(args.limit));
console.log(`Житло: ${list.length} школ(и), AI: ${aiProvider}${dryRun ? " (dry-run)" : ""}\n`);

let ok = 0;
for (const uni of list) {
  console.log(`▶ ${uni.name} (${uni.city})`);
  try {
    const site = uni.website_url.replace(/[?#].*$/, "");
    const own = await readSite(site, 8);
    // agency: the one we know for the city, plus any agency site the school's housing pages link to
    const agencyUrls = new Set();
    const known = Object.entries(AGENCIES).find(([city]) => (uni.city ?? "").includes(city))?.[1];
    if (known) agencyUrls.add(known);
    for (const p of own) {
      const page = await get(p.url).catch(() => null);
      if (!page) continue;
      for (const [href, label] of extractLinks(page.body, page.url)) {
        try {
          if (new URL(href).hostname !== new URL(site).hostname && AGENCY_LINK.test(`${href} ${label}`)) agencyUrls.add(new URL(href).origin + "/");
        } catch { /* bad link */ }
      }
    }
    const agencyPages = [];
    for (const a of [...agencyUrls].slice(0, 2)) {
      const pages = await readSite(a, 7);
      console.log(`   агенція ${a}: сторінок ${pages.length}`);
      agencyPages.push(...pages);
    }
    const pages = [...new Map([...own, ...agencyPages].map((p) => [p.url, p])).values()]; // grows in the price pass
    if (!pages.length) throw new Error("сайти не відкрились");

    const corpus = pages.map((p) => `=== PAGE: ${p.url} ===\n${p.text.slice(0, 12000)}`).join("\n\n");
    const result = await generateStructured({ system: SYSTEM, user: `School: ${uni.name} (${uni.city})\n\n${corpus}`, schema: Housing });
    let h = result.data;
    // second pass for prices: read the residences' own pages and any fees / rates page on the same sites
    if (h.options.length && !h.options.some((o) => o.price)) {
      const PRICE_LINK = /tarif|fee|cost|rate|price|prezz|cost[io]|kosten|miete|loyer|cennik|opłat|вартіст/i;
      const extraUrls = new Set(h.options.map((o) => o.url).filter(Boolean));
      for (const base of [...agencyUrls, site].slice(0, 3)) {
        const home = await get(base).catch(() => null);
        if (!home) continue;
        for (const [href, label] of extractLinks(home.body, home.url)) {
          if (PRICE_LINK.test(`${href} ${label}`) && new URL(href).hostname === new URL(home.url).hostname) extraUrls.add(href);
        }
      }
      const extra = [];
      for (const u of [...extraUrls].filter((u) => !pages.some((p) => p.url === u)).slice(0, 8)) {
        const page = await get(u).catch(() => null);
        if (page) extra.push({ url: page.url, text: htmlToText(page.body).slice(0, 10000) });
      }
      if (extra.length) {
        pages.push(...extra);
        const again = await generateStructured({ system: SYSTEM, user: `School: ${uni.name} (${uni.city})\n\n${pages.map((p) => `=== PAGE: ${p.url} ===\n${p.text.slice(0, 10000)}`).join("\n\n")}`, schema: Housing });
        if (again.data.options.some((o) => o.price) || again.data.city_rent) h = again.data;
        console.log(`   + ще ${extra.length} сторінок резиденцій і тарифів`);
      }
    }
    const okUrl = (u) => (u && /^https?:\/\//.test(u) ? u : null);
    h.options = h.options.slice(0, 6).map((o) => ({ ...o, url: okUrl(o.url) }));
    h.url = okUrl(h.url); h.apply_url = okUrl(h.apply_url);

    // photos: each residence from its own page, the housing as a whole from the main housing page
    const used = new Set();
    for (const o of h.options) { o.image = o.url ? await findPageImage(o.url, used).catch(() => null) : null; if (o.image) used.add(o.image); }
    h.image = (h.url ? await findPageImage(h.url, used).catch(() => null) : null) ?? h.options.find((o) => o.image)?.image ?? null;

    // keep the old data if this pass found less
    const old = uni.housing;
    const score = (x) => (x?.options?.length ?? 0) + (hasPrices(x) ? 3 : 0) + (x?.how_to_apply ? 1 : 0) + (x?.city_rent ? 2 : 0);
    const better = score(h) >= score(old);
    const next = better ? { ...h, version: VERSION, collected_at: new Date().toISOString(), source_urls: pages.map((p) => p.url) } : old;
    await writeFile(`out/housing-${uni.id}.json`, JSON.stringify({ name: uni.name, kept_old: !better, ...h }, null, 2));
    console.log(`   ${better ? "+" : "="} ${h.available}, варіантів ${h.options.length}, з цінами ${h.options.filter((o) => o.price).length}, оренда в місті: ${h.city_rent ? "так" : "ні"} (${result.model})`);
    if (!dryRun && better) {
      const { error: e } = await supabase.from("universities").update({ housing: next }).eq("id", uni.id);
      if (e) throw new Error(e.message);
    }
    ok++;
  } catch (e) {
    console.log(`   ✗ ${e.message}`);
    if (/ліміт/i.test(e.message)) { console.log("\nЛіміт Gemini вичерпано. Запустіть ще раз пізніше: продовжить з цього місця."); break; }
  }
  console.log();
}
console.log(`Готово: ${ok} з ${list.length}.`);
