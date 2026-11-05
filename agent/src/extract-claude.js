// Платний варіант: Claude API (AI_PROVIDER=claude). Потрібен ANTHROPIC_API_KEY.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { Extraction, SYSTEM_PROMPT, buildUserPrompt } from "./schema.js";

const client = new Anthropic();
const MODEL = process.env.AGENT_MODEL || "claude-opus-5-5";

export async function extractUniversityData(uni, pages) {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // якщо модель відмовить з міркувань безпеки — сервер повторить на іншій
    output_config: { effort: "medium", format: betaZodOutputFormat(Extraction) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(uni, pages) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Модель відмовилась обробляти сторінки (${response.stop_details?.category ?? "без категорії"})`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Відповідь обрізано через ліміт токенів — спробуйте менше сторінок");
  }
  if (!response.parsed_output) throw new Error("Не вдалося розібрати відповідь моделі");

  return {
    data: response.parsed_output,
    usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
    model: response.model,
  };
}
