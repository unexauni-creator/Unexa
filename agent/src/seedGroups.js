// Replaces the test community groups with real ones: one per country of our schools, one per field, and topic groups.
// Each group gets a photo from our own schools / programmes (already checked by `npm run audit-photos`).
// Only empty groups are removed: groups with members or posts are kept.
//
//   npm run seed-groups -- --dry-run     show what would be created
//   npm run seed-groups                   replace the groups
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { getSupabase } from "./db.js";

const { values: args } = parseArgs({ options: { "dry-run": { type: "boolean", default: false } } });
const supabase = getSupabase();
const rejected = (() => { try { return new Set(JSON.parse(readFileSync("out/rejected-images.json", "utf8"))); } catch { return new Set(); } })();

const { data: unis, error } = await supabase.from("universities").select("name, city, country, cover_image_url, specialties(name, image_url)");
if (error) throw new Error(error.message);

const used = new Set();
const ok = (u) => u && !rejected.has(u) && !used.has(u);
const take = (u) => { used.add(u); return u; };
const programmes = unis.flatMap((u) => u.specialties.map((s) => ({ ...s, country: u.country })));
function photoFor({ countries, match }) {
  if (countries) {
    const inCountry = unis.filter((u) => countries.includes(u.country));
    const cover = inCountry.map((u) => u.cover_image_url).find(ok);
    if (cover) return take(cover);
    const prog = programmes.filter((p) => countries.includes(p.country)).map((p) => p.image_url).find(ok);
    return prog ? take(prog) : null;
  }
  const hit = programmes.filter((p) => match.test(p.name)).map((p) => p.image_url).find(ok);
  return hit ? take(hit) : null;
}
const citiesOf = (countries) => [...new Set(unis.filter((u) => countries.includes(u.country)).map((u) => u.city?.split("/")[0]).filter(Boolean))].slice(0, 3).join(", ");

const COUNTRY_GROUPS = [
  ["Studying in Spain", ["Spain"], "Spain"],
  ["Studying in the UK", ["United Kingdom"], "United Kingdom"],
  ["Studying in France", ["France"], "France"],
  ["Studying in Germany", ["Germany"], "Germany"],
  ["Studying in Italy", ["Italy"], "Italy"],
  ["Studying in Poland", ["Poland"], "Poland"],
  ["Studying in Ukraine", ["Ukraine"], "Ukraine"],
  ["Studying in the USA & Canada", ["United States", "Canada"], "USA & Canada"],
  ["Studying in East Asia", ["South Korea", "Japan", "China"], "South Korea, Japan, China"],
];
const FIELD_GROUPS = [
  ["Graphic Design", /graphic|communication design|visual communication/i],
  ["Fine Arts", /fine art|painting|sculpture/i],
  ["Architecture & Interior", /architect|interior/i],
  ["Fashion & Textile", /fashion|textile|costume/i],
  ["Film & Animation", /film|animation|cinema|audiovisual/i],
  ["Illustration & Photography", /illustration|photograph/i],
];
const TOPIC_GROUPS = [
  ["Portfolio Reviews", /portfolio|foundation|drawing|art graphics/i, "Share your work and get honest feedback"],
  ["IELTS & Language Tests", /education|pedagog|teaching/i, "Tips for IELTS, TOEFL and other tests"],
  ["Scholarships & Funding", /master|ma /i, "Grants, scholarships and paying for school"],
  ["Visa & Moving Abroad", /design|media/i, "Visas, documents and the first weeks abroad"],
  ["Housing & Roommates", /product|industrial|object/i, "Dorms, flats and finding roommates"],
];

const groups = [
  ...COUNTRY_GROUPS.map(([name, countries, label]) => ({ name, city: citiesOf(countries) || null, country: label, image_url: photoFor({ countries }) })),
  ...FIELD_GROUPS.map(([name, match]) => ({ name, city: null, country: "Students worldwide", image_url: photoFor({ match }) })),
  ...TOPIC_GROUPS.map(([name, match, about]) => ({ name, city: null, country: about, image_url: photoFor({ match }) })),
].map((g) => ({ ...g, member_count: null }));

for (const g of groups) console.log(`${g.image_url ? "✓" : "– no photo"}  ${g.name}  ·  ${[g.city, g.country].filter(Boolean).join(", ")}`);
if (args["dry-run"]) process.exit(0);

// remove only empty old groups
const { data: old } = await supabase.from("community_groups").select("id, name");
const { data: stats } = await supabase.from("community_group_stats").select("group_id, members, posts");
const busy = new Set((stats ?? []).filter((s) => s.members > 0 || s.posts > 0).map((s) => s.group_id));
const toRemove = old.filter((g) => !busy.has(g.id) && !groups.some((n) => n.name === g.name));
if (toRemove.length) {
  const { error: e } = await supabase.from("community_groups").delete().in("id", toRemove.map((g) => g.id));
  if (e) throw new Error(e.message);
}
const existing = new Set(old.filter((g) => !toRemove.includes(g)).map((g) => g.name));
const fresh = groups.filter((g) => !existing.has(g.name));
const { error: e2 } = await supabase.from("community_groups").insert(fresh);
if (e2) throw new Error(e2.message);
console.log(`\nПрибрано старих порожніх груп: ${toRemove.length}. Додано нових: ${fresh.length}.`);
