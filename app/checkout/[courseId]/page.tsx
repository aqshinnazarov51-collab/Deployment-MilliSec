import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { purchaseCourse } from "@/actions/courses";
import { Alert } from "@/components/Message";
import { PaymentFields } from "@/components/PaymentFields";
import { CheckoutPromoProvider, PromoOrderTotal } from "@/components/CheckoutPromo";
import { getSalePrice } from "@/lib/course-pricing";
import { randomUUID } from "node:crypto";

export default async function Checkout({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseId } = await params;
  const search = await searchParams;
  const user = await requireUser("STUDENT");
  const course = await db.course.findFirst({ where: { id: courseId, status: "PUBLISHED" }, include: { instructor: true } });
  if (!course) notFound();
  const sale=getSalePrice(course.price,course.slug);
  const wallet=await db.wallet.findUnique({where:{userId:user.id},select:{balanceCents:true}});
  if (await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } })) {
    redirect(`/student/courses/${courseId}/learn`);
  }

  return (
    <main className="shell" style={{ paddingTop: 43, paddingBottom: 65, maxWidth: 970 }}>
      <div className="eyebrow">One more step</div>
      <h1 style={{ fontSize: 33, letterSpacing: "-1.5px", margin: "8px 0 5px" }}>Make this course yours.</h1>
      <p className="small-note" style={{ fontSize: 13, marginBottom: 25 }}>Local demo checkout · no real charges or saved card details.</p>
      <CheckoutPromoProvider courseIds={[course.id]}>
      <div className="split" style={{ gridTemplateColumns: "1.2fr .8fr" }}>
        <section className="panel">
          <h2 style={{ marginBottom: 17 }}>Payment details</h2>
          <Alert error={search.error} />
          <PaymentFields action={purchaseCourse} courseId={course.id} price={sale.current} walletBalanceCents={wallet?.balanceCents??0} idempotencyKey={randomUUID()} />
        </section>
        <aside className="purchase-card">
          <div className="eyebrow">Order summary</div>
          <h2 style={{ fontSize: 18, margin: "13px 0 4px" }}>{course.title}</h2>
          <p className="small-note">with {course.instructor.firstName} {course.instructor.lastName}</p>
          <div style={{ height: 1, background: "var(--line)", margin: "18px 0" }} />
          {sale.original && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 8 }}><span>Course price</span><span><s className="old-price">${sale.original.toFixed(2)}</s></span></div>}
          <PromoOrderTotal baseTotal={sale.current} />
          <p className="small-note" style={{ marginTop: 18 }}>You’ll get lifetime access to the course and every future lesson update.</p>
          <Link className="text-link" href={`/courses/${course.slug}`}>← Back to course</Link>
        </aside>
      </div>
      </CheckoutPromoProvider>
    </main>
  );
}
