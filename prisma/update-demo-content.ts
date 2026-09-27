import { PrismaClient } from "@prisma/client";
import { addDemoReviews, applyDemoCourseDurations } from "./demo-videos";
import { applyExtraDemoCourses } from "./extra-courses";

const db = new PrismaClient();

async function main() {
  await applyExtraDemoCourses(db);
  await applyDemoCourseDurations(db);
  await addDemoReviews(db);
  console.log("Updated demo course durations and added sample reviews. Existing accounts, orders, and lesson progress were preserved.");
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await db.$disconnect(); });
