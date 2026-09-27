import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { catalogContent } from "../lib/catalog-content";

const db = new PrismaClient();

export async function refreshCatalog(db: PrismaClient) {
  const categoryIds = new Map<string, string>();
  for (const course of catalogContent) {
    if (categoryIds.has(course.categorySlug)) continue;
    const category = await db.category.upsert({
      where: { slug: course.categorySlug },
      update: { name: course.category },
      create: { name: course.category, slug: course.categorySlug },
      select: { id: true },
    });
    categoryIds.set(course.categorySlug, category.id);
  }

  let updated = 0;
  for (const course of catalogContent) {
    const existing = await db.course.findUnique({
      where: { slug: course.slug },
      include: { sections: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } } },
    });
    if (!existing) {
      console.warn(`Skipped missing course: ${course.slug}`);
      continue;
    }

    const email = `${course.slug}@instructors.lumio.demo`;
    const username = `course-${course.slug}`;
    const [firstName, lastName] = course.instructor;
    const instructor = await db.user.upsert({
      where: { email },
      update: { username, firstName, lastName, role: "INSTRUCTOR" },
      create: {
        email,
        username,
        firstName,
        lastName,
        role: "INSTRUCTOR",
        passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
        profile: { create: { bio: `Lumio instructor specializing in ${course.category.toLowerCase()} and practical project-based learning.` } },
        settings: { create: {} },
      },
      select: { id: true },
    });

    await db.course.update({
      where: { id: existing.id },
      data: {
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        price: course.price,
        level: course.level,
        status: "PUBLISHED",
        categoryId: categoryIds.get(course.categorySlug)!,
        instructorId: instructor.id,
      },
    });

    const lessons = existing.sections.flatMap((section) => section.lessons);
    const finalSection = existing.sections.at(-1);
    if (!finalSection) {
      console.warn(`Skipped lesson refresh without sections: ${course.slug}`);
      continue;
    }

    const durationPerLesson = Math.floor(course.durationMinutes / course.lessons);
    const extraMinutes = course.durationMinutes % course.lessons;
    for (let position = lessons.length; position < course.lessons; position++) {
      await db.lesson.create({
        data: {
          sectionId: finalSection.id,
          position: finalSection.lessons.length + position - lessons.length,
          title: `Guided project ${position - lessons.length + 1}: ${course.title}`,
          description: `Apply the course skills in a focused practice project. ${course.description}`,
          durationMinutes: durationPerLesson,
        },
      });
    }
    const refreshed = await db.lesson.findMany({
      where: { section: { courseId: existing.id } },
      orderBy: [{ section: { position: "asc" } }, { position: "asc" }],
      select: { id: true },
    });
    for (const [index, lesson] of refreshed.entries()) {
      if (index >= course.lessons) break;
      await db.lesson.update({
        where: { id: lesson.id },
        data: { durationMinutes: durationPerLesson + (index < extraMinutes ? 1 : 0) },
      });
    }
    updated++;
  }

  console.log(`Refreshed ${updated} courses across four catalog categories. Existing accounts, purchases, favorites, reviews, and progress were preserved.`);
}

refreshCatalog(db)
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await db.$disconnect(); });
