// Безкоштовний варіант: Google Gemini API (AI_PROVIDER=gemini). Потрібен GEMINI_API_KEY
// з https://aistudio.google.com. На безкоштовному рівні моделі бувають перевантажені (503)
// або впираються в ліміт (429) — тоді агент сам пробує наступну модель зі списку і чекає.
import { GoogleGenAI, ApiError } from "@google/genai";
import { z } from "zod";
import { Extraction, SYSTEM_PROMPT, buildUserPrompt } from "./schema.js";

// Порядок спроб. Можна задати свій у .env: GEMINI_MODEL=модель1,модель2
const MODELS = (process.env.GEMINI_MODEL || "gemini-3.6-flash,gemini-3.5-flash,gemini-3-flash-preview,gemini-flash-lite-latest")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const ROUNDS = 3; // скільки разів пройти весь список, якщо всі моделі зайняті

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Вставте GEMINI_API_KEY у файл agent/.env (ключ з https://aistudio.google.com)");
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// JSON-схема для Gemini, побудована з zod-схеми
const toJsonSchema = (schema) => {
  const { $schema, ...rest } = z.toJSONSchema(schema);
  return rest;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shortError = (err) => String(err.message).match(/"message":"([^"]{0,90})/)?.[1] ?? err.message;

async function callModel(model, { system, user, schema }) {
  const response = await ai.models.generateContent({
    model,
    contents: user,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseJsonSchema: toJsonSchema(schema),
      temperature: 0.1,
      maxOutputTokens: 32768,
    },
  });

  // Зіпсована / обрізана відповідь — не фатально: позначаємо, щоб спробувати іншу модель
  const badAnswer = (msg) => Object.assign(new Error(msg), { tryNext: true });

  const text = response.text;
  const finish = response.candidates?.[0]?.finishReason;
  if (!text) throw badAnswer(`порожня відповідь (${finish ?? "?"})`);
  if (finish === "MAX_TOKENS") throw badAnswer("відповідь обрізано (забагато тексту)");

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw badAnswer("відповідь не є коректним JSON");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw badAnswer(`неправильний формат: ${parsed.error.issues[0]?.message}`);

  return {
    data: parsed.data,
    usage: {
      input: response.usageMetadata?.promptTokenCount ?? 0,
      output: response.usageMetadata?.candidatesTokenCount ?? 0,
    },
    model: response.modelVersion ?? model,
  };
}

export function extractUniversityData(uni, pages) {
  return generateStructured({ system: SYSTEM_PROMPT, user: buildUserPrompt(uni, pages), schema: Extraction });
}

// Будь-який структурований витяг (програми, студентське життя…) з тими самими повторами й запасними моделями
export async function generateStructured(request) {
  let lastError;
  for (let round = 1; round <= ROUNDS; round++) {
    for (const model of MODELS) {
      try {
        return await callModel(model, request);
      } catch (err) {
        lastError = err;
        // 503 перевантажено, 429 ліміт, 404 модель недоступна для ключа, 5xx збій — пробуємо іншу модель
        const apiRetry = err instanceof ApiError && (err.status === 404 || err.status === 429 || err.status >= 500);
        if (!apiRetry && !err.tryNext) throw err;
        console.log(`   ↷ ${model}: ${err.status ?? ""} ${shortError(err)}`);
      }
    }
    if (round < ROUNDS) {
      const wait = 30_000 * round;
      console.log(`   ⏳ усі моделі зайняті, чекаю ${wait / 1000} с…`);
      await sleep(wait);
    }
  }
  if (lastError instanceof ApiError && lastError.status === 429) {
    throw new Error("Вичерпано безкоштовний ліміт Gemini — запустіть агента пізніше або завтра");
  }
  throw new Error(`Жодна модель Gemini зараз не відповіла: ${shortError(lastError)}`);
}
