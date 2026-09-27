import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDemoReviews, applyDemoCourseDurations, applyDemoCourseVideos, demoCourseDurations } from "./demo-videos";
import { applyExtraDemoCourses, extraDemoCourses } from "./extra-courses";
import { refreshCatalog } from "./refresh-catalog";

const db = new PrismaClient();

const people = [
  { email: "student@example.com", username: "learner", firstName: "Alex", lastName: "Morgan", role: "STUDENT", password: "Student123!" },
  { email: "instructor@example.com", username: "jordanlee", firstName: "Jordan", lastName: "Lee", role: "INSTRUCTOR", password: "Instructor123!" },
  { email: "admin@example.com", username: "lumioadmin", firstName: "Taylor", lastName: "Admin", role: "ADMIN", password: "Admin123!" },
  { email: "maya@example.com", username: "mayapatel", firstName: "Maya", lastName: "Patel", role: "INSTRUCTOR", password: "Instructor123!" },
  { email: "sam@example.com", username: "samrivera", firstName: "Sam", lastName: "Rivera", role: "INSTRUCTOR", password: "Instructor123!" },
];

type CourseSeed = {
  categorySlug: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  price: number;
  level: string;
  instructor: string;
};

const catalog: CourseSeed[] = [
  { categorySlug: "product-design", title: "Design systems from first principles", slug: "design-systems", subtitle: "Build a flexible design language your whole team can use.", description: "Learn to create useful, consistent design systems from the ground up.", icon: "✦", color: "#edf0ff", price: 89, level: "INTERMEDIATE", instructor: "Jordan Lee" },
  { categorySlug: "web-development", title: "Modern React, made practical", slug: "modern-react", subtitle: "Create fast, accessible interfaces with React and TypeScript.", description: "Build modern interfaces through focused lessons and practical examples.", icon: "⌘", color: "#e6f6f0", price: 99, level: "BEGINNER", instructor: "Maya Patel" },
  { categorySlug: "data-science", title: "A visual guide to machine learning", slug: "visual-machine-learning", subtitle: "Understand the ideas behind the models with hands-on projects.", description: "Explore machine learning concepts through visual explanations and projects.", icon: "◈", color: "#f2eaff", price: 119, level: "INTERMEDIATE", instructor: "Sam Rivera" },
  { categorySlug: "business", title: "The confident founder's playbook", slug: "founder-playbook", subtitle: "Turn a promising idea into a focused, sustainable business.", description: "Learn practical ways to test ideas and build a sustainable business.", icon: "↗", color: "#fff0e8", price: 69, level: "BEGINNER", instructor: "Jordan Lee" },
  { categorySlug: "cybersecurity", title: "Practical security for modern teams", slug: "practical-security", subtitle: "Learn threat modeling, secure habits, and incident response.", description: "Build a practical foundation in security for modern teams.", icon: "⬡", color: "#e4f4f5", price: 109, level: "ADVANCED", instructor: "Maya Patel" },
  { categorySlug: "ai", title: "Prompt engineering for real work", slug: "prompt-engineering", subtitle: "Build useful AI workflows with clear, repeatable methods.", description: "Design reliable AI workflows for everyday work.", icon: "✦", color: "#f4edff", price: 79, level: "BEGINNER", instructor: "Sam Rivera" },
  { categorySlug: "programming", title: "Python beyond the basics", slug: "python-beyond-basics", subtitle: "Write clean, testable Python and automate everyday work.", description: "Improve your Python skills with practical automation projects.", icon: "⌘", color: "#eaf4ff", price: 84, level: "INTERMEDIATE", instructor: "Jordan Lee" },
  { categorySlug: "cloud-computing", title: "Cloud architecture foundations", slug: "cloud-architecture", subtitle: "Make better infrastructure decisions from day one.", description: "Understand the building blocks of dependable cloud systems.", icon: "☁", color: "#e9f5ff", price: 129, level: "ADVANCED", instructor: "Maya Patel" },
  { categorySlug: "marketing", title: "A thoughtful guide to content strategy", slug: "content-strategy", subtitle: "Make content your audience actually wants to come back to.", description: "Plan a useful content strategy and measure what works.", icon: "◉", color: "#fff1f2", price: 59, level: "BEGINNER", instructor: "Sam Rivera" },
  { categorySlug: "web-development", title: "Build polished products with CSS", slug: "polished-css", subtitle: "Create expressive, responsive interfaces with modern CSS.", description: "Use modern CSS techniques to build polished responsive interfaces.", icon: "❋", color: "#edf7ee", price: 74, level: "INTERMEDIATE", instructor: "Jordan Lee" },
];

const categories = [
  ["Product design", "product-design"],
  ["Web development", "web-development"],
  ["Data science", "data-science"],
  ["Business", "business"],
  ["Cybersecurity", "cybersecurity"],
  ["AI & machine learning", "ai"],
  ["Programming", "programming"],
  ["Cloud computing", "cloud-computing"],
  ["Marketing", "marketing"],
] as const;

