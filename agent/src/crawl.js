// Обережний обхід офіційного сайту: robots.txt, пауза між запитами,
// лише сторінки того самого домену і лише ті, що схожі на програми / вступ / вартість.

const USER_AGENT = "UnexaUniversityAgent/0.1 (+student study-abroad platform)";
const DELAY_MS = 1500; // пауза між запитами до одного сайту
const MAX_PAGES = 12; // скільки сторінок читаємо з одного університету
const MAX_CHARS_PER_PAGE = 15000;

// Слова в посиланнях, які ведуть на корисні сторінки (французькою та англійською)
const KEYWORDS = [
  "international", "admission", "apply", "candidature", "inscription",
  "formation", "programme", "program", "master", "licence", "bachelor", "degree",
  "tuition", "frais", "fees", "scholarship", "bourse", "english-taught", "taught-in-english",
  "study", "etudier", "étudier",
  // творчі напрями і французькі назви творчих дипломів
  "design", "art", "architecture", "mode", "fashion", "graphi", "illustration", "animation",
  "cinema", "cinéma", "film", "photo", "musique", "music", "danse", "dance", "theatre", "théâtre",
  "scenograph", "media", "dna", "dnsep", "dsaa", "diplome", "diplôme", "cursus", "concours", "postgraduate",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function get(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en,fr;q=0.8" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return null;
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("text/html") && !type.includes("xml") && !type.includes("text/plain")) return null;
  return { url: res.url, body: await res.text() };
}

// Дуже простий парсер robots.txt: правила Disallow для "User-agent: *"
async function loadRobots(origin) {
  const page = await get(`${origin}/robots.txt`).catch(() => null);
  if (!page) return [];
  const disallow = [];
  let applies = false;
  for (const raw of page.body.split("\n")) {
    const line = raw.split("#")[0].trim();
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (/^user-agent$/i.test(key)) applies = value === "*";
    else if (applies && /^disallow$/i.test(key) && value) disallow.push(value);
  }
  return disallow;
}

export function htmlToText(html) {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

export function extractLinks(html, baseUrl) {
  const links = new Map();
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = new URL(m[1].replace(/&amp;/gi, "&"), baseUrl); // "&amp;" in HTML links is just "&"
      if (!/^https?:$/.test(url.protocol)) continue;
      const text = htmlToText(m[2]).slice(0, 120);
      links.set(url.href, text);
    } catch {
      /* битий href — пропускаємо */
    }
  }
  return links;
}

// Сторінки для іноземців, які ПРИЇЖДЖАЮТЬ, — найцінніші
const BOOST = ["incoming", "international-student", "venir", "accueil", "welcome", "tuition", "frais", "master", "english"];
// Сторінки для власних студентів, які їдуть за кордон, новини тощо — нам не потрібні
const PENALTY = ["etudier-a-letranger", "depart", "outgoing", "remboursement", "actualite", "news", "agenda", "event", "login", "intranet"];

const PROGRAMS_FOCUS = { keywords: KEYWORDS, boost: BOOST, penalty: PENALTY };

// Профіль для сторінок студентського життя (кількома мовами)
export const STUDENT_LIFE_FOCUS = {
  keywords: [
    "student-life", "student life", "campus life", "students", "student", "club", "association", "society", "sport",
    "housing", "accommodation", "residence", "dorm", "wellbeing", "well-being", "support", "counsel", "health",
    "culture", "events", "community", "union", "international",
    "vie-etudiante", "vie étudiante", "logement", "bde", "associations",
    "vida-estudiantil", "vida estudiantil", "alojamiento", "residencia", "deportes",
    "vita studentesca", "servizi", "alloggi", "residenze",
    "studentisches leben", "studierende", "wohnen", "wohnheim", "hochschulsport", "asta",
    "życie studenckie", "studenci", "samorząd", "akademik", "akademiki", "koła naukowe",
    "студент", "гуртожит", "самоврядуван", "студентське життя",
  ],
  boost: ["student-life", "student life", "campus life", "vie-etudiante", "vida-estudiantil", "studentisches", "studenckie", "студентське", "housing", "wohnheim", "akademik", "гуртожит"],
  penalty: ["login", "intranet", "news/20", "press", "procurement", "przetarg", "tender", "career-staff", "jobs"],
};

