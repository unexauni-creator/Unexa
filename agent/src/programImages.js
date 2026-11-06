// Дає кожній програмі школи СВОЄ фото (specialties.image_url), щоб картки однієї школи
// не виглядали однаково. Порядок пошуку для кожної програми:
//   1) фото зі сторінки самої програми (посилання з source_note);
//   2) ще не використане фото з набору фото школи (головна + сторінки майстерень, проєктів…).
// Якщо різних фото не вистачило — програма лишається без власного фото і показує фото школи.
import { findImagePool, findPageImage, findCommonsImages } from "./photo.js";

const urlsIn = (text) => (text ?? "").match(/https?:\/\/[^\s,;]+/g) ?? [];

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{id: any, name: string, website_url: string, cover_image_url: string|null}} uni
 * @param {{dryRun?: boolean, log?: (s: string) => void}} [opts]
 * @returns {Promise<number>} скільки програм отримали фото
 */
export async function assignProgramImages(supabase, uni, { dryRun = false, log = console.log } = {}) {
  const { data: specs, error } = await supabase
    .from("specialties")
    .select("id, name, image_url, source_note")
    .eq("university_id", uni.id)
    .order("id");
  if (error) throw new Error(`specialties: ${error.message}`);

  const todo = specs.filter((s) => !s.image_url);
  if (!todo.length) return 0;

  // фото, які вже зайняті: обкладинка школи й фото інших програм
  const used = new Set([uni.cover_image_url, ...specs.map((s) => s.image_url)].filter(Boolean));
  let pool = null; // набір фото школи завантажуємо лише якщо знадобиться
  let commons = null; // запасне джерело: Wikimedia Commons (вільні ліцензії)

  let assigned = 0;
  for (const spec of todo) {
    let image = null;
    for (const pageUrl of urlsIn(spec.source_note).slice(0, 3)) {
      image = await findPageImage(pageUrl, used).catch(() => null);
      if (image) break;
    }
    if (!image && uni.website_url) {
      pool ??= await findImagePool(uni.website_url, todo.length + used.size + 2).catch(() => []);
      image = pool.find((u) => !used.has(u)) ?? null;
    }
    let credit = null;
    if (!image) {
      // ask for extra photos: some of them are already used by other programmes of this school
      commons ??= await findCommonsImages(uni.name, todo.length + used.size + 4).catch(() => []);
      const pick = commons.find((c) => !used.has(c.url));
      if (pick) { image = pick.url; credit = `Photo: ${pick.credit} — ${pick.page}`; }
    }
    if (!image) {
      log(`   – ${spec.name}: окремого фото не знайшлося (буде фото школи)`);
      continue;
    }
    used.add(image);
    log(`   ✓ ${spec.name}${credit ? " (Wikimedia Commons)" : ""}`);
    if (!dryRun) {
      // автора й ліцензію фото з Commons зберігаємо поруч із джерелами (їх треба вказувати на сайті)
      const update = { image_url: image };
      if (credit) update.source_note = [spec.source_note, credit].filter(Boolean).join("\n");
      const { error: e } = await supabase.from("specialties").update(update).eq("id", spec.id);
      if (e) throw new Error(`specialties.image_url: ${e.message}`);
    }
    assigned++;
  }
  return assigned;
}
