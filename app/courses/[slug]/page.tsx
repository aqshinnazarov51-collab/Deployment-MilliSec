import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenCheck, Clock3, Globe2, GraduationCap, Heart, PlayCircle, Star, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { reviewCourse } from "@/actions/learning";
import { toggleWishlist } from "@/actions/courses";
import { Alert } from "@/components/Message";
import { EmptyState } from "@/components/EmptyState";
import { getCourseCover } from "@/lib/course-covers";
import { getCatalogContent } from "@/lib/catalog-content";
import { getSalePrice } from "@/lib/course-pricing";
import { getAvatarSrc } from "@/lib/avatar-storage";
import { ProfileAvatar } from "@/components/ProfileAvatar";

export default async function CoursePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; reviewed?: string }> }) {
  const [{ slug }, search, user] = await Promise.all([params, searchParams, getUser()]);
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      category: true,
      instructor: { include: { profile: true } },
      sections: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } },
      _count: { select: { enrollments: true } },
      reviews: { include: { user: { include: { profile: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!course || course.status !== "PUBLISHED") notFound();

  const lessons = course.sections.flatMap((section) => section.lessons);
  const content = getCatalogContent(course.slug);
  const sale = getSalePrice(course.price, course.slug);
  const rating = content?.rating ?? (course.reviews.length ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length : 0);
  const reviewCount = content?.reviews ?? course.reviews.length;
  const learners = content?.learners ?? course._count.enrollments;
  const totalMinutes = content?.durationMinutes ?? lessons.reduce((sum: number, lesson) => sum + lesson.durationMinutes, 0);
  const duration = totalMinutes ? `${Math.floor(totalMinutes / 60) ? `${Math.floor(totalMinutes / 60)}h ` : ""}${totalMinutes % 60 ? `${totalMinutes % 60}m` : ""}`.trim() : "Self-paced";
  const instructorName = content?.instructor.join(" ") ?? `${course.instructor.firstName} ${course.instructor.lastName}`;
  const [enrollment, favorite] = user ? await Promise.all([
    db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }),
    user.role === "STUDENT" ? db.wishlist.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : Promise.resolve(null),
  ]) : [null, null];
  const averageRating = course.reviews.length ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length : rating;

  return <>
    <section className="course-detail-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(12,19,37,.91) 0%,rgba(12,19,37,.78) 46%,rgba(12,19,37,.22) 100%),url("${getCourseCover(course.slug)}")` }}>
      <div className="shell course-detail-hero-inner">
        <div className="course-detail-copy-column">
          <div className="course-detail-eyebrow">{course.category.name}<span>·</span>{course.level.toLowerCase()}</div>
          <h1>{course.title}</h1>
          <p>{course.subtitle} {course.description}</p>
          <div className="course-detail-rating"><span className="rating-stars">{"★".repeat(Math.round(averageRating))}{"☆".repeat(5 - Math.round(averageRating))}</span><strong>{averageRating ? averageRating.toFixed(1) : "New"}</strong><span>({reviewCount.toLocaleString()} reviews)</span><span className="course-rating-dot">·</span><span>{learners.toLocaleString()} learners</span></div>
        <Link href={`/educators/${course.instructor.username}`} className="course-instructor-hero"><ProfileAvatar className="instructor-photo" src={course.instructor.profile?.avatarUrl ? getAvatarSrc(course.instructor.profile.avatarUrl) : null} name={`${course.instructor.firstName} ${course.instructor.lastName}`} /><span><small>Created by</small><strong>{instructorName}</strong></span><span className="instructor-verified"><BookOpenCheck size={14} /> Lumio educator</span></Link>
          <div className="course-hero-facts"><span><PlayCircle size={15} />{content?.lessons ?? lessons.length} lessons</span><span><Clock3 size={15} />{duration}</span><span><Globe2 size={15} />{course.language}</span><span><GraduationCap size={15} />Lifetime access</span></div>
        </div>
      </div>
    </section>

    <main className="shell course-detail-layout">
      <article className="course-detail-main">
        <section className="panel course-outcomes"><div className="eyebrow">Course overview</div><h2>What you’ll learn</h2><p>A practical, project-based path from curious beginner to confident practitioner. Lessons are designed to give you an idea and a way to use it.</p><div className="outcome-grid"><span><BookOpenCheck size={16} />Build practical skills with guided exercises</span><span><BookOpenCheck size={16} />Apply each concept to a real project</span><span><BookOpenCheck size={16} />Learn at a pace that works for you</span><span><BookOpenCheck size={16} />Keep access to lessons and updates</span></div></section>

        <section className="panel course-curriculum-panel"><div className="course-section-heading"><div><div className="eyebrow">Step by step</div><h2>Course curriculum</h2></div><span className="curriculum-total">{course.sections.length} sections <span>·</span> {content?.lessons ?? lessons.length} lessons <span>·</span> {duration}</span></div><div className="curriculum">{course.sections.map((section, sectionIndex) => <div key={section.id}><div className="curriculum-section course-curriculum-section"><span className="section-number">{String(sectionIndex + 1).padStart(2, "0")}</span><strong>{section.title}</strong><span className="small-note">{section.lessons.length} lessons</span></div>{section.lessons.map((lesson, lessonIndex) => <div className="lesson-line course-lesson-line" key={lesson.id}><span><span className="lesson-index">{String(lessonIndex + 1).padStart(2, "0")}</span><PlayCircle size={15} />{lesson.title}</span><small><Clock3 size={12} /> {lesson.durationMinutes} min</small></div>)}</div>)}</div></section>

        <section className="course-reviews-section"><div className="course-section-heading"><div><div className="eyebrow">Learner feedback</div><h2>Reviews</h2></div><div className="review-summary"><strong>{averageRating ? averageRating.toFixed(1) : "New"}</strong><span className="rating-stars">{"★".repeat(Math.round(averageRating))}{"☆".repeat(5 - Math.round(averageRating))}</span><small>{reviewCount.toLocaleString()} reviews</small></div></div>
          {user && enrollment && !course.reviews.some((review) => review.userId === user.id) && <div className="panel review-form-card"><form action={reviewCourse}><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="slug" value={course.slug} /><div className="field"><label>Your rating</label><select name="rating" defaultValue="5"><option value="5">★★★★★ — Loved it</option><option value="4">★★★★ — Really good</option><option value="3">★★★ — Good</option><option value="2">★★ — Could be better</option><option value="1">★ — Not for me</option></select></div><div className="field"><label>Your review</label><textarea name="text" required maxLength={1500} placeholder="What did you find useful?" /></div><button className="button button-small">Share review</button></form></div>}
          <Alert error={search.error} success={search.reviewed} />
        {course.reviews.length ? course.reviews.map((review) => <div key={review.id} className="panel learner-review"><ProfileAvatar className="reviewer-avatar" src={review.user.profile?.avatarUrl ? getAvatarSrc(review.user.profile.avatarUrl) : null} name={`${review.user.firstName} ${review.user.lastName}`} /><div className="reviewer-content"><div className="reviewer-name-row"><strong>{review.user.firstName} {review.user.lastName}</strong>{review.user.email.endsWith("@reviewer.lumio.demo") && <span className="pill pill-gray">Lumio community</span>}</div><div className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} <span>{review.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span></div><p>{review.text}</p></div></div>) : <div className="panel"><EmptyState icon={Star} title="Be the first to share a review">Learner feedback will appear here as the Lumio community takes this course.</EmptyState></div>}
        </section>
      </article>

      <aside className="course-detail-aside"><div className="purchase-card course-purchase-card"><div className="course-purchase-cover"><img src={getCourseCover(course.slug)} alt={`${course.title} course cover`} /></div><div className="course-price-large">{course.price === 0 ? "Free" : <>{sale.original && <s className="old-price">${sale.original}</s>}<strong>${sale.current}</strong></>}</div><p className="course-purchase-note">One-time payment · Lifetime access</p>{enrollment ? <Link href={`/student/courses/${course.id}/learn`} className="button full">Continue learning <ArrowRight size={15} /></Link> : <Link href={user ? `/checkout/${course.id}` : `/login?next=/checkout/${course.id}`} className="button full">{course.price === 0 ? "Enroll for free" : "Get this course"} <ArrowRight size={15} /></Link>}{user?.role === "STUDENT" && <form action={toggleWishlist} className="course-save-form"><input type="hidden" name="courseId" value={course.id} /><button className="button button-outline full" type="submit"><Heart size={15} fill={favorite ? "currentColor" : "none"} />{favorite ? "Saved to favorites" : "Save to favorites"}</button></form>}<div className="purchase-includes"><strong>This course includes</strong><span><PlayCircle size={14} />{content?.lessons ?? lessons.length} on-demand lessons</span><span><Clock3 size={14} />{duration} total length</span><span><Globe2 size={14} />Learn from any device</span><span><GraduationCap size={14} />Certificate on completion</span></div></div></aside>
    </main>
  </>;
}
