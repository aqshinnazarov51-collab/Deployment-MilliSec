import "server-only";
import { db } from "@/lib/db";
import { getSalePrice } from "@/lib/course-pricing";

export type PricedCourse = { id: string; price: number; slug: string; instructorId: string };

export function priceCourses(courses: PricedCourse[], promo?: { discountPercent: number; instructorId: string | null }) {
  const items = courses.map((course) => {
    const baseAmount = getSalePrice(course.price, course.slug).current;
    const eligible = !!promo && (!promo.instructorId || promo.instructorId === course.instructorId);
    const discountAmount = eligible ? Math.round(baseAmount * promo.discountPercent / 100) : 0;
    return { courseId: course.id, baseAmount, discountAmount, amount: baseAmount - discountAmount, eligible };
  });
  return {
    items,
    subtotal: items.reduce((sum, item) => sum + item.baseAmount, 0),
    discountAmount: items.reduce((sum, item) => sum + item.discountAmount, 0),
    total: items.reduce((sum, item) => sum + item.amount, 0),
  };
}

export async function getValidPromo(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized.length > 40) return null;
  const promo = await db.promoCode.findUnique({ where: { code: normalized } });
  if (!promo?.active || (promo.expiresAt && promo.expiresAt <= new Date())) return null;
  return promo;
}

export async function isPromoAvailable(promoId: string) {
  const promo = await db.promoCode.findUnique({ where: { id: promoId }, select: { used: true } });
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return !promo?.used;
}

export async function consumePromo(promoId: string) {
  await db.promoCode.update({
    where: { id: promoId },
    data: { used: true, usedCount: { increment: 1 } },
  });
}

export async function createSafeQuote(code: string, courseIds: string[]) {
  const courses = await db.course.findMany({ where: { id: { in: courseIds }, status: "PUBLISHED" }, select: { id: true, price: true, slug: true, instructorId: true } });
  if (courses.length !== courseIds.length) return null;
  const promo = code.trim() ? await getValidPromo(code) : null;
  if (code.trim() && !promo) return null;
  const priced = priceCourses(courses, promo ?? undefined);
  if (promo && !priced.items.some((item) => item.eligible)) return null;
  return { code: promo?.code ?? "", discountPercent: promo?.discountPercent ?? 0, ...priced };
}
