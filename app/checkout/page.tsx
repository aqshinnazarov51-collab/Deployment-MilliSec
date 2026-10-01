import Link from "next/link";
import { redirect } from "next/navigation";
import { purchaseCart } from "@/actions/courses";
import { Alert } from "@/components/Message";
import { CartPurchaseClear } from "@/components/Cart";
import { PaymentFields } from "@/components/PaymentFields";
import { CheckoutPromoProvider, PromoOrderTotal } from "@/components/CheckoutPromo";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSalePrice } from "@/lib/course-pricing";
import { randomUUID } from "node:crypto";

export default async function CartCheckout({ searchParams }: { searchParams: Promise<{ courseIds?: string; error?: string; success?: string; purchased?: string }> }) {
  const search = await searchParams;
  if (search.success === "1") {
    const purchased = [...new Set((search.purchased ?? "").split(",").filter(Boolean))].slice(0, 50);
    return <main className="shell" style={{ maxWidth: 760, paddingTop: 80, paddingBottom: 90 }}>
      <CartPurchaseClear ids={purchased} />
      <section className="panel" style={{ padding: 36, textAlign: "center" }}>
        <div className="eyebrow" style={{ justifyContent: "center" }}>Payment complete</div>
        <h1 style={{ fontSize: 32, margin: "12px 0" }}>Your courses are ready.</h1>
        <p className="small-note">Your cart purchase was successful. The courses are now in My learning.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
          <Link className="button" href="/student/courses">Go to My courses</Link>
          <Link className="button button-outline" href="/catalog">Explore more courses</Link>
        </div>
      </section>
    </main>;
  }

  const user = await requireUser("STUDENT");
  const ids = [...new Set((search.courseIds ?? "").split(",").filter(Boolean))].slice(0, 50);
  if (!ids.length) redirect("/cart");

  const [courses, enrollments] = await Promise.all([
    db.course.findMany({ where: { id: { in: ids }, status: "PUBLISHED" }, include: { instructor: true } }),
    db.enrollment.findMany({ where: { userId: user.id, courseId: { in: ids } }, select: { courseId: true } }),
  ]);
  const byId = new Map(courses.map((course) => [course.id, course]));
  const orderedCourses = ids.flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
  if (!orderedCourses.length) redirect("/cart");
  const enrolledIds = new Set(enrollments.map((item) => item.courseId));
  const toPurchase = orderedCourses.filter((course) => !enrolledIds.has(course.id));
  if (!toPurchase.length) redirect("/student/courses");

  const total = toPurchase.reduce((sum, course) => sum + getSalePrice(course.price, course.slug).current, 0);
  const wallet = await db.wallet.findUnique({ where: { userId: user.id }, select: { balanceCents: true } });

  return <main className="shell" style={{ paddingTop: 43, paddingBottom: 65, maxWidth: 1080 }}>
    <div className="eyebrow">One checkout</div>
    <h1 style={{ fontSize: 33, letterSpacing: "-1.5px", margin: "8px 0 5px" }}>Complete your purchase.</h1>
    <p className="small-note" style={{ fontSize: 13, marginBottom: 25 }}>One local demo payment covers every course below. No real charge or saved card details.</p>
    <CheckoutPromoProvider courseIds={toPurchase.map((course) => course.id)}>
    <div className="split" style={{ gridTemplateColumns: "1.2fr .8fr" }}>
      <section className="panel">
        <h2 style={{ marginBottom: 17 }}>Payment details</h2>
        <Alert error={search.error} />
        <PaymentFields action={purchaseCart} courseIds={toPurchase.map((course) => course.id)} price={total} walletBalanceCents={wallet?.balanceCents ?? 0} idempotencyKey={randomUUID()} />
      </section>
      <aside className="purchase-card">
        <div className="eyebrow">Order summary</div>
        <div style={{ marginTop: 13 }}>
          {orderedCourses.map((course) => {
            const sale = getSalePrice(course.price, course.slug);
            const alreadyOwned = enrolledIds.has(course.id);
            return <div key={course.id} className="course-row" style={{ alignItems: "flex-start" }}>
              <div className="course-row-main">
                <strong>{course.title}</strong>
                <small>{alreadyOwned ? "Already in My courses" : `with ${course.instructor.firstName} ${course.instructor.lastName}`}</small>
              </div>
              <strong style={{ whiteSpace: "nowrap" }}>{alreadyOwned ? "Owned" : <>{sale.original && <s className="old-price">${sale.original.toFixed(2)}</s>} ${sale.current.toFixed(2)}</>}</strong>
            </div>;
          })}
        </div>
        <div style={{ height: 1, background: "var(--line)", margin: "14px 0" }} />
        <PromoOrderTotal baseTotal={total} />
        <p className="small-note" style={{ marginTop: 16 }}>{toPurchase.length} course{toPurchase.length === 1 ? "" : "s"} · lifetime access after payment.</p>
        <Link className="text-link" href="/cart">← Back to cart</Link>
      </aside>
    </div>
    </CheckoutPromoProvider>
  </main>;
}
