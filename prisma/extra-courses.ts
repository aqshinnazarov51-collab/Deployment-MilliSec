import type { PrismaClient } from "@prisma/client";

type LessonSeed = { title: string; description: string; durationMinutes: number; videoUrl?: string };
type ExtraCourseSeed = {
  categoryName: string;
  categorySlug: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  level: string;
  price: number;
  instructorEmail: string;
  symbol: string;
  color: string;
  lessons: LessonSeed[];
};

const yt = (id: string, start?: number) => `https://www.youtube.com/watch?v=${id}${start === undefined ? "" : `&t=${start}s`}`;

export const extraDemoCourses: ExtraCourseSeed[] = [
  {
    categoryName: "Programming", categorySlug: "programming", title: "JavaScript Essentials", slug: "javascript-essentials",
    subtitle: "Learn the language behind interactive websites, one practical concept at a time.",
    description: "Build a strong JavaScript foundation with variables, arrays, functions, conditions, and small coding challenges.",
    level: "BEGINNER", price: 64, instructorEmail: "instructor@example.com", symbol: "JS", color: "#fff3dc",
    lessons: [
      { title: "Start Here: Running JavaScript", description: "Meet the language and get your first JavaScript code running.", durationMinutes: 6, videoUrl: yt("PkZNo7MFNFg", 0) },
      { title: "Variables and Values", description: "Store, update, and work with values in your programs.", durationMinutes: 35, videoUrl: yt("PkZNo7MFNFg", 356) },
      { title: "Arrays and Lists", description: "Collect values and use common array operations.", durationMinutes: 11, videoUrl: yt("PkZNo7MFNFg", 2444) },
      { title: "Functions and Reusable Code", description: "Write functions, pass arguments, and return results.", durationMinutes: 17, videoUrl: yt("PkZNo7MFNFg", 3101) },
      { title: "Conditions and Decisions", description: "Use booleans and conditional logic to control a program.", durationMinutes: 23, videoUrl: yt("PkZNo7MFNFg", 4121) },
    ],
  },
  {
    categoryName: "Data science", categorySlug: "data-science", title: "SQL for Everyday Analysis", slug: "sql-everyday-analysis",
    subtitle: "Ask better questions of your data with practical SQL queries.",
    description: "Learn relational database basics, keys, table design, SQL queries, and how to organize data for analysis.",
    level: "BEGINNER", price: 72, instructorEmail: "maya@example.com", symbol: "SQL", color: "#e9f5ff",
    lessons: [
      { title: "Databases and SQL: First Look", description: "Understand what databases store and where SQL fits.", durationMinutes: 5, videoUrl: yt("HXV3zeQKqGY", 0) },
      { title: "Tables, Keys, and Relationships", description: "Explore how relational databases organize connected information.", durationMinutes: 20, videoUrl: yt("HXV3zeQKqGY", 1390) },
      { title: "Write Your First SQL Queries", description: "Practice selecting and filtering records from a table.", durationMinutes: 20, videoUrl: yt("HXV3zeQKqGY", 2611) },
      { title: "Create and Update Tables", description: "Work with table creation and common data changes.", durationMinutes: 32, videoUrl: yt("HXV3zeQKqGY", 4549) },
      { title: "Design a Small Database", description: "Put database structure and queries together in a practical exercise.", durationMinutes: 15, videoUrl: yt("HXV3zeQKqGY", 7685) },
    ],
  },
  {
    categoryName: "Web development", categorySlug: "web-development", title: "HTML and CSS: Build Your First Website", slug: "html-css-first-website",
    subtitle: "Turn a blank page into a polished, responsive website.",
    description: "Learn the core building blocks of the web and practice styling a responsive page with HTML and CSS.",
    level: "BEGINNER", price: 59, instructorEmail: "sam@example.com", symbol: "</>", color: "#eaf7f1",
    lessons: [
      { title: "How Web Pages Are Built", description: "Get oriented with HTML, CSS, and the browser.", durationMinutes: 12, videoUrl: yt("dX8396ZmSPk") },
      { title: "Structure a Page with HTML", description: "Practice headings, links, images, and semantic page structure.", durationMinutes: 18 },
      { title: "Style the Page with CSS", description: "Apply typography, color, spacing, and layout rules.", durationMinutes: 26 },
      { title: "Make the Layout Responsive", description: "Adapt a page for desktop and smaller screens.", durationMinutes: 22 },
      { title: "Build a Small Portfolio Page", description: "Combine the fundamentals in a guided page-building exercise.", durationMinutes: 24 },
    ],
  },
  {
    categoryName: "Product design", categorySlug: "product-design", title: "UI Design with Figma", slug: "ui-design-figma",
    subtitle: "Design clear interfaces and clickable prototypes in Figma.",
    description: "Learn a practical UI design workflow in Figma, from first shapes and typography to responsive layouts and reusable components.",
    level: "BEGINNER", price: 69, instructorEmail: "maya@example.com", symbol: "UI", color: "#f1eaff",
    lessons: [
      { title: "Figma Setup and Your First File", description: "Create an account and start a clean design file.", durationMinutes: 5, videoUrl: yt("jwCmIBJ8Jtc", 0) },
      { title: "Shapes, Selection, and Typography", description: "Build basic interface elements and establish readable type.", durationMinutes: 34, videoUrl: yt("jwCmIBJ8Jtc", 2174) },
      { title: "Color and Spacing Systems", description: "Use color, margins, and padding consistently in interface design.", durationMinutes: 29, videoUrl: yt("jwCmIBJ8Jtc", 4844) },
      { title: "Auto Layout and Components", description: "Create flexible elements that are easier to reuse and update.", durationMinutes: 59, videoUrl: yt("jwCmIBJ8Jtc", 6968) },
      { title: "Design a Responsive Website", description: "Apply layout principles to a complete responsive page.", durationMinutes: 61, videoUrl: yt("jwCmIBJ8Jtc", 10271) },
    ],
  },
  {
    categoryName: "Mobile app development", categorySlug: "mobile-development", title: "Build Mobile Apps with React Native", slug: "react-native-mobile-apps",
    subtitle: "Create cross-platform mobile apps with React Native and Expo.",
    description: "Move from mobile app setup to navigation, lists, data storage, and a working app build in this hands-on course.",
    level: "INTERMEDIATE", price: 89, instructorEmail: "instructor@example.com", symbol: "RN", color: "#e5f5f3",
    lessons: [
      { title: "Set Up a React Native Project", description: "Get a mobile development project ready to run.", durationMinutes: 21, videoUrl: yt("sm5Y7Vtuihg", 0) },
      { title: "Build Your First App Screen", description: "Create a mobile app interface with React Native components.", durationMinutes: 22, videoUrl: yt("sm5Y7Vtuihg", 1307) },
      { title: "Add Navigation and Lists", description: "Move between screens and render useful collections.", durationMinutes: 34, videoUrl: yt("sm5Y7Vtuihg", 2586) },
      { title: "Save and Update App Data", description: "Explore CRUD patterns and local data storage.", durationMinutes: 48, videoUrl: yt("sm5Y7Vtuihg", 7547) },
      { title: "Prepare a Development Build", description: "Learn the next steps for testing and building a mobile app.", durationMinutes: 37, videoUrl: yt("sm5Y7Vtuihg", 14554) },
    ],
  },
  {
    categoryName: "Programming", categorySlug: "programming", title: "C# Programming Fundamentals", slug: "csharp-programming-fundamentals",
    subtitle: "Start writing C# with variables, methods, conditions, and classes.",
    description: "Build a beginner-friendly foundation in C# and practice the language through small console programs.",
    level: "BEGINNER", price: 67, instructorEmail: "sam@example.com", symbol: "C#", color: "#f3eaff",
    lessons: [
      { title: "C# Setup and First Program", description: "Set up the tools and run a first C# program.", durationMinutes: 5, videoUrl: yt("GhQdlIFylQ8", 0) },
      { title: "Variables, Types, and Strings", description: "Store data and work with common C# value types.", durationMinutes: 32, videoUrl: yt("GhQdlIFylQ8", 1037) },
      { title: "Numbers and User Input", description: "Read input and use numbers in small programs.", durationMinutes: 18, videoUrl: yt("GhQdlIFylQ8", 1817) },
      { title: "Methods and Return Values", description: "Organize code into methods and return useful results.", durationMinutes: 29, videoUrl: yt("GhQdlIFylQ8", 5389) },
      { title: "Conditions and Classes", description: "Make decisions in code and meet object-oriented building blocks.", durationMinutes: 34, videoUrl: yt("GhQdlIFylQ8", 6366) },
    ],
  },
  {
    categoryName: "DevOps", categorySlug: "devops", title: "Docker and DevOps Foundations", slug: "docker-devops-foundations",
    subtitle: "Understand containers and ship a small application with Docker.",
    description: "Learn what containers solve, how Docker works, and how to build and deploy a containerized application.",
    level: "INTERMEDIATE", price: 79, instructorEmail: "maya@example.com", symbol: "DK", color: "#e8f5ff",
    lessons: [
      { title: "Containers and Docker Basics", description: "Understand containerization and the problems Docker helps solve.", durationMinutes: 34, videoUrl: yt("rjjES5IsPdg", 0) },
      { title: "Virtual Machines and Containers", description: "Compare containers with virtual machines and learn the key terms.", durationMinutes: 27, videoUrl: yt("rjjES5IsPdg", 930) },
      { title: "Docker Architecture and Setup", description: "See Docker's moving parts and set up a working environment.", durationMinutes: 61, videoUrl: yt("rjjES5IsPdg", 2527) },
      { title: "Images, Containers, and Commands", description: "Run containers and use practical Docker commands.", durationMinutes: 26, videoUrl: yt("rjjES5IsPdg", 6144) },
      { title: "Networking and Persistent Data", description: "Explore container networking and ways to keep application data.", durationMinutes: 38, videoUrl: yt("rjjES5IsPdg", 7718) },
    ],
  },
  {
    categoryName: "Programming", categorySlug: "programming", title: "Git and GitHub Workflow", slug: "git-github-workflow",
    subtitle: "Track changes, collaborate safely, and share code with GitHub.",
    description: "Learn Git's everyday workflow, including commits, branches, merges, stashing, rebasing, and GitHub pull requests.",
    level: "BEGINNER", price: 55, instructorEmail: "instructor@example.com", symbol: "Git", color: "#fff0e7",
    lessons: [
      { title: "Git and Version Control", description: "Learn what version control tracks and how a repository works.", durationMinutes: 6, videoUrl: yt("zTjRZNkhiEU", 0) },
      { title: "Initialize a Repository and Commit", description: "Start a repository and save changes as commits.", durationMinutes: 18, videoUrl: yt("zTjRZNkhiEU", 354) },
      { title: "Branches, Merges, and Conflicts", description: "Work across branches and resolve common merge conflicts.", durationMinutes: 67, videoUrl: yt("zTjRZNkhiEU", 2402) },
      { title: "Diff, Stash, and Rebase", description: "Inspect changes and manage work in progress.", durationMinutes: 28, videoUrl: yt("zTjRZNkhiEU", 6461) },
      { title: "Push to GitHub and Open a Pull Request", description: "Share a branch and contribute changes through a pull request.", durationMinutes: 30, videoUrl: yt("zTjRZNkhiEU", 9444) },
    ],
  },
  {
    categoryName: "Web development", categorySlug: "web-development", title: "Build Web Apps with Next.js", slug: "nextjs-web-apps",
    subtitle: "Explore the React framework used to build full-stack web applications.",
    description: "Get started with Next.js and learn how its routing, rendering, and project structure fit together in a real web app.",
    level: "INTERMEDIATE", price: 86, instructorEmail: "maya@example.com", symbol: "N", color: "#edf0ff",
    lessons: [
      { title: "Next.js: What It Is and When to Use It", description: "Get oriented with the framework and its role in a React project.", durationMinutes: 12, videoUrl: yt("1WmNXEVia8I") },
      { title: "Start a Next.js Project", description: "Explore project setup and the main app structure.", durationMinutes: 18 },
      { title: "Build Pages and Components", description: "Put reusable interface pieces together into a working app.", durationMinutes: 27 },
      { title: "Understand Routing and Rendering", description: "Learn the core ideas behind Next.js navigation and page output.", durationMinutes: 32 },
      { title: "Plan a Small Web App", description: "Apply the course ideas to a focused project plan.", durationMinutes: 24 },
    ],
  },
  {
    categoryName: "Programming", categorySlug: "programming", title: "Practical TypeScript", slug: "practical-typescript",
    subtitle: "Make JavaScript projects clearer with types, unions, and generics.",
    description: "Learn TypeScript hands-on by adding types to an app and using objects, functions, unions, and generics.",
    level: "INTERMEDIATE", price: 74, instructorEmail: "sam@example.com", symbol: "TS", color: "#eaf2ff",
    lessons: [
      { title: "TypeScript and the Pizza App", description: "Get started with a small app that will grow during the course.", durationMinutes: 7, videoUrl: yt("SpwzRDUQ1GI", 0) },
      { title: "Move JavaScript Code to TypeScript", description: "Introduce types gradually into an existing code example.", durationMinutes: 10, videoUrl: yt("SpwzRDUQ1GI", 399) },
      { title: "Defensive Coding and Basic Types", description: "Use type annotations to catch mistakes and clarify intent.", durationMinutes: 9, videoUrl: yt("SpwzRDUQ1GI", 1198) },
      { title: "Custom Types and Typed Objects", description: "Describe application data with reusable types.", durationMinutes: 18, videoUrl: yt("SpwzRDUQ1GI", 1775) },
      { title: "Arrays, Unions, and Generics", description: "Use richer types to model lists and reusable functions.", durationMinutes: 28, videoUrl: yt("SpwzRDUQ1GI", 2840) },
    ],
  },
];

