// Знаходить головне фото школи на її офіційному сайті: картинку, яку сайт сам
// показує, коли посиланням діляться в соцмережах (og:image / twitter:image).
// Логотипи пропускаємо: на обкладинці картки вони виглядають погано.

const USER_AGENT = "UnexaUniversityAgent/0.1 (+student study-abroad platform)";
const LOGO_HINTS = /logo|favicon|icon|sprite|placeholder|default-share|blank|republique|marianne|ministere|minist%C3%A8re|partenaire|partner|label|badge|qualiopi|footer|avatar|flag|drapeau|noir|blanc|black-white|grandes-ecoles|sponsor|mecene|m%C3%A9c%C3%A8ne/i;

const META_PATTERNS = [
  /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi,
  /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image(?::secure_url)?["']/gi,
  /<meta[^>]+(?:property|name)=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/gi,
  /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']twitter:image(?::src)?["']/gi,
  /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/gi,
];

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return null;
  return { url: res.url, html: await res.text() };
}

// Запасний варіант: фото прямо на сторінці (<img>, srcset, data-src, background-image)
function pageImages(html) {
  const found = [];
  const push = (u) => u && !u.startsWith("data:") && found.push(u.trim());
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const srcset = tag.match(/\b(?:data-)?srcset=["']([^"']+)["']/i)?.[1];
    if (srcset) {
      // найбільший варіант зі srcset — останній у списку
      const parts = srcset.split(",").map((s) => s.trim().split(/\s+/)[0]);
      push(parts[parts.length - 1]);
    }
    push(tag.match(/\bdata-(?:src|lazy-src|original)=["']([^"']+)["']/i)?.[1]);
    push(tag.match(/\bsrc=["']([^"']+)["']/i)?.[1]);
  }
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) push(m[1]);
  return found.filter((u) => /\.(jpe?g|webp|png|avif)(\?|$)/i.test(u));
}

// Ширина й висота картинки з її заголовка (JPEG, PNG, WebP, GIF) — без завантаження всього файлу
function imageSize(b) {
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; // PNG
  if (b.length > 10 && b.toString("ascii", 0, 3) === "GIF") return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) };
    }
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    // JPEG: шукаємо маркер SOF (розміри кадру)
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

// Фото для обкладинки: справжня картинка, від 800 px завширшки, не надто вузька й не надто висока.
// Логотипи й значки зазвичай маленькі або дуже видовжені — їх це відсіює.
async function isUsableImage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Range: "bytes=0-131071" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/") || type.includes("svg")) return false;

    // читаємо лише початок файлу — там заголовок із розмірами
    const chunks = [];
    let size = 0;
    for await (const chunk of res.body) {
      chunks.push(chunk);
      size += chunk.length;
      if (size >= 131072) break;
    }
    const size2d = imageSize(Buffer.concat(chunks));
    if (!size2d) return false;
    const ratio = size2d.w / size2d.h;
    return size2d.w >= 800 && ratio >= 0.9 && ratio <= 2.6;
  } catch {
    return false;
  }
}

// Результат перевірки кожної картинки запам'ятовуємо, щоб не завантажувати двічі
const usableCache = new Map();
function checkImage(url) {
  if (!usableCache.has(url)) usableCache.set(url, isUsableImage(url));
  return usableCache.get(url);
}

const toAbs = (src, base) => {
  try {
    return new URL(src.replace(/&amp;/g, "&"), base).href;
  } catch {
    return null;
  }
};
// JPG / WebP — це майже завжди фото; PNG частіше логотип, тому вони в кінці черги
const photoFirst = (u) => (/\.(jpe?g|webp|avif)(\?|$)/i.test(u) ? 0 : 1);

/**
 * Усі кандидати на фото з однієї сторінки: спершу фото для соцмереж, потім фото зі сторінки.
 * Також повертає внутрішні посилання (для пошуку додаткових фото школи).
 */
