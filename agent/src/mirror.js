// Одноразово переносить уже призначені фото з Wikimedia Commons у сховище Supabase.
//   npm run mirror
import { getSupabase } from "./db.js";
import { mirrorImage, isCommonsUrl } from "./storage.js";

const supabase = getSupabase();
const { data, error } = await supabase.from("specialties").select("id, name, image_url").like("image_url", "%upload.wikimedia.org%");
if (error) throw new Error(error.message);
console.log(`Фото з Commons для перенесення: ${data.length}`);
let done = 0;
for (const s of data) {
  if (!isCommonsUrl(s.image_url)) continue;
  try {
    const url = await mirrorImage(supabase, s.image_url, `commons-${s.id}`);
    const { error: e } = await supabase.from("specialties").update({ image_url: url }).eq("id", s.id);
    if (e) throw new Error(e.message);
    done++;
    console.log(`✓ ${s.name}`);
  } catch (e) {
    console.log(`✗ ${s.name}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 1500)); // ввічливо до Wikimedia
}
console.log(`Перенесено: ${done} з ${data.length}`);
