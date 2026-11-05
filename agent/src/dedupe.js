// Видаляє дублі програм: та сама школа + та сама назва (без регістру й пробілів).
// Лишає копію з найбільшою кількістю заповнених полів; збереження користувачів
// (saved_universities.specialty_id) переносить на копію, що лишається.
//   npm run dedupe -- --dry-run   показати, що буде видалено
//   npm run dedupe                видалити
import { getSupabase } from "./db.js";

const dryRun = process.argv.includes("--dry-run");
const supabase = getSupabase();

const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const filled = (row) => Object.values(row).filter((v) => v !== null && v !== "" && v !== false).length;

const { data: specs, error } = await supabase.from("specialties").select("*").order("id");
if (error) throw new Error(error.message);

const groups = new Map();
for (const s of specs) {
  const key = `${s.university_id}|${norm(s.name)}`;
  groups.set(key, [...(groups.get(key) ?? []), s]);
}

let removed = 0;
for (const rows of groups.values()) {
  if (rows.length < 2) continue;
  rows.sort((a, b) => filled(b) - filled(a) || String(a.id).localeCompare(String(b.id)));
  const [keep, ...drop] = rows;

  // поля, які є лише в дублі, переносимо в копію, що лишається
  const patch = {};
  for (const d of drop) {
    for (const [k, v] of Object.entries(d)) {
      if (k === "id" || k === "created_at") continue;
      if ((keep[k] === null || keep[k] === "") && v !== null && v !== "" && patch[k] === undefined) patch[k] = v;
    }
  }

  console.log(`✓ ${keep.name} — лишаю ${keep.id}, видаляю ${drop.map((d) => d.id).join(", ")}` +
    (Object.keys(patch).length ? ` (+ поля: ${Object.keys(patch).join(", ")})` : ""));
  if (dryRun) { removed += drop.length; continue; }

  if (Object.keys(patch).length) {
    const { error: e } = await supabase.from("specialties").update(patch).eq("id", keep.id);
    if (e) throw new Error(`update ${keep.id}: ${e.message}`);
  }

  for (const d of drop) {
    const { data: saves, error: se } = await supabase
      .from("saved_universities").select("user_id").eq("specialty_id", String(d.id));
    if (se) throw new Error(`saved_universities: ${se.message}`);
    for (const { user_id } of saves) {
      await supabase.from("saved_universities")
        .upsert({ user_id, specialty_id: String(keep.id) }, { onConflict: "user_id,specialty_id", ignoreDuplicates: true });
    }
    await supabase.from("saved_universities").delete().eq("specialty_id", String(d.id));

    const { error: de } = await supabase.from("specialties").delete().eq("id", d.id);
    if (de) throw new Error(`delete ${d.id}: ${de.message}`);
    removed++;
  }
}

console.log(`\n${dryRun ? "Буде видалено" : "Видалено"} дублів: ${removed}.`);