// Профіль для сторінок викладачів (кількома мовами)
export const FACULTY_FOCUS = {
  keywords: [
    "faculty", "staff", "teachers", "teaching staff", "lecturers", "professors", "tutors", "people", "our team", "academic staff", "visiting",
    "enseignants", "équipe pédagogique", "professeurs", "intervenants",
    "profesores", "profesorado", "docentes", "claustro",
    "docenti", "corpo docente", "professori",
    "lehrende", "professorinnen", "professoren", "dozenten", "personen",
    "kadra", "wykładowcy", "pracownicy", "nauczyciele akademiccy",
    "викладач", "кафедр", "професор", "склад",
    "studio", "workshop", "werkstatt", "pracownia", "atelier", "laboratori", "майстерн",
  ],
  boost: ["faculty", "teaching staff", "lehrende", "docenti", "profesorado", "kadra", "wykładowcy", "викладач", "enseignants", "people"],
  penalty: ["login", "intranet", "news/20", "press", "procurement", "przetarg", "tender", "jobs", "vacanc", "career", "admin"],
};

// Профіль для сторінок житла (кількома мовами)
export const HOUSING_FOCUS = {
  keywords: [
    "housing", "accommodation", "residence", "residences", "halls", "dorm", "living", "rent", "international students",
    "logement", "résidence", "crous", "hébergement",
    "alojamiento", "residencia", "colegio mayor", "vivienda",
    "alloggi", "alloggio", "residenze", "housing office", "dsu",
    "wohnen", "wohnheim", "studierendenwerk", "unterkunft",
    "akademik", "akademiki", "dom studenta", "zakwaterowanie",
    "гуртожит", "поселен", "проживан",
  ],
  boost: ["housing", "accommodation", "residence", "logement", "alojamiento", "alloggi", "wohnheim", "akademik", "гуртожит", "crous", "studierendenwerk"],
  penalty: ["login", "intranet", "news/20", "press", "procurement", "przetarg", "tender", "jobs", "staff"],
};

function score(url, text, focus = PROGRAMS_FOCUS) {
  const hay = `${url} ${text}`.toLowerCase();
  let s = focus.keywords.reduce((acc, k) => acc + (hay.includes(k) ? 1 : 0), 0);
  if (s === 0) return 0;
  s += focus.boost.reduce((acc, k) => acc + (hay.includes(k) ? 2 : 0), 0);
  s -= focus.penalty.reduce((acc, k) => acc + (hay.includes(k) ? 4 : 0), 0);
  return s;
}

/**
 * Читає головну сторінку та найрелевантніші внутрішні сторінки.
 * @returns {Promise<Array<{url: string, text: string}>>}
 */
export async function crawlUniversity(websiteUrl, { maxPages = MAX_PAGES, log = () => {}, focus = PROGRAMS_FOCUS } = {}) {
  const start = new URL(websiteUrl);
  const origin = start.origin;
  // дозволяємо піддомени університету (напр. international.univ-x.fr)
  const rootDomain = start.hostname.split(".").slice(-2).join(".");
  const disallow = await loadRobots(origin);
  const allowed = (u) => {
    const url = new URL(u);
    if (!url.hostname.endsWith(rootDomain)) return false;
    if (url.hostname === start.hostname && disallow.some((d) => url.pathname.startsWith(d))) return false;
    if (/\.(pdf|jpg|jpeg|png|gif|zip|docx?|xlsx?|mp4)$/i.test(url.pathname)) return false;
    return true;
  };

  const pages = [];
  const seen = new Set();
  const queue = [{ url: start.href, score: 99 }];

  while (queue.length && pages.length < maxPages) {
    queue.sort((a, b) => b.score - a.score);
    const { url } = queue.shift();
    if (seen.has(url) || !allowed(url)) continue;
    seen.add(url);

    const page = await get(url).catch(() => null);
    await sleep(DELAY_MS);
    if (!page) continue;

    const text = htmlToText(page.body).slice(0, MAX_CHARS_PER_PAGE);
    if (text.length > 200) {
      pages.push({ url: page.url, text });
      log(`   прочитано: ${page.url}`);
    }

    for (const [link, linkText] of extractLinks(page.body, page.url)) {
      const s = score(link, linkText, focus);
      if (s > 0 && !seen.has(link)) queue.push({ url: link, score: s });
    }
  }
  return pages;
}
