import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, price } = await request.json();

    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // >>> BUSINESS LOGIC BYPASS: price client-dən gəlir, server öz
    // database-indəki course.price ilə müqayisə etmir/təsdiqləmir <<<
    const order = await db.order.create({
      data: {
        userId: user.id,
        courseId: course.id,
        amount: price, // TƏHLÜKƏLİ: client-in göndərdiyi qiymətə etibar edilir
        status: "PAID",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paidAmount: order.amount,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}