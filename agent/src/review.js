// Модерація: людина перевіряє чернетки агента, і лише схвалене потрапляє на сайт.
//
// npm run review                         список чернеток, що чекають перевірки
// npm run review -- show <id>            деталі (id можна скорочено, перші 8 символів)
// npm run review -- approve <id>         записати в universities + specialties
// npm run review -- approve <id> --min-confidence 0.7
// npm run review -- reject <id>
import { parseArgs } from "node:util";
import { getSupabase, SPECIALTY_FK } from "./db.js";
import { findCoverImage } from "./photo.js";

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: { "min-confidence": { type: "string", default: "0.6" } },
});
const [command = "list", idArg] = positionals;
const supabase = getSupabase();

async function findDraft(prefix) {
  const { data, error } = await supabase
    .from("agent_university_drafts")
    .select("*, agent_specialty_drafts(*)")
    .order("created_at");
  if (error) throw new Error(error.message);
  const matches = data.filter((d) => d.id.startsWith(prefix ?? "§"));
  if (matches.length !== 1) throw new Error(`Чернетку "${prefix}" не знайдено або id неоднозначний`);
  return matches[0];
}

// Шукаємо, чи цей заклад уже є у вашій таблиці universities (щоб не створити дубль):
// за доменом сайту або за назвою (англійською чи французькою), без урахування регістру й наголосів.
const normalize = (s) =>
  (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

async function findExistingUniversity(draft) {
  const { data, error } = await supabase.from("universities").select("id, name, website_url, country");
  if (error) throw new Error(error.message);
  const draftHost = host(draft.website_url);
  const names = [draft.name, draft.name_local].map(normalize).filter(Boolean);
  return (
    data.find((u) => draftHost && host(u.website_url) === draftHost) ??
    data.find((u) => names.some((n) => normalize(u.name).includes(n) || n.includes(normalize(u.name))))
  );
}

if (command === "list") {
  const { data, error } = await supabase
    .from("agent_university_drafts")
    .select("id, name, city, status, agent_specialty_drafts(count)")
    .eq("status", "pending")
    .order("created_at");
  if (error) throw new Error(error.message);
  if (!data.length) console.log("Немає чернеток, що чекають перевірки.");
  for (const d of data) {
    console.log(`${d.id.slice(0, 8)}  ${d.name} (${d.city}) — програм: ${d.agent_specialty_drafts[0]?.count ?? 0}`);
  }
} else if (command === "show") {
  const d = await findDraft(idArg);
  console.log(`${d.name} — ${d.city}, ${d.country}\n${d.website_url}\n\n${d.description ?? "(без опису)"}\n`);
  const match = await findExistingUniversity(d);
  if (match) console.log(`ℹ️  Уже є в базі як "${match.name}" — при схваленні додадуться лише програми.\n`);
  for (const s of d.agent_specialty_drafts) {
    const p = s.payload;
    console.log(`• [${s.confidence}] ${p.name} — ${p.degree}, ${p.teaching_language ?? "?"}, ${p.academic_tuition_fee ?? "вартість ?"}`);
    console.log(`  джерела: ${s.source_urls.join(", ")}`);
  }
} else if (command === "approve") {
  const d = await findDraft(idArg);
  const minConfidence = Number(opts["min-confidence"]);

  // 1) Університет: якщо такий уже є у вашій базі — використовуємо його, нічого не перезаписуючи
  let universityId = d.university_id;
  if (!universityId) {
    const match = await findExistingUniversity(d);
    if (match) {
      universityId = match.id;
      console.log(`Університет уже є в базі: "${match.name}" (id ${universityId}) — додаю лише програми.`);
    } else {
      const cover = await findCoverImage(d.website_url);
      const { data: created, error } = await supabase
        .from("universities")
        .insert({
          name: d.name,
          city: d.city,
          country: d.country,
          description: d.description,
          website_url: d.website_url,
          cover_image_url: cover,
        })
        .select("id")
        .single();
      if (error) throw new Error(`universities: ${error.message}`);
      universityId = created.id;
      console.log(`Створено університет (id ${universityId})${cover ? " з фото з офіційного сайту" : ", фото не знайдено"}.`);
    }
  }

  // 2) Програми з достатньою впевненістю
  let added = 0;
  for (const s of d.agent_specialty_drafts.filter((x) => x.status === "pending")) {
    if ((s.confidence ?? 0) < minConfidence) {
      console.log(`  пропущено (впевненість ${s.confidence}): ${s.payload.name}`);
      continue;
    }
    const { data: row, error } = await supabase
      .from("specialties")
      .insert({
        ...s.payload,
        [SPECIALTY_FK]: universityId,
        source_note: `Unexa agent: ${s.source_urls.join(", ")}`, // звідки взято дані
      })
      .select("id")
      .single();
    if (error) throw new Error(`specialties (${s.payload.name}): ${error.message}`);
    await supabase.from("agent_specialty_drafts").update({ status: "approved", specialty_id: String(row.id) }).eq("id", s.id);
    added++;
  }

  await supabase
    .from("agent_university_drafts")
    .update({ status: "approved", university_id: String(universityId), updated_at: new Date().toISOString() })
    .eq("id", d.id);
  console.log(`✓ ${d.name}: додано програм на сайт — ${added}.`);
} else if (command === "reject") {
  const d = await findDraft(idArg);
  await supabase.from("agent_university_drafts").update({ status: "rejected" }).eq("id", d.id);
  console.log(`Відхилено: ${d.name}`);
} else {
  console.log("Команди: list | show <id> | approve <id> | reject <id>");
}
