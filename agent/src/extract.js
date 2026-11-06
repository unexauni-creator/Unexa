// Вибір AI-моделі: AI_PROVIDER=gemini (безкоштовно, за замовчуванням) або claude (платно).
const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

let impl;
try {
  impl =
    provider === "claude" ? await import("./extract-claude.js")
    : provider === "gemini" ? await import("./extract-gemini.js")
    : null;
  if (!impl) throw new Error(`Невідомий AI_PROVIDER="${provider}". Можна: gemini або claude`);
} catch (err) {
  // зрозуміле повідомлення замість довгого технічного тексту
  console.error(`✗ ${err.message}`);
  process.exit(1);
}

export const extractUniversityData = impl.extractUniversityData;
// поки що лише для Gemini; Claude-версія може бути додана так само
export const generateStructured = impl.generateStructured ?? (() => {
  throw new Error("Збір студентського життя зараз працює лише з AI_PROVIDER=gemini");
});
export const aiProvider = provider;
