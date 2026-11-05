import { createClient } from "@supabase/supabase-js";

// Агент працює з service_role ключем (обходить RLS), тому він живе тільки в agent/.env
// і ніколи не має потрапити у фронтенд або в git.
export function getSupabase({ required = true } = {}) {
  const rawUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !key) {
    if (!required) return null;
    throw new Error("Заповніть SUPABASE_URL і SUPABASE_SERVICE_ROLE_KEY у файлі agent/.env");
  }
  // Приймаємо і "https://xxx.supabase.co", і "https://xxx.supabase.co/rest/v1/"
  const url = new URL(rawUrl).origin;

  const isAnonJwt = key.startsWith("eyJ") && /"role":"anon"/.test(Buffer.from(key.split(".")[1] ?? "", "base64url").toString());
  if (key.startsWith("sb_publishable_") || isAnonJwt) {
    throw new Error(
      "У SUPABASE_SERVICE_ROLE_KEY вставлено публічний ключ (publishable / anon). " +
        "Потрібен секретний: Supabase → Project Settings → API Keys → Secret key (sb_secret_...) або service_role.",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Назва колонки у specialties, яка посилається на universities.id
export const SPECIALTY_FK = process.env.UNEXA_SPECIALTY_FK || "university_id";

export async function saveDraft(supabase, uni, result, pages) {
  const { data: draft, error } = await supabase
    .from("agent_university_drafts")
    .upsert(
      {
        registry: uni.registry,
        registry_id: uni.registryId,
        name: uni.name,
        name_local: uni.nameLocal,
        city: uni.city,
        country: uni.country,
        website_url: uni.websiteUrl,
        ror_id: uni.rorId,
        description: result.data.university_description,
        pages_read: pages.map((p) => p.url),
        model: result.model,
        status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "registry,registry_id" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`Supabase (чернетка університету): ${error.message}`);

  // Повторний запуск замінює старі неперевірені чернетки програм
  await supabase.from("agent_specialty_drafts").delete().eq("university_draft_id", draft.id).eq("status", "pending");

  const rows = result.data.specialties.map(({ source_urls, confidence, ...payload }) => ({
    university_draft_id: draft.id,
    payload,
    source_urls,
    confidence,
  }));
  if (rows.length) {
    const { error: e2 } = await supabase.from("agent_specialty_drafts").insert(rows);
    if (e2) throw new Error(`Supabase (чернетки програм): ${e2.message}`);
  }
  return draft.id;
}
