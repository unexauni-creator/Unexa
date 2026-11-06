// Реєстри за країнами. Кожен повертає заклади в спільному форматі агента:
// { registry, registryId, name, nameLocal, city, country, websiteUrl, sector }
import { fetchFrenchInstitutions } from "./france.js";
import { fetchUkrainianInstitutions } from "./ukraine.js";
import { fetchPolishInstitutions } from "./poland.js";
import { fetchRorInstitutions } from "./ror.js";

export const REGISTRIES = {
  fr: { label: "Франція (реєстр Міністерства вищої освіти)", fetch: fetchFrenchInstitutions },
  ua: { label: "Україна (ЄДЕБО, МОН)", fetch: fetchUkrainianInstitutions },
  pl: { label: "Польща (POL-on / RAD-on)", fetch: fetchPolishInstitutions },
  es: { label: "Іспанія (реєстр ROR)", fetch: (o) => fetchRorInstitutions("ES", o) },
  it: { label: "Італія (реєстр ROR)", fetch: (o) => fetchRorInstitutions("IT", o) },
  de: { label: "Німеччина (реєстр ROR)", fetch: (o) => fetchRorInstitutions("DE", o) },
  us: { label: "США (реєстр ROR)", fetch: (o) => fetchRorInstitutions("US", o) },
  gb: { label: "Англія (реєстр ROR)", fetch: (o) => fetchRorInstitutions("GB", o) },
};

export async function fetchInstitutions(country = "fr", opts = {}) {
  const reg = REGISTRIES[country.toLowerCase()];
  if (!reg) throw new Error(`Невідома країна "${country}". Можна: ${Object.keys(REGISTRIES).join(", ")}`);
  return reg.fetch(opts);
}
