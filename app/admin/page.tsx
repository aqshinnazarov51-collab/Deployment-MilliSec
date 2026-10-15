import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Activity, ArrowUpRight, BookOpen, CircleDollarSign, Clock3, Eye, ShieldCheck, Star, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toggleUserBlock, setCourseVisibility } from "@/actions/admin";
import { Alert } from "@/components/Message";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function date(value: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

const adminErrors: Record<string, string> = {
  cannot_block_self: "You cannot block your own account.",
  account_cannot_be_changed: "This account cannot be changed.",
  invalid_course_status: "The requested course status is invalid.",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  const errorMessage = error && Object.prototype.hasOwnProperty.call(adminErrors, error)
    ? adminErrors[error]
    : undefined;
  const paidWhere: Prisma.OrderWhereInput = { status: { in: ["COMPLETED", "PAID"] } };
  const [
    totalUsers, activeUsers, totalCourses, publishedCourses, totalOrders, paidOrderCount, revenue,
    users, courses, orders, reviews,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { blocked: false } }),
    db.course.count(),
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.order.count(),
    db.order.count({ where: paidWhere }),
    db.order.aggregate({ where: paidWhere, _sum: { amount: true } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, blocked: true, createdAt: true },
    }),
    db.course.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { instructor: { select: { firstName: true, lastName: true } }, _count: { select: { enrollments: true } } },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        course: { select: { title: true } },
        payment: { select: { status: true } },
      },
    }),
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { username: true } }, course: { select: { title: true } } },
    }),
  ]);

  return (
    <main className="admin-dashboard">
      <section className="admin-hero">
        <div>
          <div className="admin-kicker"><ShieldCheck size={15} /> LUMIO ADMINISTRATION</div>
          <h1>Operations overview</h1>
          <p>Manage accounts, course quality, sales, and learner feedback from one place.</p>
        </div>
        <div className="admin-hero-actions">
          <Link href="/admin/sales" className="button"><Activity size={15} /> Sales report <ArrowUpRight size={14} /></Link>
          <Link href="/" className="button button-outline"><Eye size={15} /> View site</Link>
        </div>
      </section>

      <Alert error={errorMessage} />

      <section className="admin-metrics" aria-label="Platform overview">
        <article className="admin-metric">
          <span className="admin-metric-icon metric-users"><Users size={18} /></span>
          <div><span className="admin-metric-label">Accounts</span><strong>{totalUsers.toLocaleString()}</strong><small>{activeUsers.toLocaleString()} active</small></div>
        </article>
        <article className="admin-metric">
          <span className="admin-metric-icon metric-courses"><BookOpen size={18} /></span>
          <div><span className="admin-metric-label">Published courses</span><strong>{publishedCourses.toLocaleString()}</strong><small>{totalCourses.toLocaleString()} total courses</small></div>
        </article>
        <article className="admin-metric">
          <span className="admin-metric-icon metric-orders"><Activity size={18} /></span>
          <div><span className="admin-metric-label">Successful orders</span><strong>{paidOrderCount.toLocaleString()}</strong><small>{totalOrders.toLocaleString()} total orders</small></div>
        </article>
        <article className="admin-metric">
          <span className="admin-metric-icon metric-revenue"><CircleDollarSign size={18} /></span>
          <div><span className="admin-metric-label">Recorded revenue</span><strong>{money(revenue._sum.amount ?? 0)}</strong><small>Completed payments</small></div>
        </article>
      </section>

      <div className="admin-section-heading">
        <div><div className="admin-kicker">PLATFORM MANAGEMENT</div><h2>Recent activity</h2></div>
        <span className="admin-live"><span /> Live database records</span>
      </div>

      <div className="admin-management-grid">
        <section className="panel admin-panel" id="accounts">
          <div className="panel-header"><div><h2>Recent accounts</h2><p className="admin-panel-copy">Review access and account status.</p></div><span className="admin-count">{totalUsers.toLocaleString()} total</span></div>
          {users.length ? <div className="admin-table-wrap"><table className="data-table admin-table">
            <thead><tr><th>Account</th><th>Role</th><th>Joined</th><th>Status</th><th /></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.firstName} {user.lastName}</strong><div className="small-note">{user.email}</div></td>
                <td><span className="admin-role">{user.role.toLowerCase()}</span></td>
                <td>{date(user.createdAt)}</td>
                <td><span className={"admin-state " + (user.blocked ? "state-blocked" : "state-active")}><span />{user.blocked ? "Blocked" : "Active"}</span></td>
                <td>{user.role !== "ADMIN" && <form action={toggleUserBlock}><input type="hidden" name="userId" value={user.id} /><button className="button button-outline button-small">{user.blocked ? "Restore" : "Block"}</button></form>}</td>
              </tr>
            ))}</tbody>
          </table></div> : <div className="admin-empty">No accounts have been created yet.</div>}
        </section>

        <section className="panel admin-panel" id="courses">
          <div className="panel-header"><div><h2>Course moderation</h2><p className="admin-panel-copy">Review visibility and enrollment activity.</p></div><span className="admin-count">{publishedCourses.toLocaleString()} live</span></div>
          {courses.length ? <div className="admin-table-wrap"><table className="data-table admin-table">
            <thead><tr><th>Course</th><th>Instructor</th><th>Students</th><th>Status</th><th /></tr></thead>
            <tbody>{courses.map((course) => (
              <tr key={course.id}>
                <td><Link className="text-link admin-course-link" href={"/courses/" + course.slug}>{course.title}</Link></td>
                <td>{course.instructor.firstName} {course.instructor.lastName}</td>
                <td>{course._count.enrollments.toLocaleString()}</td>
                <td><span className={"admin-state " + (course.status === "PUBLISHED" ? "state-active" : "state-draft")}><span />{course.status.toLowerCase()}</span></td>
                <td><form action={setCourseVisibility}><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="status" value={course.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED"} /><button className="button button-outline button-small">{course.status === "PUBLISHED" ? "Hide" : "Publish"}</button></form></td>
              </tr>
            ))}</tbody>
          </table></div> : <div className="admin-empty">No courses are available yet.</div>}
        </section>
      </div>

      <section className="panel admin-panel admin-orders" id="orders">
        <div className="panel-header"><div><h2>Latest orders</h2><p className="admin-panel-copy">Recent purchases and payment states.</p></div><Link href="/admin/sales" className="text-link">Open sales report <ArrowUpRight size={14} /></Link></div>
        {orders.length ? <div className="admin-table-wrap"><table className="data-table admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Course</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{orders.map((order) => (
            <tr key={order.id}>
              <td><code>#{order.id.slice(-7).toUpperCase()}</code></td>
              <td><strong>{order.user.firstName} {order.user.lastName}</strong><div className="small-note">{order.user.email}</div></td>
              <td>{order.course.title}</td>
              <td><span className="admin-date"><Clock3 size={13} />{date(order.createdAt)}</span></td>
              <td>{money(order.amount)}</td>
              <td><span className={"admin-state " + (order.status === "COMPLETED" || order.status === "PAID" ? "state-active" : "state-draft")}><span />{(order.payment?.status ?? order.status).toLowerCase()}</span></td>
            </tr>
          ))}</tbody>
        </table></div> : <div className="admin-empty">No orders have been recorded yet.</div>}
      </section>

      <section className="panel admin-panel admin-reviews" id="reviews">
        <div className="panel-header"><div><h2>Learner feedback</h2><p className="admin-panel-copy">Latest course reviews.</p></div><span className="admin-count">{reviews.length} recent</span></div>
        {reviews.length ? <div className="admin-review-list">{reviews.map((review) => (
          <article className="admin-review" key={review.id}>
            <span className="admin-review-icon"><Star size={16} /></span>
            <div><strong>{review.user.username} <span>on {review.course.title}</span></strong><div className="admin-stars" aria-label={review.rating + " out of 5 stars"}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div></div>
            <time>{date(review.createdAt)}</time>
          </article>
        ))}</div> : <div className="admin-empty">No learner reviews yet.</div>}
      </section>
    </main>
  );
}
