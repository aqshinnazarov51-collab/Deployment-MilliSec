import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getUser();
    console.log("DEBUG COOKIE HEADER:", request.headers.get("cookie"));
    console.log("DEBUG USER:", user);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, courseId } = await request.json();

    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // 1-ci addım: YOXLAMA (check) — promo istifadə olunubmu?
    const promo = await db.promoCode.findUnique({ where: { code } });

    if (!promo) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }
    if (promo.used) {
      return NextResponse.json({ error: "Promo code already used" }, { status: 400 });
    }

    // >>> RACE CONDITION PƏNCƏRƏSİ: yoxlama ilə yeniləmə arasında boşluq <<<
    // Eyni anda gələn paralel sorğular hamısı "used: false" görür,
    // çünki status hələ bazada yenilənməyib.
    await new Promise((resolve) => setTimeout(resolve, 300));

    const discountedAmount = Math.round(
      course.price * (1 - promo.discountPercent / 100)
    );

    const order = await db.order.create({
      data: {
        userId: user.id, // real sessiyadan gəlir, client body-dən yox
        courseId: course.id,
        amount: discountedAmount,
        status: "PENDING",
      },
    });

    // 2-ci addım: YENİLƏMƏ (update) — YOXLAMADAN AYRI, ATOMIK DEYİL
    await db.promoCode.update({
      where: { code },
      data: { used: true, usedCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      originalPrice: course.price,
      discountedAmount,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}