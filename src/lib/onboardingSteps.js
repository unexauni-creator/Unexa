// The onboarding questions. Shared by Onboarding and by "Your answers" on Home, where they can be changed later.
export const STEPS = [
  {
    key: "fields", column: "study_fields", type: "multi",
    title: "What would you love to study?",
    sub: "Choose every field that interests you.",
    hint: "Pick everything that sparks joy. You can choose more than one!",
    options: [
      "Graphic Design", "Product / UX Design", "Fine Arts", "Architecture",
      "Fashion Design", "Film & Animation", "Illustration", "Photography",
      "Interior Design", "Game Design", "Industrial Design", "Art History",
    ],
  },
  {
    key: "countries", column: "countries", type: "multi",
    title: "Where in the world?",
    sub: "Pick the countries you'd consider.",
    hint: "Dreaming of Paris, Seoul or Toronto? Choose every place you'd move to.",
    options: [
      "France", "Germany", "Italy", "Spain", "Poland", "Ukraine",
      "United Kingdom", "Canada", "United States", "South Korea", "Japan", "China",
    ],
  },
  {
    key: "level", column: "study_level", type: "single",
    title: "Which level are you aiming for?",
    sub: "Choose one.",
    hint: "Tell me where you're starting from and I'll match the right programs.",
    options: ["Bachelor", "Master", "Foundation year", "Short course / Summer school", "Not sure yet"],
  },
  {
    key: "intake", column: "start_year", type: "single",
    title: "When do you want to start?",
    sub: "Choose your ideal intake.",
    hint: "Application deadlines depend on the intake, so this helps me plan ahead.",
    options: ["Fall 2027", "Spring 2028", "Fall 2028", "2029 or later", "Not sure yet"],
  },
  {
    key: "languages", column: "languages", type: "multi",
    title: "Which languages can you study in?",
    sub: "Choose all that work for you.",
    hint: "No worries if it's more than one. Many programs are taught in two languages.",
    options: ["English", "French", "German", "Spanish", "Italian", "Polish", "Ukrainian", "Korean", "Happy to learn a new one"],
  },
  {
    key: "formats", column: "formats", type: "multi",
    title: "How do you want to study?",
    sub: "Choose every format you're open to.",
    hint: "On campus, online, or a mix. Whatever fits your life!",
    options: ["On campus", "Hybrid", "Online"],
  },
  {
    key: "budget", column: "budget", type: "single",
    title: "What's your yearly tuition budget?",
    sub: "Choose one. Scholarships can change the picture, so don't worry about being exact.",
    hint: "Tuition varies a lot. Pick the range you're comfortable with. Scholarships can change the picture, so no need to be exact!",
    options: ["Under $5,000", "$5,000 – $15,000", "$15,000 – $30,000", "Flexible, if there's a scholarship"],
  },
  {
    key: "priorities", column: "priorities", type: "multi", max: 3,
    title: "What matters most to you?",
    sub: "Choose up to three.",
    hint: "Last one! Pick up to three things that would make a program perfect for you.",
    options: [
      "Scholarships & funding", "Internships & industry links", "Easy admission process",
      "Strong alumni network", "Student community & city life", "Small classes",
      "Career outcomes", "Portfolio-friendly admission",
    ],
  },
];
