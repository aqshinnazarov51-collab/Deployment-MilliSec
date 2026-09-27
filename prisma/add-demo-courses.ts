import { PrismaClient } from "@prisma/client";
import { applyExtraDemoCourses } from "./extra-courses";
import { addDemoReviews } from "./demo-videos";

const db = new PrismaClient();

async function main() {
  await applyExtraDemoCourses(db);
  await addDemoReviews(db);
  console.log("Added ten demo courses and sample reviews. Existing learner data was preserved.");
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await db.$disconnect(); });
