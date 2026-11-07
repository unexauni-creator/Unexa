// Checks the school cover photos and programme card photos with Gemini (it sees the images) and removes unsuitable ones:
// maps, diagrams, screenshots, logos, text graphics and very light photos (white card text would not read).
// Removed photos are remembered in agent/out/rejected-images.json so they are never picked again;
// then run `npm run photos -- --programs` to give those programmes new photos.
//
//   npm run audit-photos -- --dry-run      show what would be removed
//   npm run audit-photos                    remove unsuitable photos
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { getSupabase } from "./db.js";
import { generateStructured } from "./extract.js";

const { values: args } = parseArgs({
  options: { "dry-run": { type: "boolean", default: false }, only: { type: "string" } },
});
const supabase = getSupabase();

const REJECTED = "out/rejected-images.json";
const AUDITED = "out/audited-images.json";
const readJson = async (p) => JSON.parse(await readFile(p, "utf8").catch(() => "[]"));
const rejected = new Set(await readJson(REJECTED));
const audited = new Set(await readJson(AUDITED));

const Review = z.object({
  photos: z.array(z.object({
    index: z.number(),
    problem: z.enum(["none", "map", "diagram_or_chart", "screenshot_or_text", "logo", "too_light", "not_a_photo"]),
  })),
});
const SYSTEM = `You check photos used as background of programme cards on a study-abroad site. White text sits on the lower part of each photo.
For each numbered photo give one problem:
- "map" for maps or floor plans
- "diagram_or_chart" for diagrams, charts, org charts
- "screenshot_or_text" for screenshots, posters or images that are mostly text
- "logo" for logos or emblems
- "too_light" when the photo is mostly white or very pale with low contrast, so white text on it would be hard to read
- "not_a_photo" for other non-photographic graphics
- "none" for a normal, reasonably toned photograph (buildings, studios, people, artworks are fine).`;

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 UnexaAgent/0.1" }, signal: AbortSignal.timeout(20000) }).catch(() => null);
  if (!res?.ok) return null;
  const type = (res.headers.get("content-type") ?? "").split(";")[0];
  if (!/image\/(jpeg|png|webp)/.test(type)) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  return bytes.length > 3_000_000 ? null : { mimeType: type, data: bytes.toString("base64") };
}

const { data: unis, error } = await supabase.from("universities").select("id, name, cover_image_url, specialties(id, name, image_url)").order("name");
if (error) throw new Error(error.message);
const norm = (s) => (s ?? "").toLowerCase();
const list = args.only ? unis.filter((u) => norm(u.name).includes(norm(args.only))) : unis;

let removed = 0;
for (const uni of list) {
  const urls = [...new Set([uni.cover_image_url, ...uni.specialties.map((s) => s.image_url)].filter((u) => u && !audited.has(u)))].slice(0, 20);
  if (!urls.length) continue;
  const loaded = [];
  for (const url of urls) {
    const inline = await download(url);
    if (inline) loaded.push({ url, inline });
  }
  if (!loaded.length) continue;

  const parts = [{ text: `School: ${uni.name}. Photos:` }];
  loaded.forEach((p, i) => parts.push({ text: `Photo ${i}:` }, { inlineData: p.inline }));
  let review;
  try {
    review = await generateStructured({ system: SYSTEM, user: [{ role: "user", parts }], schema: Review });
  } catch (e) {
    console.log(`✗ ${uni.name}: ${e.message}`);
    if (/ліміт/i.test(e.message)) break;
    continue;
  }

  const bad = review.data.photos.filter((p) => loaded[p.index] && p.problem !== "none");
  for (const p of loaded) audited.add(p.url);
  console.log(`▶ ${uni.name}: перевірено ${loaded.length}, невдалих ${bad.length}${bad.length ? " (" + bad.map((b) => b.problem).join(", ") + ")" : ""}`);
  for (const b of bad) {
    const url = loaded[b.index].url;
    rejected.add(url);
    const specs = uni.specialties.filter((s) => s.image_url === url);
    for (const s of specs) {
      console.log(`   – ${s.name}: ${b.problem}`);
      if (!args["dry-run"]) {
        const { error: e } = await supabase.from("specialties").update({ image_url: null }).eq("id", s.id);
        if (e) console.log(`     ✗ ${e.message}`);
        else removed++;
      }
    }
  }
  // a bad school cover is replaced by one of the school's own programme photos that passed the check
  if (rejected.has(uni.cover_image_url)) {
    const good = uni.specialties.map((s) => s.image_url).find((u) => u && audited.has(u) && !rejected.has(u)) ?? null;
    console.log(`   – фото школи: ${good ? "замінено фото однієї з програм" : "прибрано"}`);
    if (!args["dry-run"]) {
      const { error: e } = await supabase.from("universities").update({ cover_image_url: good }).eq("id", uni.id);
      if (e) console.log(`     ✗ ${e.message}`);
      else removed++;
    }
  }
  if (!args["dry-run"]) {
    await writeFile(REJECTED, JSON.stringify([...rejected], null, 1));
    await writeFile(AUDITED, JSON.stringify([...audited], null, 1));
  }
}
console.log(`\nГотово. ${args["dry-run"] ? "Було б прибрано" : "Прибрано"} фото у програм: ${removed}.`);
