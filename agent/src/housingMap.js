// Map data for the Dorm page, no AI: finds the school and each residence on OpenStreetMap
// (Nominatim) and works out the walking route between them (OSRM foot router run by openstreetmap.de).
// Writes housing.map = { school: {lat, lng} } and option.location / walk_min / km. Only those fields.
// Both services are free and ask for at most one request per second and a clear user agent.
//
//   npm run housing-map -- --dry-run --only "Goldsmiths"
//   npm run housing-map              schools with residences but no map yet
//   npm run housing-map -- --force
import { parseArgs } from "node:util";
import { getSupabase } from "./db.js";

const { values: args } = parseArgs({
  options: { only: { type: "string" }, force: { type: "boolean", default: false }, "dry-run": { type: "boolean", default: false } },
});
const UA = "UnexaUniversityAgent/0.1 (+https://unexa-pi.vercel.app)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function geocode(q) {
  await sleep(1100);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { "User-Agent": UA, "Accept-Language": "en" }, signal: AbortSignal.timeout(15000) }).catch(() => null);
  const [hit] = res?.ok ? await res.json() : [];
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
}
function km(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
async function walk(a, b) {
  await sleep(600);
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) }).catch(() => null);
  const data = res?.ok ? await res.json() : null;
  const r = data?.routes?.[0];
  return r ? { min: Math.round(r.duration / 60), km: Math.round(r.distance / 100) / 10 } : null;
}

const supabase = getSupabase();
const { data: unis, error } = await supabase.from("universities").select("id,name,city,country,housing").order("name");
if (error) throw new Error(error.message);
let list = unis.filter((u) => u.housing?.options?.length && (args.force || !u.housing.map));
if (args.only) list = list.filter((u) => norm(u.name).includes(norm(args.only)));
console.log(`Карта житла: ${list.length} школ(и)${args["dry-run"] ? " (dry-run)" : ""}\n`);

for (const uni of list) {
  const h = uni.housing;
  const school = (await geocode(uni.name)) ?? (await geocode(`${uni.name}, ${uni.city}`));
  if (!school) { console.log(`▶ ${uni.name}: школу на карті не знайдено`); continue; }
  const options = [];
  for (const o of h.options) {
    // what the school itself says: "On campus", "5-minute walk", "20 min"
    const said = String(o.distance ?? "");
    const onCampus = /on[ -]campus|on site|campus itself/i.test(said);
    const saidMin = Number(said.match(/(\d+)\s*-?\s*min/i)?.[1]) || null;
    let loc = onCampus ? { ...school } : (await geocode(`${o.name}, ${uni.city}`)) ?? (await geocode(`${o.name}, ${uni.name}`));
    if (loc && km(loc, school) > 15) loc = null; // a namesake somewhere else
    let route = loc && !onCampus ? await walk(loc, school) : onCampus ? { min: 0, km: 0 } : null;
    // the map must agree with the school's own words, otherwise it found the wrong building
    if (route && saidMin != null && route.min > saidMin * 3 + 10) { loc = null; route = null; }
    if (route && saidMin == null && route.min > 90) { loc = null; route = null; }
    options.push({ name: o.name, location: loc, walk_min: route?.min ?? null, km: route?.km ?? (loc ? Math.round(km(loc, school) * 10) / 10 : null) });
  }
  const found = options.filter((o) => o.location).length;
  console.log(`▶ ${uni.name}: школа ✓, резиденцій на карті ${found}/${options.length}${options.filter((o) => o.walk_min != null).map((o) => ` · ${o.name.slice(0, 18)} ${o.walk_min} хв`).join("")}`);
  if (args["dry-run"]) continue;
  // read again right before writing, so a parallel agent run isn't overwritten
  const { data: fresh } = await supabase.from("universities").select("housing").eq("id", uni.id).single();
  const cur = fresh?.housing ?? h;
  const merged = { ...cur, map: { school },
    options: (cur.options ?? []).map((o) => { const m = options.find((x) => x.name === o.name); return m ? { ...o, location: m.location, walk_min: m.walk_min, km: m.km } : o; }) };
  const { error: e } = await supabase.from("universities").update({ housing: merged }).eq("id", uni.id);
  if (e) console.log(`   ✗ ${e.message}`);
}
console.log("\nГотово.");
