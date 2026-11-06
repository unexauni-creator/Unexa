// Спільний формат даних для будь-якої AI-моделі (Gemini або Claude).
// Поля збігаються з колонками таблиці `specialties`, а значення degree / мова / формат —
// з фільтрами на сайті (src/pages/Home.jsx).
import { z } from "zod";

const DEGREES = ["Bachelor", "Master", "Foundation Year", "Short Course", "Summer School", "Online Course"];
const LANGUAGES = ["French", "English", "French/English", "German", "Spanish"];
const FORMATS = ["On Campus", "Hybrid", "Online"];

const Specialty = z.object({
  name: z.string().describe("Programme name in English, e.g. 'Master in Data Science'"),
  degree: z.enum(DEGREES),
  teaching_language: z.enum(LANGUAGES).nullable(),
  study_format: z.enum(FORMATS).nullable(),
  tuition_amount: z
    .number()
    .nullable()
    .describe("Yearly tuition in EUR for non-EU international students, number only"),
  academic_tuition_fee: z.string().nullable().describe("Tuition as written on the site, e.g. '3 941 € / year'"),
  academic_duration: z.string().nullable().describe("e.g. '2 years (4 semesters)'"),
  academic_study_mode: z.string().nullable().describe("Full-time / Part-time"),
  intake: z.string().nullable().describe("When studies start, e.g. 'September 2027'"),
  application_deadlines: z.string().nullable().describe("Application deadline(s), e.g. '15 March 2027'"),
  application_fee: z.string().nullable().describe("Fee to apply / sit the entrance exam, e.g. '50 €'"),
  class_size: z.string().nullable().describe("Students admitted per year or group size, e.g. '12 students per year'"),
  campus_facilities: z.string().nullable().describe("Workshops, studios, labs available to these students, short"),
  submission_period: z.string().nullable().describe("Application period"),
  min_language_level: z.string().nullable().describe("e.g. 'B2 French' or 'IELTS 6.5'"),
  min_cgpa: z.string().nullable(),
  doc_language: z.string().nullable().describe("Which language certificate must be submitted"),
  doc_diploma: z.string().nullable().describe("Which diploma must be submitted"),
  doc_visa: z.string().nullable().describe("Visa information, if stated"),
  doc_bank_statement: z.string().nullable().describe("Proof of funds requirements, if stated"),
  curriculum_summary: z.string().nullable().describe("2-4 sentences in English about the programme content"),
  scholarships_text: z
    .string()
    .nullable()
    .describe("Scholarships, comma separated, format 'Name (details), Name (details)'"),
  has_internship: z.boolean().nullable(),
  has_certification: z.boolean().nullable(),
  source_urls: z.array(z.string()).describe("URLs of the pages these facts come from"),
  confidence: z.number().describe("0 to 1: how firmly the page text supports these facts"),
});

export const Extraction = z.object({
  university_description: z
    .string()
    .nullable()
    .describe("2-3 sentences in English about the university for its card on the site"),
  specialties: z.array(Specialty),
});

export const SYSTEM_PROMPT = `You extract facts about university study programmes for Unexa, a platform that helps students choose where to study abroad.

You receive plain text of pages from one university's official website. Return only facts that the text states. When a field is not stated, use null — a missing value is much better than a guessed one, because students make real decisions with this data. Give each programme the URLs of the pages that support it, and set confidence lower when the text is vague or seems out of date.

Unexa is only for CREATIVE studies. Return only creative programmes: fine art, graphic and visual communication design, product/industrial design, interior and spatial design, fashion and textile, architecture and landscape, illustration and animation, film, photography, sound and media arts, music, dance, theatre and scenography, circus, curatorial and creative-industry programmes. Ignore every non-creative programme (sciences, law, business, engineering, history and so on). If the pages show no creative programme, return an empty list.

Map French diplomas to the platform's degree levels: Licence, DNA, DN MADE, Diplôme d'études en architecture → Bachelor; Master, DNSEP, DSAA, Diplôme d'État d'architecte → Master; preparatory class (classe préparatoire) → Foundation Year; summer programmes → Summer School; short or certificate courses → Short Course.

Keep every text field short (under 120 characters) — it is shown in a small box; put longer detail into curriculum_summary. Never write placeholder text such as "Not in source", "Not specified" or "N/A": use null.

Write all text fields in English. Return at most 15 programmes, preferring those open to international students, taught in English, or with clear admission information.`;

export function buildUserPrompt(uni, pages) {
  const corpus = pages.map((p) => `=== PAGE: ${p.url} ===\n${p.text}`).join("\n\n");
  // When updating a school that is already on Unexa, ask only about its known programmes.
  const known = uni.knownPrograms?.length
    ? `\n\nThis school already has these programmes on Unexa:\n${uni.knownPrograms.map((n) => `- ${n}`).join("\n")}\n` +
      "Return information ONLY for these programmes, using EXACTLY these names. Do not add other programmes. " +
      "If a programme is not described in the pages, still return it with the fields you can find (null for the rest)."
    : "";
  return `University: ${uni.name}${uni.city ? ` (${uni.city})` : ""}${known}\n\n${corpus}`;
}
