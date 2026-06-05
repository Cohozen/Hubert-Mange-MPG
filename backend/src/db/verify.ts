// Vérif end-to-end des endpoints de lecture : forge une session admin et appelle l'API.
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { prisma } from "./client.js";

const BASE = `http://localhost:${config.port}`;

async function main() {
  const admin = await prisma.manager.findFirst({ where: { roles: { contains: "SUPERADMIN" } } });
  if (!admin) throw new Error("Aucun superadmin en base (lance le seed).");
  const token = jwt.sign({ managerId: admin.id }, config.sessionSecret);
  const cookie = `mpg_session=${token}`;

  const get = async (path: string) => {
    const res = await fetch(`${BASE}${path}`, { headers: { Cookie: cookie } });
    return { status: res.status, body: (await res.json()) as any };
  };

  console.log("GET /auth/me", await get("/auth/me"));
  const pools = await get("/api/cagnotte");
  console.log("GET /api/cagnotte", pools);
  const poolId = pools.body[0]?.id;
  if (poolId) console.log("GET /api/cagnotte/:id", await get(`/api/cagnotte/${poolId}`));
  console.log("GET /api/palmares/winners", await get("/api/palmares/winners"));
  console.log("GET /api/palmares/all-time", await get("/api/palmares/all-time"));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
