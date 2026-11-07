// Перетворює рядок Supabase (specialties.*, universities(*)) на об'єкт,
// сумісний з тим, що очікують Home.jsx, Dashboard.jsx, UniversityDetail.jsx

// Значення-заглушки на кшталт "Not in source" / "N/A" вважаємо порожніми,
// щоб на сайті однаково показувалось "Not specified".
const PLACEHOLDER = /^(not (in source|specified|stated|available|mentioned|provided)|n\/?a|unknown|none|null|-+)$/i;
const clean = (v) => (typeof v === "string" && PLACEHOLDER.test(v.trim()) ? null : v);

function photoCredit(note) {
  const m = String(note ?? "").match(/^Photo: (.+?) — (https?:\/\/\S+)$/m);
  return m ? { text: m[1], url: m[2] } : null;
}

export function mapSpecialty(rawRow) {
  const row = Object.fromEntries(Object.entries(rawRow).map(([k, v]) => [k, clean(v)]));
  const uni = row.universities;

  return {
    id: row.id,                     // id спеціальності — саме це "картка" на Home
    universityId: uni?.id,
    createdAt: row.created_at,      // для сповіщень «нова програма»
    universityCreatedAt: uni?.created_at,
    name: uni?.name,
    desc: `${uni?.city ?? ""}, ${uni?.country ?? ""}`,
    country: uni?.country,
    program: row.name,              // назва спеціальності, напр. "Graphic Design"
    degree: row.degree,
    tuitionType: "Public",          // поки статично — не було в джерелі даних
    tuitionAmount: row.tuition_amount ?? 0,
    language: row.teaching_language ?? row.academic_language,
    certification: !!row.has_certification,
    format: row.study_format,
    internship: !!row.has_internship,
    // власне фото програми (щоб картки однієї школи не були однаковими), інакше фото школи
    image: row.image_url || uni?.cover_image_url,
    universityImage: uni?.cover_image_url,
    // автор і ліцензія фото з Wikimedia Commons (рядок "Photo: … — https://…" у source_note)
    photoCredit: row.image_url ? photoCredit(row.source_note) : null,
    website: uni?.website_url,
    // студентське життя, яке зібрав агент з офіційного сайту (universities.student_life)
    studentLife: uni?.student_life ?? null,
    // викладачі й житло, які агент зібрав з офіційного сайту (universities.faculty / housing)
    faculty: uni?.faculty ?? null,
    housing: uni?.housing ?? null,
    studentLifeImage: uni?.student_life?.sections?.find((s) => s.image)?.image ?? null,
    description: uni?.description || row.description,

    // Поля для сторінки деталей (Informations tab)
    duration: row.academic_duration,
    tuition: row.academic_tuition_fee,
    studyMode: row.academic_study_mode,
    intake: row.intake,
    applicationDeadline: row.application_deadlines,
    applicationFee: row.application_fee,
    classSize: row.class_size,
    campusFacilities: row.campus_facilities,
    documents: {
      language: row.doc_language,
      diploma: row.doc_diploma,
      visa: row.doc_visa,
      bankStatement: row.doc_bank_statement,
    },

    // Program tab
    curriculumSummary: row.curriculum_summary,

    // Scholarship tab
    scholarshipsText: row.scholarships_text,

    // Candidate requirements (ще нема на UI — можна додати новою секцією пізніше)
    submissionPeriod: row.submission_period,
    minLanguageLevel: row.min_language_level,
    minCGPA: row.min_cgpa,
  };
}