export async function applyExtraDemoCourses(client: PrismaClient) {
  for (const item of extraDemoCourses) {
    const exists = await client.course.findUnique({ where: { slug: item.slug }, select: { id: true } });
    if (exists) continue;
    const [category, instructor] = await Promise.all([
      client.category.upsert({ where: { slug: item.categorySlug }, create: { name: item.categoryName, slug: item.categorySlug }, update: {} }),
      client.user.findUnique({ where: { email: item.instructorEmail }, select: { id: true } }),
    ]);
    if (!instructor) throw new Error(`Demo instructor not found for ${item.title}`);
    await client.course.create({
      data: {
        slug: item.slug,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        price: item.price,
        level: item.level,
        language: "English",
        status: "PUBLISHED",
        thumbnail: `${item.symbol}|${item.color}`,
        instructorId: instructor.id,
        categoryId: category.id,
        sections: {
          create: [
            { title: "Start with the essentials", position: 0, lessons: { create: item.lessons.slice(0, 3).map((lesson, position) => ({ ...lesson, position, videoUrl: lesson.videoUrl ?? null })) } },
            { title: "Put it into practice", position: 1, lessons: { create: item.lessons.slice(3).map((lesson, position) => ({ ...lesson, position, videoUrl: lesson.videoUrl ?? null })) } },
          ],
        },
      },
    });
  }
}
