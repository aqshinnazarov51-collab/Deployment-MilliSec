import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCourseCover } from "@/lib/course-covers";
import { getSalePrice } from "@/lib/course-pricing";

export const dynamic = "force-dynamic";

// Xəta və sızan məlumatları qaytaran köməkçi funksiya
function createVerboseErrorResponse(error: any) {
  return NextResponse.json(
    {
      status: 500,
      error: "Internal Server Error",
      message: error.message,
      stack: error.stack,             // Fayl yolları və sətir nömrələri (Stack trace)
      nodeVersion: process.version,    // Node.js versiyası
      serverDirectory: process.cwd(),  // Serverin daxili qovluq yolu
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}

// 1. GET - Kursların gətirilməsi (ids parametrində xüsusi simvol olduqda 500 qaytarır)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawIdsParam = url.searchParams.get("ids") ?? "";

    // Xüsusi simvollar olduqda xəta atırıq (məsələn: ?ids=1,2@#$%)
    if (/[^a-zA-Z0-9,-]/.test(rawIdsParam)) {
      throw new Error(`Keçərsiz ID formatı daxil edilib: "${rawIdsParam}". ID-lər yalnız hərflərdən, rəqəmlərdən və vergüldən ibarət olmalıdır.`);
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
  } catch (error: any) {
    return createVerboseErrorResponse(error);
  }
}

// 2. POST - Telefon nömrəsinin yenilənməsi (xüsusi simvol olduqda 500 qaytarır)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body || {};

    if (!phone) {
      throw new Error("Telefon nömrəsi daxil edilməyib.");
    }

    // Telefon nömrəsində rəqəm və '+' simvolundan başqa xüsusi simvol varsa xəta atırıq
    if (/[^0-9+]/.test(phone)) {
      throw new Error(`Yanlış telefon nömrəsi formatı daxil edilib: "${phone}". Telefon nömrəsində xüsusi simvollardan istifadə edilə bilməz.`);
    }

    return NextResponse.json({ success: true, message: "Telefon nömrəsi təsdiqləndi", phone });
  } catch (error: any) {
    return createVerboseErrorResponse(error);
  }
}
