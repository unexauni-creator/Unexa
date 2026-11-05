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

/**
 * @param {string} websiteUrl офіційний сайт школи
 * @returns {Promise<string|null>} посилання на фото або null
 */
export async function findCoverImage(websiteUrl) {
  const candidates = []; // фото для соцмереж — найкращий варіант
  const inPage = []; // фото зі сторінки — запасний варіант
  // головна сторінка мовою сайту + корінь домену (часто там інше, краще фото)
  const pages = [websiteUrl];
  try {
    const origin = new URL(websiteUrl).origin + "/";
    if (origin !== websiteUrl) pages.push(origin);
  } catch {
    return null;
  }

  for (const pageUrl of pages) {
    const page = await fetchText(pageUrl).catch(() => null);
    if (!page) continue;
    for (const pattern of META_PATTERNS) {
      for (const m of page.html.matchAll(pattern)) {
        try {
          const abs = new URL(m[1].replace(/&amp;/g, "&"), page.url).href;
          if (!candidates.includes(abs)) candidates.push(abs);
        } catch {
          /* битий URL */
        }
      }
    }
    // підвал сторінки (<footer>) — це логотипи партнерів, а не фото школи
    const body = page.html.split(/<footer\b/i)[0];
    for (const src of pageImages(body)) {
      try {
        const abs = new URL(src.replace(/&amp;/g, "&"), page.url).href;
        if (!inPage.includes(abs)) inPage.push(abs);
      } catch {
        /* битий URL */
      }
    }
  }

  for (const url of candidates.filter((u) => !LOGO_HINTS.test(u))) {
    if (await isUsableImage(url)) return url;
  }
  // З фото на сторінці перевіряємо лише перші кілька — це зазвичай банер угорі
  // JPG / WebP — це майже завжди фото; PNG частіше логотип, тому вони в кінці черги
  const photoFirst = (u) => (/\.(jpe?g|webp|avif)(\?|$)/i.test(u) ? 0 : 1);
  const ordered = inPage.filter((u) => !LOGO_HINTS.test(u)).sort((a, b) => photoFirst(a) - photoFirst(b));
  for (const url of ordered.slice(0, 12)) {
    if (await isUsableImage(url)) return url;
  }
  return null;
}
