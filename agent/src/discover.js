// Крок 1: показати, які офіційні заклади знайдено в реєстрі (без AI і без запису в базу).
// npm run discover                          → творчі школи Франції (за замовчуванням)
// npm run discover -- --scope universities  → університети
// npm run discover -- --scope all           → усі заклади реєстру
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { fetchFrenchInstitutions } from "./registry/france.js";

const { values: args } = parseArgs({ options: { scope: { type: "string", default: "creative" } } });

const list = await fetchFrenchInstitutions({ scope: args.scope });
await mkdir("out", { recursive: true });
await writeFile("out/france-registry.json", JSON.stringify(list, null, 2));

console.log(`Знайдено офіційних закладів (${args.scope}): ${list.length}`);
for (const u of list.slice(0, 30)) console.log(` • ${u.nameLocal} — ${u.city} — ${u.websiteUrl}`);
if (list.length > 30) console.log(` … і ще ${list.length - 30}. Повний список: agent/out/france-registry.json`);
