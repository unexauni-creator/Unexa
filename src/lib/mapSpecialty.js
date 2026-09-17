// Перетворює рядок Supabase (specialties.*, universities(*)) на об'єкт,
// сумісний з тим, що очікують Home.jsx, Dashboard.jsx, UniversityDetail.jsx
export function mapSpecialty(row) {
  const uni = row.universities;

  return {
    id: row.id,                     // id спеціальності — саме це "картка" на Home
    universityId: uni?.id,
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
    image: uni?.cover_image_url,
    website: uni?.website_url,
    description: uni?.description,

    // Поля для сторінки деталей (Informations tab)
    duration: row.academic_duration,
    tuition: row.academic_tuition_fee,
    studyMode: row.academic_study_mode,
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