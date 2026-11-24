// Reading a school's official website, shared by the agents that fill programmes (complete.js, program.js):
// every link of the site (home, sections one level deep, sitemap.xml) and reading chosen pages and PDFs.
import { get, extractLinks, htmlToText } from "./crawl.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const USER_AGENT = "UnexaUniversityAgent/0.1 (+student study-abroad platform)";

// ---------- 1. усі посилання школи ----------
export const SKIP = /\/(news|press|events?|agenda|calendar|blog|tag|category|author|login|intranet|search|shop|jobs?|vacanc|career-staff|alumni-stories)(\/|$)|\.(jpe?g|png|gif|svg|webp|zip|mp4|mp3|docx?|xlsx?|pptx?)$/i;
export const HUB = /admission|apply|applicat|study|studies|programm|courses?|degrees?|international|fees|tuition|scholar|funding|financial|undergrad|postgrad|graduate|bachelor|master|studium|studien|bewerbung|studiare|ammission|iscrizion|offerta|corsi|didattica|estudios|admision|matricula|grados?|rekrutacja|studia|kandyd|oplat|formation|candidat|admission|вступ|абітурієнт|освітні|навчання|вартість|入学|입학/i;

export async function sitemapUrls(origin) {
  const found = new Set();
  const robots = await get(`${origin}/robots.txt`).catch(() => null);
  const maps = [...(robots?.body.matchAll(/^sitemap:\s*(\S+)/gim) ?? [])].map((m) => m[1]);
  if (!maps.length) maps.push(`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`);
  const queue = [...maps];
  let reads = 0;
  while (queue.length && reads < 10 && found.size < 5000) {
    const page = await get(queue.shift()).catch(() => null);
    reads++;
    if (!page) continue;
    const locs = [...page.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
    if (/<sitemapindex/i.test(page.body)) {
      // в індексі спершу беремо карти сторінок / програм, а не новин чи зображень
      locs.sort((a, b) => Number(/news|post|event|image|tag|author/i.test(a)) - Number(/news|post|event|image|tag|author/i.test(b)));
      queue.push(...locs.slice(0, 8));
    } else locs.forEach((l) => found.add(l));
  }
  return [...found];
}

export async function collectLinks(site) {
  const start = new URL(site);
  const root = start.hostname.split(".").slice(-2).join(".");
  const own = (u) => { try { return new URL(u).hostname.endsWith(root); } catch { return false; } };
  const links = new Map(); // url -> текст посилання
  const add = (url, text = "") => { if (own(url) && !SKIP.test(url) && !links.has(url.split("#")[0])) links.set(url.split("#")[0], text); };

  const home = await get(start.href).catch(() => null);
  if (!home) throw new Error("головна сторінка не відкривається (сайт блокує агента)");
  for (const [u, t] of extractLinks(home.body, home.url)) add(u, t);

  // один рівень углиб: розділи вступу / навчання / міжнародних студентів
  const hubs = [...links].filter(([u, t]) => HUB.test(`${u} ${t}`)).slice(0, 8);
  for (const [hub] of hubs) {
    await sleep(800);
    const page = await get(hub).catch(() => null);
    if (page) for (const [u, t] of extractLinks(page.body, page.url)) add(u, t);
  }
  for (const u of await sitemapUrls(start.origin)) add(u);
  return links;
}

// ---------- 3. читання сторінок і PDF ----------
export async function fetchPdf(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow", signal: AbortSignal.timeout(30000) }).catch(() => null);
  if (!res?.ok || !/pdf/i.test(res.headers.get("content-type") ?? "")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) return null;
  return { url, data: buf.toString("base64") };
}

export async function readPages(urls, log, { maxPdfs = 5, maxChars = 20000 } = {}) {
  const pages = [], pdfs = [];
  for (const url of urls) {
    await sleep(1200);
    if (/\.pdf($|\?)/i.test(url)) {
      if (pdfs.length >= maxPdfs) continue;
      const pdf = await fetchPdf(url);
      if (pdf) { pdfs.push(pdf); log(`   PDF: ${url}`); }
      continue;
    }
    const page = await get(url).catch(() => null);
    if (!page) continue;
    const text = htmlToText(page.body).slice(0, maxChars);
    if (text.length > 200) { pages.push({ url: page.url, text }); log(`   прочитано: ${page.url}`); }
  }
  return { pages, pdfs };
}

