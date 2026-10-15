import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withApiErrorBoundary } from "@/lib/api-error";

export const GET = withApiErrorBoundary("search GET", async (request: Request) => {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: q } },
        { subtitle: { contains: q } },
        { description: { contains: q } },
        { category: { name: { contains: q } } },
        { instructor: { firstName: { contains: q } } },
        { instructor: { lastName: { contains: q } } },
      ],
    },
    select: {
      slug: true,
      title: true,
      category: { select: { name: true } },
      instructor: { select: { firstName: true, lastName: true } },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    {
      results: results.map((result) => ({
        slug: result.slug,
        title: result.title,
        category: result.category.name,
        instructor: `${result.instructor.firstName} ${result.instructor.lastName}`,
      })),
    },
    { headers: { "Cache-Control": "private, max-age=15" } },
  );
});
