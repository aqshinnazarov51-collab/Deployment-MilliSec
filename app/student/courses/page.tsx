import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { BookOpenCheck } from "lucide-react";

export default async function MyCourses() {
  const user = await requireUser("STUDENT");
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          instructor: true,
          sections: {
            orderBy: { position: "asc" },
            include: { lessons: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
    orderBy: { lastActivityAt: "desc" },
  });

  const rows = await Promise.all(
    enrollments.map(async (enrollment) => {
      const lessons = enrollment.course.sections.flatMap((section) => section.lessons);
      const lessonIds = lessons.map((lesson) => lesson.id);
      const completedRows = lessonIds.length
        ? await db.lessonProgress.findMany({
            where: { userId: user.id, lessonId: { in: lessonIds }, completed: true },
            select: { lessonId: true },
          })
        : [];
      const completed = new Set(completedRows.map((row) => row.lessonId));
      const nextLesson = lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons[0];
      const percent = lessonIds.length
        ? Math.round((completed.size / lessonIds.length) * 100)
        : 0;

      return { enrollment, lessons, completed: completed.size, nextLesson, percent };
    }),
  );

  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">Your library</div>
          <h1>My courses</h1>
          <p>All the things you’ve started learning, in one place.</p>
        </div>
      </div>

      {rows.length ? (
        <div className="panel">
          <table className="data-table">
            <thead><tr><th>Course</th><th>Progress</th><th>Last activity</th><th /></tr></thead>
            <tbody>
              {rows.map(({ enrollment, lessons, completed, nextLesson, percent }) => (
                <tr key={enrollment.id}>
                  <td>
                    <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                      <span className="course-thumb" style={{ background: (enrollment.course.thumbnail ?? "✦|#edf0ff").split("|")[1] }}>
                        {(enrollment.course.thumbnail ?? "✦|").split("|")[0]}
                      </span>
                      <div>
                        <strong>{enrollment.course.title}</strong>
                        <div className="small-note">{enrollment.course.instructor.firstName} {enrollment.course.instructor.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ minWidth: 150 }}>
                    {completed} / {lessons.length} lessons · {percent}%
                    <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
                  </td>
                  <td>{enrollment.lastActivityAt.toLocaleDateString()}</td>
                  <td>
                    <Link className="button button-quiet button-small" href={`/student/courses/${enrollment.courseId}/learn/${nextLesson?.id ?? ""}`}>
                      {percent === 100 ? "Review" : "Continue"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel"><EmptyState icon={BookOpenCheck} title="Your course library is waiting" action={{ href: "/catalog", label: "Explore courses" }}>Find a course that catches your interest and your learning space will appear here.</EmptyState></div>
      )}
    </>
  );
}
