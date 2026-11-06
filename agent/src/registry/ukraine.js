// Офіційний реєстр закладів освіти України — ЄДЕБО (Міністерство освіти і науки, відкриті дані).
// https://registry.edbo.gov.ua/opendata/universities/
const API = "https://registry.edbo.gov.ua/api/opendata/universities/?ut=1&exp=json";

// Творчі заклади: мистецтво, дизайн, архітектура, музика, театр, кіно, хореографія
const CREATIVE = /мистецтв|дизайн|архітектур|музичн|консерваторі|художн|театр|кіно|хореограф|образотворч|естрадн|циркового|культури і мистецтв/i;

// Офіційна транслітерація (постанова КМУ № 55, 2010): "Київ" → "Kyiv", "Харків" → "Kharkiv"
const KNOWN = { "Київ": "Kyiv", "Харків": "Kharkiv", "Львів": "Lviv", "Одеса": "Odesa", "Дніпро": "Dnipro", "Запоріжжя": "Zaporizhzhia" };
const MAP = { а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ie",ж:"zh",з:"z",и:"y",і:"i",ї:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"iu",я:"ia","'":"","’":"" };
const START = { є:"ye", ї:"yi", й:"y", ю:"yu", я:"ya" };
function translit(word) {
  if (KNOWN[word]) return KNOWN[word];
  const out = [...word.toLowerCase()].map((c, i) => (i === 0 && START[c]) || (MAP[c] ?? c)).join("");
  return out.charAt(0).toUpperCase() + out.slice(1);
}

const field = (r, name) => (r[name] ?? "").toString().trim();

export async function fetchUkrainianInstitutions({ scope = "creative" } = {}) {
  const res = await fetch(API, { redirect: "follow", headers: { "User-Agent": "UnexaAgent/0.1" } });
  if (!res.ok) throw new Error(`Реєстр ЄДЕБО відповів ${res.status}`);
  const rows = await res.json();

  const out = [];
  for (const r of rows) {
    const id = field(r, "Код");
    const parent = field(r, "Код головного закладу");
    if (parent && parent !== id) continue; // філії пропускаємо — беремо головний заклад
    if (field(r, "Дата блокування суб'єкта освітньої діяльності в ЄДЕБО")) continue; // закритий / заблокований
    const nameUa = field(r, "Назва закладу освіти");
    const body = field(r, "Найменування органу управління");
    // Мінкульт керує мистецькими закладами; решту відбираємо за назвою
    const creative = /культури/i.test(body) || CREATIVE.test(nameUa);
    if (scope === "creative" && !creative) continue;
    let site = field(r, "Веб-сайт");
    if (!site) continue;
    // зіпсовані адреси в реєстрі: "http:www.…", "https://http:www.…"
    site = site.replace(/^(https?:\/\/)?https?:\/*/i, "https://");
    if (!/^https?:\/\//i.test(site)) site = `https://${site}`;

    out.push({
      registry: "ua-edebo",
      registryId: id,
      name: field(r, "Назва закладу освіти (англ.)") || nameUa,
      nameLocal: nameUa,
      city: translit(field(r, "Населений пункт (місцезнаходження)").replace(/^(м\.|місто)\s*/i, "")) || null,
      country: "Ukraine",
      websiteUrl: site,
      sector: field(r, "Форма власності") || null,
    });
  }
  return out;
}
