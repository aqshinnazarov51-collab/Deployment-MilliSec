import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCourseCover } from "@/lib/course-covers";
import { getSalePrice } from "@/lib/course-pricing";
import { withApiErrorBoundary } from "@/lib/api-error";

export const dynamic = "force-dynamic";

function createErrorResponse(status = 400) {
  return NextResponse.json(
    { error: "Invalid request" },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

// 1. GET - Kursların gətirilməsi (ids parametrində xüsusi simvol olduqda 500 qaytarır)
export const GET = withApiErrorBoundary("cart GET", async (request: Request) => {
  const url = new URL(request.url);
  const rawIdsParam = url.searchParams.get("ids") ?? "";

  if (/[^a-zA-Z0-9,-]/.test(rawIdsParam)) {
    return createErrorResponse(400);
  }

  const ids = [...new Set(rawIdsParam.split(",").filter(Boolean))].slice(0, 50);

  if (!ids.length) return NextResponse.json([]);

  const courses = await db.course.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, price: true }
  });

  return NextResponse.json(
    courses.map(course => ({
      ...course,
      price: getSalePrice(course.price, course.slug).current,
      cover: getCourseCover(course.slug)
    })),
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
});

// 2. POST - Telefon nömrəsinin yenilənməsi (xüsusi simvol olduqda 500 qaytarır)
export const POST = withApiErrorBoundary("cart POST", async (request: Request) => {
  try {
    const body = await request.json();
    const { phone } = body || {};

    if (typeof phone !== "string" || !phone || phone.length > 30) return createErrorResponse(400);

    // Telefon nömrəsində rəqəm və '+' simvolundan başqa xüsusi simvol varsa xəta atırıq
    if (/[^0-9+]/.test(phone)) {
      return createErrorResponse(400);
    }

    return NextResponse.json({ success: true, message: "Telefon nömrəsi təsdiqləndi", phone });
  } catch {
    return createErrorResponse(400);
  }
});
