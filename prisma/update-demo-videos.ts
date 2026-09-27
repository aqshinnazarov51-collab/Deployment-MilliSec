import { PrismaClient } from "@prisma/client";
import { applyDemoCourseVideos } from "./demo-videos";

const db = new PrismaClient();

applyDemoCourseVideos(db)
  .then(() => console.log("Updated demo course lesson links. Accounts, orders, favorites, and progress were left untouched."))
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await db.$disconnect(); });
