import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getValidPromo, priceCourses } from "@/lib/promo-codes";
import { generateTransactionId } from "@/lib/services/mockPayment";

export async function POST(request: Request) {
  // VULNERABLE / TRAINING: this entire route is disabled in production and unless explicitly enabled.
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_TRAINING_VULNERABILITIES !== "true") {
    return NextResponse.json({ error: "Training endpoint is disabled." }, { status: 404 });
  }
  const user = await getUser();
  if (!user || (user.role !== "STUDENT" && user.role !== "ADMIN")) return NextResponse.json({ error: "Sign in as a learner." }, { status: 401 });
  try {
    const body = await request.json();
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const claimedDiscount = Number(body.discountPercent);
    if (!Number.isFinite(claimedDiscount) || claimedDiscount < 0 || claimedDiscount > 100) return NextResponse.json({ error: "Use a discount from 0 to 100." }, { status: 400 });
    const course = await db.course.findFirst({ where: { id: courseId, status: "PUBLISHED" }, select: { id: true, price: true, slug: true, title: true, instructorId: true } });
    if (!course) return NextResponse.json({ error: "Published course not found." }, { status: 404 });
    if (await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } })) return NextResponse.json({ error: "You already own this course." }, { status: 409 });

    // SAFE BASELINE: production quote ignores client-supplied discountPercent and only accepts an active database promo.
    const promoCode = typeof body.promoCode === "string" ? body.promoCode : "";
    const realPromo = promoCode ? await getValidPromo(promoCode) : null;
    const safeQuote = priceCourses([course], realPromo ?? undefined);

    // VULNERABLE / TRAINING: business-logic flaw — trusts the browser's claimed percentage
    // instead of loading/validating an authorized PromoCode record on the server.
    const vulnerableAmount = Math.round(course.price * (1 - claimedDiscount / 100));
    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({ data: { userId: user.id, courseId, amount: vulnerableAmount, discountAmount: Math.max(0, course.price - vulnerableAmount), status: "COMPLETED", payment: { create: { transactionId: generateTransactionId(), status: "COMPLETED", method: "TRAINING_ONLY" } } } });
      await tx.enrollment.create({ data: { userId: user.id, courseId } });
      return created;
    });
    return NextResponse.json({ label: "VULNERABLE / TRAINING", orderId: order.id, course: course.title, clientClaimedDiscountPercent: claimedDiscount, vulnerableAmount, secureAmount: safeQuote.total, message: "No real payment was processed. The vulnerable route trusted the client discount; the secure amount only uses a database promo." });
  } catch {
    return NextResponse.json({ error: "Training purchase failed." }, { status: 400 });
  }
}
