// Копіює фото з Wikimedia Commons у сховище Supabase (bucket "program-images"),
// щоб сайт не залежав від лімітів Wikimedia (вони відповідають 429, коли запитів багато).
// Автор і ліцензія фото лишаються в source_note і показуються на сайті.
const BUCKET = "program-images";
const UA = "UnexaAgent/0.1 (https://github.com/unexauni-creator/Unexa)";
let bucketReady = false;

async function ensureBucket(supabase) {
  if (bucketReady) return;
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: "5MB" });
    if (error && !/already exists/i.test(error.message)) throw new Error(`storage: ${error.message}`);
  }
  bucketReady = true;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Завантажує фото, чекаючи й повторюючи, якщо Wikimedia просить зачекати (429)
async function download(url) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
    if (res.ok) return { bytes: Buffer.from(await res.arrayBuffer()), type: res.headers.get("content-type") || "image/jpeg" };
    if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status}`);
    await sleep(Math.min(60000, 5000 * attempt));
  }
  throw new Error("Wikimedia не віддала фото після кількох спроб");
}

/**
 * @returns {Promise<string>} публічне посилання на копію у Supabase Storage
 */
export async function mirrorImage(supabase, url, key) {
  await ensureBucket(supabase);
  const { bytes, type } = await download(url);
  const path = `${key}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: type, upsert: true });
  if (error) throw new Error(`storage upload: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export const isCommonsUrl = (url) => /upload\.wikimedia\.org/.test(url ?? "");
