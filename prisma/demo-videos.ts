import type { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { extraDemoCourses } from "./extra-courses";

type VideoLesson = { title: string; description: string; url: string };

// Free, publicly viewable educational videos. Timestamps line up with the
// published chapter marks where those are available.
export const demoCourseVideos: Record<string, VideoLesson[]> = {
  "design-systems": [
    { title: "Figma Design for Beginners: Course Overview", description: "Start with Figma’s public beginner course from the official Figma channel.", url: "https://www.youtube.com/watch?v=zzhSFobLkYw" },
  ],
  "modern-react": [
    { title: "React and TypeScript: Course Introduction", description: "Begin the freeCodeCamp React and TypeScript course.", url: "https://www.youtube.com/watch?v=aJP1AbZSqz8&t=0s" },
    { title: "TypeScript Fundamentals", description: "Continue at the TypeScript section of the public course.", url: "https://www.youtube.com/watch?v=aJP1AbZSqz8&t=111s" },
    { title: "Build React Components", description: "Continue at the React component section of the public course.", url: "https://www.youtube.com/watch?v=aJP1AbZSqz8&t=847s" },
  ],
  "visual-machine-learning": [
    { title: "But What Is a Neural Network?", description: "A visual introduction to neural networks from 3Blue1Brown.", url: "https://www.youtube.com/watch?v=aircAruvnKk" },
  ],
  "founder-playbook": [
    { title: "How to Get and Evaluate Startup Ideas", description: "A free Y Combinator lesson on finding and evaluating startup ideas.", url: "https://www.youtube.com/watch?v=Th8JoIan4dg" },
  ],
  "practical-security": [
    { title: "Hands-On Cybersecurity: Course Introduction", description: "Start a free, public cybersecurity course from freeCodeCamp.", url: "https://www.youtube.com/watch?v=ug8W0sFiVJo" },
  ],
  "prompt-engineering": [
    { title: "Prompt Engineering: Introduction", description: "Begin the public freeCodeCamp prompt engineering course.", url: "https://www.youtube.com/watch?v=_ZvnD73m40o&t=0s" },
    { title: "Prompt Engineering Basics", description: "Continue at the first prompt engineering chapter.", url: "https://www.youtube.com/watch?v=_ZvnD73m40o&t=91s" },
    { title: "Writing Better Prompts", description: "Continue at the practical prompt writing chapter.", url: "https://www.youtube.com/watch?v=_ZvnD73m40o&t=484s" },
  ],
  "python-beyond-basics": [
    { title: "Python for Everybody: Getting Started", description: "Start the free Python course from Dr. Charles Severance.", url: "https://www.youtube.com/watch?v=8DvywoWv6fI&t=0s" },
    { title: "Variables and Expressions", description: "Jump to the course chapter on variables and expressions.", url: "https://www.youtube.com/watch?v=8DvywoWv6fI&t=3415s" },
    { title: "Conditional Execution", description: "Jump to the chapter on Python conditionals.", url: "https://www.youtube.com/watch?v=8DvywoWv6fI&t=5208s" },
  ],
  "cloud-architecture": [
    { title: "AWS Cloud Practitioner: Course Introduction", description: "Start a free public AWS Cloud Practitioner course.", url: "https://www.youtube.com/watch?v=7HKot-brXFE&t=67s" },
    { title: "Cloud Concepts and Benefits", description: "Continue at the cloud concepts chapter.", url: "https://www.youtube.com/watch?v=7HKot-brXFE&t=530s" },
    { title: "AWS Global Infrastructure", description: "Continue at the lesson on AWS global infrastructure.", url: "https://www.youtube.com/watch?v=7HKot-brXFE&t=5021s" },
  ],
  "content-strategy": [
    { title: "Create a Content Marketing Strategy", description: "A public HubSpot lesson on planning a content strategy.", url: "https://www.youtube.com/watch?v=DSOfPEyeMNg&t=3s" },
    { title: "Map Content to the Buyer Journey", description: "Continue at the buyer journey section of the lesson.", url: "https://www.youtube.com/watch?v=DSOfPEyeMNg&t=76s" },
    { title: "Set Your Content Goals", description: "Continue at the goal-setting section of the lesson.", url: "https://www.youtube.com/watch?v=DSOfPEyeMNg&t=96s" },
  ],
  "polished-css": [
    { title: "CSS Full Course", description: "A free, public CSS course from freeCodeCamp.", url: "https://www.youtube.com/watch?v=ieTHC78giGQ" },
  ],
};

export const demoCourseDurations: Record<string, number[]> = {
  "design-systems": [8, 16, 24, 18, 12],
  "modern-react": [10, 14, 22, 35, 12],
  "visual-machine-learning": [7, 20, 18, 28, 15],
  "founder-playbook": [6, 18, 17, 22, 10],
  "practical-security": [12, 26, 31, 40, 18],
  "prompt-engineering": [7, 11, 16, 20, 9],
  "python-beyond-basics": [14, 22, 32, 27, 16],
  "cloud-architecture": [10, 27, 35, 42, 20],
  "content-strategy": [8, 13, 17, 22, 11],
  "polished-css": [9, 18, 24, 32, 15],
};

export const demoReviewers = [
  { firstName: "Casey", lastName: "Brooks", username: "caseybrooks", email: "casey.brooks@reviewer.lumio.demo" },
  { firstName: "Riley", lastName: "Chen", username: "rileychen", email: "riley.chen@reviewer.lumio.demo" },
  { firstName: "Morgan", lastName: "Reed", username: "morganreed", email: "morgan.reed@reviewer.lumio.demo" },
  { firstName: "Jamie", lastName: "Park", username: "jamiepark", email: "jamie.park@reviewer.lumio.demo" },
  { firstName: "Avery", lastName: "James", username: "averyjames", email: "avery.james@reviewer.lumio.demo" },
];

const reviewCopy = [
  "Clear explanations and a practical pace. The examples made the topic easier to apply.",
  "Helpful course structure. I could follow each lesson and try the ideas right away.",
  "A good balance between core concepts and practice. I saved a few lessons to revisit.",
  "Well organized, approachable, and full of useful next steps.",
  "Concise material with strong examples. I finished with a better grasp of the subject.",
];

export async function applyDemoCourseDurations(client: PrismaClient) {
  for (const [slug, durations] of Object.entries(demoCourseDurations)) {
    const course = await client.course.findUnique({
      where: { slug },
      select: { sections: { orderBy: { position: "asc" }, select: { lessons: { orderBy: { position: "asc" }, select: { id: true } } } } },
    });
    if (!course) continue;
    const lessons = course.sections.flatMap((section) => section.lessons);
    for (const [index, lesson] of lessons.entries()) {
      const durationMinutes = durations[index];
      if (durationMinutes) await client.lesson.update({ where: { id: lesson.id }, data: { durationMinutes } });
    }
  }
}

export async function addDemoReviews(client: PrismaClient) {
  const reviewerIds = await Promise.all(demoReviewers.map(async (reviewer) => {
    const user = await client.user.findUnique({ where: { email: reviewer.email }, select: { id: true } });
    if (user) return user.id;
    const created = await client.user.create({
      data: {
        ...reviewer,
        role: "STUDENT",
        passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
      },
      select: { id: true },
    });
    return created.id;
  }));

  const reviewCourseSlugs = [...Object.keys(demoCourseVideos), ...extraDemoCourses.map((course) => course.slug)];
  for (const [courseIndex, slug] of reviewCourseSlugs.entries()) {
    const course = await client.course.findUnique({ where: { slug }, select: { id: true } });
    if (!course) continue;
    for (let offset = 0; offset < 2; offset++) {
      const reviewerIndex = (courseIndex * 2 + offset) % reviewerIds.length;
      const userId = reviewerIds[reviewerIndex];
      const existing = await client.review.findUnique({ where: { userId_courseId: { userId, courseId: course.id } }, select: { id: true } });
      if (existing) continue;
      await client.review.create({
        data: {
          userId,
          courseId: course.id,
          rating: 4 + ((courseIndex + offset) % 2),
          text: reviewCopy[(courseIndex + offset) % reviewCopy.length],
        },
      });
    }
  }
}

export async function applyDemoCourseVideos(client: PrismaClient) {
  for (const [slug, videos] of Object.entries(demoCourseVideos)) {
    const course = await client.course.findUnique({
      where: { slug },
      select: { sections: { orderBy: { position: "asc" }, select: { lessons: { orderBy: { position: "asc" }, select: { id: true, videoUrl: true } } } } },
    });
    if (!course) continue;
    const lessons = course.sections.flatMap((section) => section.lessons);
    for (let index = 0; index < lessons.length; index++) {
      const current = lessons[index];
      const video = videos[index];
      if (video) {
        await client.lesson.update({ where: { id: current.id }, data: { title: video.title, description: video.description, videoUrl: video.url } });
      } else if (current.videoUrl === "https://www.youtube.com/watch?v=ysz5S6PUM-U") {
        // Remove only the old shared placeholder. Preserve any instructor-added links.
        await client.lesson.update({ where: { id: current.id }, data: { videoUrl: null } });
      }
    }
  }
}
