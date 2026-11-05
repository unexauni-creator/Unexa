// npm run models — показує моделі Gemini, доступні для вашого ключа,
// і перевіряє, що ключ узагалі працює.
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.log("GEMINI_API_KEY не знайдено у agent/.env");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const pager = await ai.models.list();
const names = [];
for await (const m of pager) {
  if (m.supportedActions?.includes("generateContent") && /gemini/.test(m.name)) names.push(m.name.replace("models/", ""));
}
console.log("✓ Ключ працює. Моделі для тексту:");
for (const n of names) console.log(" •", n);
console.log(`\nАгент пробує: ${process.env.GEMINI_MODEL || "gemini-3.6-flash, gemini-3.5-flash, gemini-3-flash-preview, gemini-flash-lite-latest"}`);
