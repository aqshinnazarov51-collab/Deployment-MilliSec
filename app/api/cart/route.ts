import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCourseCover } from "@/lib/course-covers";
import { getSalePrice } from "@/lib/course-pricing";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = [...new Set((url.searchParams.get("ids") ?? "").split(",").filter(Boolean))].slice(0, 50);
  if (!ids.length) return NextResponse.json([]);
  const courses = await db.course.findMany({ where: { id: { in: ids }, status: "PUBLISHED" }, select: { id: true, slug: true, title: true, price: true } });
  return NextResponse.json(courses.map(course => ({ ...course, price: getSalePrice(course.price, course.slug).current, cover: getCourseCover(course.slug) })), { headers: { "Cache-Control": "no-store, max-age=0" } });
}
