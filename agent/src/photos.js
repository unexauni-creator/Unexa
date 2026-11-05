// Заповнює фото (cover_image_url) університетам, у яких його ще немає,
// беручи головне фото з їхнього офіційного сайту. Наявні фото не перезаписує.
//
// npm run photos -- --dry-run     лише показати, що знайдено, без запису в базу
// npm run photos                  записати знайдені фото
// npm run photos -- --fix-broken  також замінити фото, посилання на які не відкриваються
import { parseArgs } from "node:util";
import { getSupabase } from "./db.js";
import { findCoverImage } from "./photo.js";

const { values: args } = parseArgs({ options: { "dry-run": { type: "boolean", default: false }, "fix-broken": { type: "boolean", default: false } } });
const supabase = getSupabase();

const { data, error } = await supabase.from("universities").select("id, name, website_url, cover_image_url");
if (error) throw new Error(error.message);

// Чи відкривається наявне фото (бите посилання = те саме, що фото немає)
async function loads(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000) });
    await r.body?.cancel();
    return r.ok && (r.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

const missing = [];
for (const u of data.filter((x) => x.website_url)) {
  if (!u.cover_image_url) missing.push(u);
  else if (args["fix-broken"] && !(await loads(u.cover_image_url))) {
    console.log(`⚠ бите фото: ${u.name}`);
    missing.push(u);
  }
}
console.log(`Без фото або з битим фото: ${missing.length} з ${data.length}${args["dry-run"] ? " (dry-run: без запису)" : ""}\n`);

let filled = 0;
for (const u of missing) {
  const cover = await findCoverImage(u.website_url).catch(() => null);
  if (!cover) {
    console.log(`– ${u.name}: фото не знайдено (лишиться заглушка)`);
    continue;
  }
  console.log(`✓ ${u.name}\n   ${cover}`);
  if (!args["dry-run"]) {
    const { error: e } = await supabase.from("universities").update({ cover_image_url: cover }).eq("id", u.id);
    if (e) console.log(`   ✗ ${e.message}`);
    else filled++;
  }
}
if (!args["dry-run"]) console.log(`\nДодано фото: ${filled}.`);
