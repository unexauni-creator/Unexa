// Photos for the Dorm page: each residence's main photo from its own official page, and a photo for
// the housing page as a whole. No AI: it reads the image the page itself shares (og:image) or the
// first real photo on it, skipping logos. Only the image fields are written; the rest is untouched.
//
//   npm run housing-photos -- --dry-run      show what it found
//   npm run housing-photos                    schools whose housing has no photo yet
//   npm run housing-photos -- --force --only "Goldsmiths"
import { parseArgs } from "node:util";
import { findPageImage } from "./photo.js";
import { getSupabase } from "./db.js";

const { values: args } = parseArgs({
  options: { only: { type: "string" }, force: { type: "boolean", default: false }, "dry-run": { type: "boolean", default: false } },
});
const supabase = getSupabase();
const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const { data: unis, error } = await supabase.from("universities").select("id,name,cover_image_url,housing").order("name");
if (error) throw new Error(error.message);
let list = unis.filter((u) => u.housing && (args.force || !u.housing.image));
if (args.only) list = list.filter((u) => norm(u.name).includes(norm(args.only)));
console.log(`Фото житла: ${list.length} школ(и)${args["dry-run"] ? " (dry-run)" : ""}\n`);

let found = 0;
for (const uni of list) {
  const h = uni.housing;
  const used = new Set([uni.cover_image_url].filter(Boolean)); // never reuse the school's own cover
  const options = [];
  for (const o of h.options ?? []) {
    let image = o.image ?? null;
    if (!image && o.url) image = await findPageImage(o.url, used).catch(() => null);
    if (image) used.add(image);
    options.push({ ...o, image });
  }
  let image = null;
  for (const page of [h.url, h.apply_url].filter(Boolean)) {
    image = await findPageImage(page, used).catch(() => null);
    if (image) break;
  }
  image = image ?? options.find((o) => o.image)?.image ?? null;
  const n = options.filter((o) => o.image).length;
  console.log(`▶ ${uni.name}: головне ${image ? "так" : "ні"}, резиденцій з фото ${n}/${options.length}`);
  if (image || n) found++;
  if (!args["dry-run"] && (image || n)) {
    // read again right before writing, so a parallel agent run isn't overwritten
    const { data: fresh } = await supabase.from("universities").select("housing").eq("id", uni.id).single();
    const cur = fresh?.housing ?? h;
    const merged = { ...cur, image: image ?? cur.image ?? null,
      options: (cur.options ?? []).map((o) => ({ ...o, image: o.image ?? options.find((x) => x.name === o.name)?.image ?? null })) };
    const { error: e } = await supabase.from("universities").update({ housing: merged }).eq("id", uni.id);
    if (e) console.log(`   ✗ ${e.message}`);
  }
}
console.log(`\nГотово: фото знайдено для ${found} з ${list.length}.`);