async function pageCandidates(pageUrl) {
  const page = await fetchText(pageUrl).catch(() => null);
  if (!page) return { social: [], inPage: [], links: [] };

  const social = [];
  for (const pattern of META_PATTERNS) {
    for (const m of page.html.matchAll(pattern)) {
      const abs = toAbs(m[1], page.url);
      if (abs && !social.includes(abs)) social.push(abs);
    }
  }
  // підвал сторінки (<footer>) — це логотипи партнерів, а не фото школи
  const body = page.html.split(/<footer\b/i)[0];
  const inPage = [...new Set(pageImages(body).map((src) => toAbs(src, page.url)).filter(Boolean))]
    .filter((u) => !LOGO_HINTS.test(u))
    .sort((a, b) => photoFirst(a) - photoFirst(b));
  const links = [...body.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)]
    .map((m) => toAbs(m[1], page.url))
    .filter(Boolean);

  return { social: social.filter((u) => !LOGO_HINTS.test(u)), inPage, links };
}

/**
 * Перше придатне фото зі сторінки, якого ще немає в `used`.
 * @param {string} pageUrl
 * @param {Set<string>} [used] фото, які вже зайняті (школою чи іншими програмами)
 */
export async function findPageImage(pageUrl, used = new Set()) {
  const { social, inPage } = await pageCandidates(pageUrl);
  for (const url of [...social, ...inPage.slice(0, 12)]) {
    if (!used.has(url) && (await checkImage(url))) return url;
  }
  return null;
}

/**
 * @param {string} websiteUrl офіційний сайт школи
 * @returns {Promise<string|null>} посилання на фото або null
 */
export async function findCoverImage(websiteUrl) {
  // головна сторінка мовою сайту + корінь домену (часто там інше, краще фото)
  const pages = [websiteUrl];
  try {
    const origin = new URL(websiteUrl).origin + "/";
    if (origin !== websiteUrl) pages.push(origin);
  } catch {
    return null;
  }
  for (const pageUrl of pages) {
    const found = await findPageImage(pageUrl);
    if (found) return found;
  }
  return null;
}

const POOL_LINK_HINTS = /program|formation|cursus|department|d[ée]partement|atelier|studio|workshop|gallery|galerie|projet|project|works|travaux|diplom|school|ecole|campus/i;

/**
 * Набір РІЗНИХ фото школи: з головної та кількох внутрішніх сторінок (програми, майстерні, проєкти).
 * Потрібен, щоб картки різних програм однієї школи не мали однакового фото.
 * @param {string} websiteUrl
 * @param {number} want скільки фото потрібно
 */
export async function findImagePool(websiteUrl, want = 6) {
  const pool = [];
  const home = await pageCandidates(websiteUrl);
  let host;
  try {
    host = new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    return pool;
  }
  const extraPages = [...new Set(home.links)]
    .filter((u) => {
      try {
        return new URL(u).hostname.endsWith(host) && POOL_LINK_HINTS.test(u) && !/\.(pdf|jpe?g|png|zip)$/i.test(u);
      } catch {
        return false;
      }
    })
    .slice(0, 8);

  const add = async (urls) => {
    for (const url of urls) {
      if (pool.length >= want) return;
      if (!pool.includes(url) && (await checkImage(url))) pool.push(url);
    }
  };
  await add([...home.social, ...home.inPage.slice(0, 15)]);
  for (const pageUrl of extraPages) {
    if (pool.length >= want) break;
    const c = await pageCandidates(pageUrl);
    await add([...c.social, ...c.inPage.slice(0, 6)]);
  }
  return pool;
}

// ── Second source: Wikimedia Commons (free, openly licensed photos) ─────────────
// Used when a school's own site blocks the agent or has too few photos.
// Licences are CC BY / CC BY-SA / public domain: the author and licence are returned
// so they can be credited.
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const COMMONS_UA = "UnexaAgent/0.1 (https://github.com/unexauni-creator/Unexa)";
const COMMONS_SKIP = /logo|wappen|siegel|seal|emblem|gedenktafel|tafel|plaque|plakette|portrait|signature|map|karte|plan\b|relief|diagram|svg|pride|protest|demo\b|1[89]\d\d|\bwith\b|secretary|minister|president|council|press|expo|award|ceremony|conference|rencontre|museum|monument|hospital|medicine|hairstyle|poster|post-it|victim|mayor|funeral|\bat the\b|\bwith\b|students? at|meeting|visit|discussion|panel|lecture|talk\b|graduat|workshop|hackathon|spotkanie|treffen|incontro|tourist|panoramio|derhexer|square|\bplac\b|piazza|plaza|student|studentki|millennium|at night|old town|altstadt|edit-?a-?thon|\bblt\b|river|bridge|mississippi/i;
const STOP = new Set("university universitat universite universita universidad of the and de des der die la le les del di for in at school college arts art institute national superieure ecole hochschule academy accademia nuova belle".split(" "));

