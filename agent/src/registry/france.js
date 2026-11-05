// Офіційний реєстр закладів вищої освіти Франції
// (Міністерство вищої освіти та досліджень, відкриті дані).
// Сюди потрапляють лише заклади, визнані державою, тому це наше джерело «офіційності».
const API =
  "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/" +
  "fr-esr-principaux-etablissements-enseignement-superieur/records";

const PAGE_SIZE = 100; // максимум, який дозволяє API

// Творчі заклади: мистецтво, дизайн, архітектура, мода, музика, театр, кіно, цирк, медіа
const CREATIVE =
  /\b(arts?|artistiques?|beaux-arts|design|architecture|mode|musique|danse|th[ée][âa]tre|cin[ée]ma|image|audiovisuel|photographie|cirque|cr[ée]ation|m[ée]dias|son)\b/i;
// Схожі назви, але це інженерні / дослідницькі заклади, а не творчі
const NOT_CREATIVE = /arts et m[ée]tiers|histoire de l'art/i;

export const isCreativeSchool = (name) => CREATIVE.test(name) && !NOT_CREATIVE.test(name);

/**
 * @param {object} opts
 * @param {"creative"|"universities"|"all"} [opts.scope]
 *   creative     — лише творчі школи (мистецтво, дизайн, архітектура, мода, музика…)
 *   universities — університети (агент шукатиме в них лише творчі програми)
 *   all          — усі заклади реєстру
 * @returns {Promise<Array<object>>} список закладів у спільному форматі агента
 */
export async function fetchFrenchInstitutions({ scope = "creative" } = {}) {
  const results = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const url = new URL(API);
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("order_by", "uo_lib");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Реєстр Франції відповів ${res.status}`);
    const data = await res.json();

    for (const r of data.results) {
      const rTypes = r.type_d_etablissement ?? [];
      const names = `${r.uo_lib} ${r.uo_lib_officiel ?? ""}`;
      if (scope === "creative" && !isCreativeSchool(names)) continue;
      if (scope === "universities" && !rTypes.includes("Université")) continue;
      if (!r.url) continue; // без офіційного сайту нема що читати

      results.push({
        registry: "fr-esr",
        registryId: r.etablissement_id_paysage,
        name: r.uo_lib_en || r.uo_lib_officiel || r.uo_lib,
        nameLocal: r.uo_lib_officiel || r.uo_lib,
        city: r.com_nom?.replace(/\s+\d+(er|e)$/, "") ?? null, // "Paris 6e" → "Paris"
        country: "France", // саме так країна записана у фільтрах сайту
        websiteUrl: r.url_en || r.url,
        sector: r.secteur_d_etablissement ?? null, // public / privé
        rorId: r.identifiant_ror?.[0] ?? null,
      });
    }

    if (offset + PAGE_SIZE >= data.total_count) break;
  }
  return results;
}