async function main() {
  // Clear dependent records first so the seed can safely be run more than once.
  await db.notification.deleteMany();
  await db.session.deleteMany();
  await db.lessonProgress.deleteMany();
  await db.certificate.deleteMany();
  await db.review.deleteMany();
  await db.wishlist.deleteMany();
  await db.payment.deleteMany();
  await db.order.deleteMany();
  await db.enrollment.deleteMany();
  await db.lesson.deleteMany();
  await db.section.deleteMany();
  await db.course.deleteMany();
  await db.category.deleteMany();
  await db.profile.deleteMany();
  await db.userSettings.deleteMany();
  await db.user.deleteMany();

  const users: Record<string, string> = {};
  for (const person of people) {
    const user = await db.user.create({
      data: {
        email: person.email,
        username: person.username,
        firstName: person.firstName,
        lastName: person.lastName,
        role: person.role,
        passwordHash: await bcrypt.hash(person.password, 12),
        profile: {
          create: {
            bio: person.role === "INSTRUCTOR"
              ? "Curious educator sharing practical ideas with a global community."
              : "Learning something new, one good lesson at a time.",
          },
        },
        settings: { create: {} },
      },
    });
    users[`${person.firstName} ${person.lastName}`] = user.id;
  }

  const categoryIds: Record<string, string> = {};
  for (const [name, slug] of categories) {
    const category = await db.category.create({ data: { name, slug } });
    categoryIds[slug] = category.id;
  }

  const courses: Array<{ id: string; title: string }> = [];
  for (const item of catalog) {
    const course = await db.course.create({
      data: {
        slug: item.slug,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        price: item.price,
        level: item.level,
        language: "English",
        status: "PUBLISHED",
        thumbnail: `${item.icon}|${item.color}`,
        instructorId: users[item.instructor],
        categoryId: categoryIds[item.categorySlug],
        sections: {
          create: [
            {
              title: "Start with the essentials",
              position: 0,
              lessons: {
                create: [
                  { title: "Welcome and course roadmap", description: "Get oriented and set a goal for your learning.", durationMinutes: demoCourseDurations[item.slug][0], position: 0, videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U" },
                  { title: "The core ideas", description: "Learn the building blocks with practical examples.", durationMinutes: demoCourseDurations[item.slug][1], position: 1, videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U" },
                  { title: "Your first project", description: "Put the concepts together in a small project.", durationMinutes: demoCourseDurations[item.slug][2], position: 2, videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U" },
                ],
              },
            },
            {
              title: "Put it into practice",
              position: 1,
              lessons: {
                create: [
                  { title: "Build with confidence", description: "Follow a guided practice session.", durationMinutes: demoCourseDurations[item.slug][3], position: 0 },
                  { title: "Next steps and resources", description: "Choose what to explore next.", durationMinutes: demoCourseDurations[item.slug][4], position: 1 },
                ],
              },
            },
          ],
        },
      },
    });
    courses.push(course);
  }

  await applyExtraDemoCourses(db);
  await applyDemoCourseVideos(db);
  await applyDemoCourseDurations(db);
  await addDemoReviews(db);
  await refreshCatalog(db);

  const studentId = users["Alex Morgan"];
  await db.enrollment.create({ data: { userId: studentId, courseId: courses[0].id } });

  const firstLesson = await db.lesson.findFirst({
    where: { section: { courseId: courses[0].id } },
    orderBy: { position: "asc" },
  });
  if (firstLesson) {
    await db.lessonProgress.create({
      data: { userId: studentId, lessonId: firstLesson.id, completed: true, completedAt: new Date() },
    });
  }

  for (let i = 0; i < 5; i++) {
    await db.review.create({
      data: {
        userId: studentId,
        courseId: courses[i].id,
        rating: 5 - (i % 2),
        text: i % 2 === 0
          ? "Clear, thoughtful lessons. I used the ideas right away."
          : "A great pace with examples that actually make sense.",
      },
    });
  }

  const order = await db.order.create({
    data: {
      userId: studentId,
      courseId: courses[0].id,
      amount: 69,
      status: "COMPLETED",
      payment: {
        create: { transactionId: "TXN-2026-000001", status: "COMPLETED" },
      },
    },
  });

  await db.notification.create({
    data: {
      userId: studentId,
      title: "Welcome to Lumio",
      body: "Your learning space is ready. Pick up where you left off or browse something new.",
    },
  });
  await db.notification.create({
    data: {
      userId: users["Jordan Lee"],
      title: "A new learner joined",
      body: "Alex Morgan enrolled in Product design.",
    },
  });

  console.log(`Seeded ${courses.length + extraDemoCourses.length} demo courses and ${people.length + 5} demo accounts. Order ${order.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
