// Крок 1: показати, які офіційні заклади знайдено в реєстрі (без AI і без запису в базу).
// npm run discover                          → творчі школи Франції (за замовчуванням)
// npm run discover -- --country it          → Італія (fr | ua | pl | es | it | de)
// npm run discover -- --scope all           → усі заклади реєстру
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { fetchInstitutions, REGISTRIES } from "./registry/index.js";

const { values: args } = parseArgs({
  options: { scope: { type: "string", default: "creative" }, country: { type: "string", default: "fr" } },
});

const country = args.country.toLowerCase();
const list = await fetchInstitutions(country, { scope: args.scope });
await mkdir("out", { recursive: true });
await writeFile(`out/${country}-registry.json`, JSON.stringify(list, null, 2));

console.log(`${REGISTRIES[country].label}: знайдено закладів (${args.scope}): ${list.length}`);
for (const u of list.slice(0, 60)) console.log(` • ${u.nameLocal} — ${u.city} — ${u.websiteUrl}`);
if (list.length > 60) console.log(` … і ще ${list.length - 60}. Повний список: agent/out/${country}-registry.json`);
