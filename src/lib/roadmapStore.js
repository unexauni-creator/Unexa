// The intake a student chose (profiles.start_year) and the roadmap steps they ticked (profiles.roadmap_progress).
// Until agent/sql/006_roadmap_progress.sql has been run, ticks are kept in this browser instead.
import { supabase } from "./supabaseClient";

const localKey = (userId) => `unexa_roadmap_${userId}`;
const readLocal = (userId) => {
  try { return JSON.parse(localStorage.getItem(localKey(userId)) || "{}"); } catch { return {}; }
};

export async function loadRoadmap(userId) {
  const { data, error } = await supabase.from("profiles").select("start_year, roadmap_progress").eq("id", userId).maybeSingle();
  if (!error) return { startYear: data?.start_year ?? null, progress: data?.roadmap_progress ?? readLocal(userId), inAccount: true };
  // the progress column doesn't exist yet: still load the intake
  const { data: p } = await supabase.from("profiles").select("start_year").eq("id", userId).maybeSingle();
  return { startYear: p?.start_year ?? null, progress: readLocal(userId), inAccount: false };
}

export async function saveProgress(userId, progress, inAccount) {
  try { localStorage.setItem(localKey(userId), JSON.stringify(progress)); } catch {}
  if (!inAccount) return;
  const { error } = await supabase.from("profiles").update({ roadmap_progress: progress }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function saveStartYear(userId, startYear) {
  const { error } = await supabase.from("profiles").update({ start_year: startYear }).eq("id", userId);
  if (error) throw new Error(error.message);
}
