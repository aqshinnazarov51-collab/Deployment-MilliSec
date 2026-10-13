import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toggleUserBlock, setCourseVisibility } from "@/actions/admin";
import { Alert } from "@/components/Message";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  const [users, courses, orders, payments, reviews] = await Promise.all([
    db.user.findMany({ include: { _count: { select: { enrollments: true, courses: true, orders: true } } }, orderBy: { createdAt: "desc" }, take: 80 }),
    db.course.findMany({ include: { instructor: true, _count: { select: { enrollments: true, reviews: true } } }, orderBy: { createdAt: "desc" }, take: 80 }),
    db.order.findMany({ include: { user: true, course: true, payment: true }, orderBy: { createdAt: "desc" }, take: 80 }),
    db.payment.findMany({ include: { order: { include: { user: true, course: true } } }, orderBy: { createdAt: "desc" }, take: 80 }),
    db.review.findMany({ include: { user: true, course: true }, orderBy: { createdAt: "desc" }, take: 80 }),
  ]);

  return (
    <main className="shell" style={{ paddingTop: 38, paddingBottom: 60 }}>
      <div className="page-title-row">
        <div><div className="eyebrow">Lumio operations</div><h1>Admin console</h1><p>Review accounts, courses, demo orders and learner feedback.</p></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/admin/sales" className="button button-small">Sales dashboard</Link>
          <Link href="/" className="button button-outline button-small">Back to Lumio</Link>
        </div>
      </div>
      <Alert error={error} />

      <div className="stat-grid">
        <div className="stat-card"><small>Users</small><strong>{users.length}</strong></div>
        <div className="stat-card"><small>Courses</small><strong>{courses.length}</strong></div>
        <div className="stat-card"><small>Orders</small><strong>{orders.length}</strong></div>
        <div className="stat-card"><small>Reviews</small><strong>{reviews.length}</strong></div>
      </div>

      <section className="panel">
        <h2 style={{ marginBottom: 14 }}>Accounts</h2>
        <table className="data-table">
          <thead><tr><th>Account</th><th>Role</th><th>Joined</th><th>Activity</th><th /></tr></thead>
          <tbody>{users.map((user) => (
            <tr key={user.id}>
              <td><strong>{user.firstName} {user.lastName}</strong><div className="small-note">{user.email}</div></td>
              <td>{user.role.toLowerCase()}</td>
              <td>{user.createdAt.toLocaleDateString()}</td>
              <td>{user._count.enrollments} enrollments · {user._count.courses} courses</td>
              <td>{user.role !== "ADMIN" && <form action={toggleUserBlock}><input type="hidden" name="userId" value={user.id} /><button className="button button-outline button-small">{user.blocked ? "Unblock" : "Block"}</button></form>}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      <section className="panel">
        <h2 style={{ marginBottom: 14 }}>Courses</h2>
        <table className="data-table">
          <thead><tr><th>Course</th><th>Instructor</th><th>Students</th><th>Status</th><th /></tr></thead>
          <tbody>{courses.map((course) => (
            <tr key={course.id}>
              <td><Link className="text-link" href={`/courses/${course.slug}`}>{course.title}</Link></td>
              <td>{course.instructor.firstName} {course.instructor.lastName}</td>
              <td>{course._count.enrollments}</td>
              <td>{course.status.toLowerCase()}</td>
              <td><form action={setCourseVisibility}><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="status" value={course.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED"} /><button className="button button-outline button-small">{course.status === "PUBLISHED" ? "Hide" : "Publish"}</button></form></td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      <section className="panel">
        <h2 style={{ marginBottom: 14 }}>Latest orders and payments</h2>
        <table className="data-table">
          <thead><tr><th>Order</th><th>Student</th><th>Course</th><th>Amount</th><th>Payment reference</th><th>Status</th></tr></thead>
          <tbody>{orders.map((order) => (
            <tr key={order.id}>
              <td>#{order.id.slice(-7).toUpperCase()}</td><td>{order.user.email}</td><td>{order.course.title}</td><td>${order.amount}</td><td>{order.payment?.transactionId ?? "—"}</td><td>{order.status.toLowerCase()}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      <section className="panel">
        <h2 style={{ marginBottom: 14 }}>Latest reviews</h2>
        {reviews.slice(0, 12).map((review) => (
          <div className="course-row" key={review.id}>
            <div className="course-row-main"><strong>{review.user.username} · {review.course.title}</strong><div className="small-note">{"★".repeat(review.rating)} · {review.createdAt.toLocaleDateString()}</div></div>
          </div>
        ))}
        {!payments.length && <p className="small-note">No demo payments recorded yet.</p>}
      </section>
    </main>
  );
}
