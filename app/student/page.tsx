import Link from "next/link";
import { BookOpenCheck, PlayCircle, ReceiptText, Sparkles } from "lucide-react";
import { CourseCard } from "@/components/CourseCard";
import { LearningHabitCard } from "@/components/LearningHabitCard";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";

export default async function StudentHome() {
  const user = await requireUser("STUDENT");

  const [enrollments, orders, lessonCompletionRows, certificates, wishlist] =
    await Promise.all([
      db.enrollment.findMany({
        where: { userId: user.id },
        include: {
          course: {
            include: {
              category: true,
              instructor: true,
              sections: {
                orderBy: { position: "asc" },
                include: { lessons: { orderBy: { position: "asc" } } },
              },
              _count: { select: { enrollments: true, sections: true, reviews: true } },
              reviews: { select: { rating: true } },
            },
          },
        },
        orderBy: { lastActivityAt: "desc" },
      }),
      db.order.findMany({
        where: { userId: user.id },
        include: { course: true, payment: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      db.lessonProgress.findMany({ where: { userId: user.id, completed: true, completedAt: { not: null } }, select: { completedAt: true }, orderBy: { completedAt: "asc" } }),
      db.certificate.count({ where: { userId: user.id } }),
      db.wishlist.findMany({
        where: { userId: user.id },
        select: { courseId: true },
      }),
    ]);

  const lessonsCompleted = lessonCompletionRows.length;
  const completionDates = lessonCompletionRows.flatMap((row) => row.completedAt ? [row.completedAt.toISOString()] : []);

  const learned = new Set(enrollments.map((enrollment) => enrollment.courseId));
  const recommended = await db.course.findMany({
    where: { status: "PUBLISHED", id: { notIn: Array.from(learned) } },
    include: {
      category: true,
      instructor: true,
      sections: { select: { lessons: { select: { durationMinutes: true } } } },
      _count: { select: { enrollments: true, sections: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const coursesWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const lessonIds = enrollment.course.sections.flatMap((section) =>
        section.lessons.map((lesson) => lesson.id),
      );
      const done = lessonIds.length
        ? await db.lessonProgress.count({
            where: {
              userId: user.id,
              lessonId: { in: lessonIds },
              completed: true,
            },
          })
        : 0;

      return {
        ...enrollment,
        done,
        total: lessonIds.length,
        percent: lessonIds.length ? Math.round((done / lessonIds.length) * 100) : 0,
        nextLesson: enrollment.course.sections.flatMap((section) => section.lessons)[Math.min(done, Math.max(0, lessonIds.length - 1))] ?? null,
      };
    }),
  );

  const completedCourses = coursesWithProgress.filter((course) => course.percent === 100).length;

  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">Your learning space</div>
          <h1>Good to see you, {user.firstName}.</h1>
          <p>Every lesson is a little progress worth celebrating.</p>
        </div>
        <Link href="/catalog" className="button button-small"><Sparkles size={14} /> Find a course</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><small>Courses in progress</small><strong>{enrollments.length - completedCourses}</strong><span className="stat-change">Keep your momentum</span></div>
        <div className="stat-card"><small>Courses completed</small><strong>{completedCourses}</strong><span className="stat-change">{lessonsCompleted} lessons finished</span></div>
        <div className="stat-card"><small>Lessons completed</small><strong>{lessonsCompleted}</strong><span className="stat-change">One at a time adds up</span></div>
        <div className="stat-card"><small>Certificates earned</small><strong>{certificates}</strong><span className="stat-change">Ready to share</span></div>
      </div>

      <LearningHabitCard completedAt={completionDates} />

      {coursesWithProgress[0]?.nextLesson && <Link className="next-lesson-card" href={`/student/courses/${coursesWithProgress[0].courseId}/learn/${coursesWithProgress[0].nextLesson.id}`}>
        <span className="next-lesson-icon"><PlayCircle size={23} /></span><span className="next-lesson-copy"><small>UP NEXT · {coursesWithProgress[0].course.title}</small><strong>{coursesWithProgress[0].nextLesson.title}</strong><span>Continue where you left off</span></span><span className="next-lesson-action">Continue <PlayCircle size={15} /></span>
      </Link>}

      <div className="split">
        <section className="panel">
          <div className="panel-header"><h2>Pick up where you left off</h2><Link href="/student/courses" className="text-link">All my courses →</Link></div>
          {coursesWithProgress.length ? coursesWithProgress.slice(0, 4).map((course) => (
            <div className="course-row" key={course.id}>
              <div className="course-thumb" style={{ background: (course.course.thumbnail ?? "✦|#edf0ff").split("|")[1] }}>{(course.course.thumbnail ?? "✦|").split("|")[0]}</div>
              <div className="course-row-main"><strong>{course.course.title}</strong><small>{course.done} of {course.total} lessons · {course.percent}%</small><div className="progress-track"><span style={{ width: `${course.percent}%` }} /></div></div>
              <Link className="button button-quiet button-small" href={`/student/courses/${course.course.id}/learn`}>Continue</Link>
            </div>
          )) : (
            <EmptyState icon={BookOpenCheck} title="Your next chapter is waiting" action={{href:"/catalog",label:"Explore courses"}}>Choose a course to start learning at your own pace.</EmptyState>
          )}
        </section>

        <section className="panel">
          <div className="panel-header"><h2>Recent orders</h2><Link href="/student/orders" className="text-link">View all</Link></div>
          {orders.length ? orders.slice(0, 3).map((order) => (
            <div key={order.id} className="course-row"><span className="category-symbol"><BookOpenCheck size={16} /></span><div className="course-row-main"><strong>{order.course.title}</strong><small>{order.createdAt.toLocaleDateString()} · {order.payment?.transactionId}</small></div><span className="pill">${order.amount}</span></div>
          )) : (
            <EmptyState icon={ReceiptText} title="No orders yet">Your course purchases and receipts will show up here.</EmptyState>
          )}
        </section>
      </div>

      <section className="section" style={{ padding: "26px 0 0" }}>
        <div className="section-heading"><div><div className="eyebrow">A fresh idea</div><h2 style={{ fontSize: 22 }}>Made for your next curiosity</h2></div><Link href="/catalog" className="text-link">Browse all →</Link></div>
        <div className="course-grid">{recommended.map((course) => <CourseCard key={course.id} course={course} wishlisted={wishlist.some((item) => item.courseId === course.id)} />)}</div>
      </section>
    </>
  );
}
