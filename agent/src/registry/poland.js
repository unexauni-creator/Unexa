// Офіційний реєстр вищої освіти Польщі — POL-on / RAD-on (Міністерство науки і вищої освіти, відкриті дані).
// https://radon.nauka.gov.pl/dane/instytucje
const API = "https://radon.nauka.gov.pl/opendata/polon/institutions";

// Творчі заклади: ASP (академії мистецтв), музика, кіно/театр, дизайн, архітектура
const CREATIVE = /sztuk|artystyczn|muzyczn|filmow|teatraln|projektowani|design|architektur|szkoła filmowa|chopina|moniuszki|paderewskiego|szymanowskiego|karłowicza|nowowiejskiego|bacewiczów/i;

export async function fetchPolishInstitutions({ scope = "creative" } = {}) {
  const out = [];
  let token = null;
  for (let page = 0; page < 30; page++) {
    const url = new URL(API);
    url.searchParams.set("resultNumbers", "100");
    if (token) url.searchParams.set("token", token);
    const res = await fetch(url, { headers: { "User-Agent": "UnexaAgent/0.1" } });
    if (!res.ok) throw new Error(`Реєстр RAD-on відповів ${res.status}`);
    const data = await res.json();

    for (const r of data.results ?? []) {
      if (r.status !== "Działająca") continue; // лише чинні заклади (не в ліквідації)
      if (r.iKindName && !/uczelnia/i.test(r.iKindName)) continue; // лише заклади вищої освіти
      // Академії мистецтв і музики підпорядковані Міністерству культури
      const creative = (/kultury/i.test(r.supervisingInstitutionName ?? "") || CREATIVE.test(r.name ?? "")) &&
        !/wojenn|obrony|policj|medyczn/i.test(r.name ?? ""); // "Akademia Sztuki Wojennej" — військова, не мистецька
      if (scope === "creative" && !creative) continue;
      let site = (r.www ?? "").trim();
      if (!site) continue;
      if (!/^https?:\/\//i.test(site)) site = `https://${site}`;

      out.push({
        registry: "pl-polon",
        registryId: r.institutionUuid,
        name: r.name,
        nameLocal: r.name,
        city: r.city === "Warszawa" ? "Warsaw" : r.city ?? null,
        country: "Poland",
        websiteUrl: site,
        sector: r.iKindName ?? null,
      });
    }

    token = data.pagination?.token;
    if (!token || !(data.results ?? []).length) break;
  }
  return out;
}
