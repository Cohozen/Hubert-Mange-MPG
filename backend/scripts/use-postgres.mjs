// Bascule le provider Prisma de sqlite → postgresql pour la prod (build Railway).
// En local on garde sqlite ; ce script ne s'exécute qu'au build de prod.
import { readFileSync, writeFileSync } from "node:fs";

const path = new URL("../prisma/schema.prisma", import.meta.url);
const before = readFileSync(path, "utf8");
const after = before.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
writeFileSync(path, after);
console.log(before === after ? "schema déjà en postgresql" : "schema basculé en postgresql ✓");
