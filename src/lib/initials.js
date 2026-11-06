// "Kateryna Dmytrenko" → "KD", "Ana" → "A". Works for any alphabet (Анна Шевченко → "АШ").
export function getInitials(name) {
  const words = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "U";
  return words.slice(0, 2).map((w) => [...w][0]).join("").toUpperCase();
}
