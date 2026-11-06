// Research Organization Registry (ROR) — відкритий міжнародний реєстр освітніх і наукових організацій
// (https://ror.org). Використовуємо для Іспанії, Італії, Німеччини, США та Англії: там немає
// простого відкритого державного списку закладів разом з їхніми сайтами.
const API = "https://api.ror.org/v2/organizations";

const COUNTRIES = {
  ES: { name: "Spain", queries: ["bellas artes", "diseño", "arte", "música", "conservatorio", "arquitectura", "design"] },
  IT: { name: "Italy", queries: ["accademia belle arti", "design", "conservatorio", "arte", "moda", "architettura"] },
  US: { name: "United States", queries: ["college of art and design", "school of design", "institute of art", "school of the arts", "Rhode Island School of Design", "School of the Art Institute of Chicago", "Pratt Institute", "California Institute of the Arts", "Maryland Institute College of Art", "Cooper Union", "ArtCenter College of Design", "Savannah College of Art and Design"] },
  // лише Англія, а не вся Велика Британія; на сайті країна записана як United Kingdom
  GB: { name: "United Kingdom", subdivision: "England", queries: ["university of the arts", "college of art", "school of art", "creative arts", "design school", "Royal College of Art", "Goldsmiths", "Ravensbourne", "National Film and Television School", "Rose Bruford"] },
  DE: { name: "Germany", queries: ["Kunsthochschule", "Hochschule für Gestaltung", "Hochschule für Musik", "Kunstakademie", "Universität der Künste", "Hochschule für bildende Künste", "Filmuniversität", "Bauhaus", "design"] },
};

// у назві має бути щось творче (запит ROR шукає й у назвах підрозділів, тому перевіряємо ще раз)
const CREATIVE = /arte|artes|arti|art\b|arts|goldsmiths|ravensbourne|pratt|cooper union|rhode island school of design|kunst|künste|design|diseño|disseny|gestaltung|musica|música|musik|conservatori|bauhaus|film|moda|fashion|architett|arquitect|theat|teatr|danza|tanz|accademia/i;
const NOT_CREATIVE = /medicin|scien|technolog|ingenier|engineering|wirtschaft|economi|business|law|recht|polytechn(?!ic.*design)/i;

async function rorSearch(query, countryCode) {
  const url = new URL(API);
  url.searchParams.set("query", query);
  url.searchParams.set("filter", `country.country_code:${countryCode},types:education,status:active`);
  const res = await fetch(url, { headers: { "User-Agent": "UnexaAgent/0.1" } });
  if (!res.ok) throw new Error(`ROR відповів ${res.status}`);
  return (await res.json()).items ?? [];
}

export async function fetchRorInstitutions(countryCode, { scope = "creative" } = {}) {
  const cfg = COUNTRIES[countryCode];
  if (!cfg) throw new Error(`ROR: країна ${countryCode} не налаштована`);
  const seen = new Map();
  for (const q of cfg.queries) {
    for (const o of await rorSearch(q, countryCode)) {
      if (seen.has(o.id)) continue;
      if (cfg.subdivision && o.locations?.[0]?.geonames_details?.country_subdivision_name !== cfg.subdivision) continue;
      const display = o.names.find((n) => n.types.includes("ror_display"))?.value ?? o.names[0]?.value;
      const local = o.names.find((n) => n.types.includes("label") && n.lang && n.lang !== "en")?.value ?? display;
      const names = o.names.map((n) => n.value).join(" ");
      if (scope === "creative" && (!CREATIVE.test(names) || NOT_CREATIVE.test(display))) continue;
      const site = o.links?.find((l) => l.type === "website")?.value;
      if (!site) continue;
      seen.set(o.id, {
        registry: "ror",
        registryId: o.id.replace("https://ror.org/", ""),
        name: display,
        nameLocal: local,
        city: o.locations?.[0]?.geonames_details?.name ?? null,
        country: cfg.name,
        websiteUrl: site,
        sector: null,
        rorId: o.id,
      });
    }
  }
  return [...seen.values()];
}
