import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCourseCover } from "@/lib/course-covers";
import { getSalePrice } from "@/lib/course-pricing";

export const dynamic = "force-dynamic";

function createErrorResponse(status = 500) {
  return NextResponse.json(
    { error: status === 400 ? "Invalid request" : "Internal Server Error" },
    { status }
  );
}

// 1. GET - Kursların gətirilməsi (ids parametrində xüsusi simvol olduqda 500 qaytarır)
export async function GET(request: Request) {
  try {
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
  } catch {
    return createErrorResponse();
  }
}

// 2. POST - Telefon nömrəsinin yenilənməsi (xüsusi simvol olduqda 500 qaytarır)
export async function POST(request: Request) {
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
}