// words that describe a place, so a photo of a building/campus is likely (not a person or an event)
const PLACE_HINT = /college|campus|building|hall\b|library|bibliothe|biblioteca|center|centre|gebaude|haus\b|exhibition|ausstellung|studio|atelier|gallery|galerie|facade|facana|fachada|entrance|eingang|courtyard|auditorium|theater|theatre|konzertsaal/;
const fold = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const stripTags = (s) => (s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function commonsSearch(query, limit = 40) {
  const u = new URL(COMMONS_API);
  Object.entries({
    action: "query", format: "json", generator: "search", gsrnamespace: "6", gsrsearch: query,
    gsrlimit: String(limit), prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1600",
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const res = await fetch(u, { headers: { "User-Agent": COMMONS_UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) return [];
  const json = await res.json();
  return Object.values(json.query?.pages ?? {})
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((p) => ({ title: p.title, info: p.imageinfo?.[0] }))
    .filter((p) => p.info);
}

// A 1280px copy on upload.wikimedia.org (standard size, loads in every browser).
// ".../commons/d/dd/Name.jpg" → ".../commons/thumb/d/dd/Name.jpg/1280px-Name.jpg"
function commonsThumb(info, width) {
  const original = info.url.split("?")[0];
  if (info.width <= width) return original;
  const m = original.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/(\w\/\w\w)\/(.+)$/);
  return m ? `${m[1]}/thumb/${m[2]}/${m[3]}/${width}px-${m[3]}` : original;
}

// The school's own photo category on Commons, found through Wikidata (property P373).
async function commonsCategory(schoolName) {
  const name = schoolName.replace(/\(.*?\)/g, "").trim();
  const u = new URL("https://www.wikidata.org/w/api.php");
  Object.entries({ action: "wbsearchentities", format: "json", language: "en", type: "item", limit: "5", search: name })
    .forEach(([k, v]) => u.searchParams.set(k, v));
  const res = await fetch(u, { headers: { "User-Agent": COMMONS_UA }, signal: AbortSignal.timeout(20000) });
  const hits = (await res.json()).search ?? [];
  const school = hits.find((h) => /universit|school|college|academ|institut|conservato|hochschule|ecole|école|escola|design|art/i.test(h.description ?? ""));
  if (!school) return null;
  const e = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${school.id}.json`, { headers: { "User-Agent": COMMONS_UA } });
  const claims = (await e.json()).entities?.[school.id]?.claims ?? {};
  return claims.P373?.[0]?.mainsnak?.datavalue?.value ?? null;
}

async function commonsCategoryFiles(category, depth = 0) {
  const files = [];
  const visit = async (cat, level) => {
    const u = new URL(COMMONS_API);
    Object.entries({
      action: "query", format: "json", generator: "categorymembers", gcmtitle: `Category:${cat}`,
      gcmtype: level < depth ? "file|subcat" : "file", gcmlimit: "80",
      prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1600",
    }).forEach(([k, v]) => u.searchParams.set(k, v));
    const res = await fetch(u, { headers: { "User-Agent": COMMONS_UA }, signal: AbortSignal.timeout(20000) });
    const pages = Object.values((await res.json()).query?.pages ?? {});
    for (const p of pages) if (p.imageinfo?.[0]) files.push({ title: p.title, info: p.imageinfo[0] });
    if (level < depth) {
      // subcategories of buildings/colleges only — not people, events or artworks
      const PEOPLE = /people|alumni|faculty|staff|students|rector|president|professor|events?\b|exhibitions? by|works by|logos?|maps?|documents|videos|audio|awards?/i;
      for (const sub of pages.filter((p) => p.ns === 14 && !PEOPLE.test(p.title)).slice(0, 12)) {
        await visit(sub.title.replace(/^Category:/, ""), level + 1);
      }
    }
  };
  await visit(category, 0);
  return files;
}

// "Seoul National University, Former Main Building (20150926103855).jpg" → "seoul national university former main building"
const subjectOf = (title) => fold(title).replace(/^file:/, "").replace(/\.[a-z]+$/, "").replace(/\(.*?\)/g, " ").replace(/[^a-z]+/g, " ").replace(/\s+/g, " ").trim();

/**
 * Photos of a school from Wikimedia Commons, best first: the school's own Commons category
 * (via Wikidata), otherwise a search where the file name must clearly mention the school.
 * Only one photo per subject, so a school doesn't get 9 shots of the same building.
 * @returns {Promise<{url: string, credit: string, page: string}[]>}
 */
export async function findCommonsImages(schoolName, want = 10) {
  const mainName = schoolName.replace(/\(.*?\)/g, "").trim();
  const words = fold(mainName).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const strongMatch = (title) => {
    const t = fold(title);
    // the full name, or (for long names) all distinctive words but one
    return t.includes(fold(mainName)) || (words.length >= 3 && words.filter((w) => t.includes(w)).length >= words.length - 1);
  };

  let candidates = [];
  // the school itself, then its parent institution from the brackets ("Parsons … (The New School)")
  const parents = [...schoolName.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]).filter((p) => p.length > 8 && !p.includes("/"));
  for (const name of [schoolName, ...parents]) {
    const category = await commonsCategory(name).catch(() => null);
    if (category) candidates.push(...(await commonsCategoryFiles(category).catch(() => [])).map((c) => ({ ...c, trusted: true })));
    // also one level deeper (buildings, colleges, campuses of the school) — used after the main category
    if (category) {
      candidates.push(...(await commonsCategoryFiles(category, 1).catch(() => [])).map((c) => ({ ...c, trusted: true, deep: true })));
    }
  }
  if (candidates.length < want) candidates.push(...(await commonsSearch(mainName).catch(() => [])).map((c) => ({ ...c, trusted: false })));

  // photos whose file name clearly names the school go first
  // the parent school counts only by its full name ("new school"), so "New York" doesn't match "The New School"
  const nameWords = [...words, ...parents.map((p) => fold(p).replace(/^the /, "").trim())];
  const abbrs = [...schoolName.matchAll(/\(([^)]+)\)/g)].map((m) => fold(m[1])).filter((a) => a.length <= 6);
  const nameHit = (title) => {
    const t = fold(title);
    return nameWords.some((w) => t.includes(w)) || abbrs.some((a) => t.includes(a));
  };
  // main category before subcategories; within each, photos naming the school first
  const rank = (c) => (c.deep ? 2 : 0) + (nameHit(c.title) ? 0 : 1);
  candidates.sort((a, b) => rank(a) - rank(b));

  const seenTitles = new Set();
  const seenSubjects = new Set();
  const out = [];
  for (const { title, info, trusted, deep } of candidates) {
    if (out.length >= want) break;
    if (seenTitles.has(title)) continue;
    seenTitles.add(title);
    if (info.mime !== "image/jpeg" || COMMONS_SKIP.test(title)) continue;
    if (!trusted && !strongMatch(title)) continue;
    const ratio = info.width / info.height;
    if (info.width < 1200 || ratio < 1.2 || ratio > 2.4) continue; // landscape photos only, like the cards
    // old photos (postcards, archive shots) don't show the school as it is today
    const taken = Number(String(info.extmetadata?.DateTimeOriginal?.value ?? "").match(/(1[89]\d\d|20\d\d)/)?.[1]);
    if (taken && taken < 1985) continue;
    // a file that doesn't name the school needs at least a readable (Latin) title — skips camera codes
    // like "2019-515-OSEC-KJC-0043" and press photos titled in other scripts
    if (!nameHit(title) && !PLACE_HINT.test(fold(title))) continue;
    // subcategories also hold general city photos — from there only files that name the school
    if (deep && !nameHit(title)) continue;
    const subject = subjectOf(title);
    if (seenSubjects.has(subject)) continue;
    seenSubjects.add(subject);
    const meta = info.extmetadata ?? {};
    const author = stripTags(meta.Artist?.value) || "Unknown author";
    const licence = stripTags(meta.LicenseShortName?.value) || "see file page";
    out.push({ url: commonsThumb(info, 1280), credit: `${author}, ${licence}, via Wikimedia Commons`, page: info.descriptionurl });
  }
  return out;
}
