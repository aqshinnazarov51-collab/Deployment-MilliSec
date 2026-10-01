import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenCheck, Globe2, GraduationCap, Star, Users } from "lucide-react";
import { db } from "@/lib/db";
import { CourseCard } from "@/components/CourseCard";
import { getAvatarSrc } from "@/lib/avatar-storage";
import { ProfileAvatar } from "@/components/ProfileAvatar";

export default async function EducatorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const educator = await db.user.findUnique({
    where: { username },
    include: {
      profile: true,
      courses: {
        where: { status: "PUBLISHED" },
        include: { category: true, instructor: true, sections: { select: { lessons: { select: { durationMinutes: true } } } }, _count: { select: { enrollments: true, sections: true, reviews: true } }, reviews: { select: { rating: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!educator || educator.role !== "INSTRUCTOR" || educator.blocked || educator.courses.length === 0) notFound();

  const allRatings = educator.courses.flatMap((course) => course.reviews.map((review) => review.rating));
  const average = allRatings.length ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length : 0;
  const reviewCount = educator.courses.reduce((sum, course) => sum + course._count.reviews, 0);
  const learners = educator.courses.reduce((sum, course) => sum + course._count.enrollments, 0);
  const topics = [...new Set(educator.courses.map((course) => course.category.name))];

  return <main className="educator-profile-page">
    <section className="educator-profile-hero"><div className="shell educator-profile-hero-inner">
      <Link href="/catalog" className="educator-back-link"><ArrowLeft size={14} /> Browse courses</Link>
      <div className="educator-profile-heading">
          <ProfileAvatar className="educator-profile-avatar" src={educator.profile?.avatarUrl ? getAvatarSrc(educator.profile.avatarUrl) : null} name={`${educator.firstName} ${educator.lastName}`} />
        <div className="educator-profile-intro"><div className="eyebrow">Lumio instructor</div><h1>{educator.firstName} {educator.lastName}</h1><p>{educator.profile?.bio || "Sharing practical ideas and helping learners build skills one lesson at a time."}</p>
          {educator.profile?.website && <a className="educator-website" href={educator.profile.website} target="_blank" rel="noreferrer"><Globe2 size={14} /> Personal website</a>}
        </div>
      </div>
      <div className="educator-profile-stats"><span><BookOpenCheck size={16} /><strong>{educator.courses.length}</strong> courses</span><span><Users size={16} /><strong>{learners.toLocaleString()}</strong> enrollments</span><span><Star size={16} fill="currentColor" /><strong>{average ? average.toFixed(1) : "New"}</strong> average rating <small>({reviewCount.toLocaleString()} reviews)</small></span><span><GraduationCap size={16} />{topics.slice(0, 3).join(" · ")}</span></div>
    </div></section>
    <section className="shell educator-courses-section"><div className="section-heading"><div><div className="eyebrow">Learn with {educator.firstName}</div><h2>Courses by this instructor</h2><p>Practical classes, made to help you put new skills to work.</p></div></div><div className="course-grid">{educator.courses.map((course) => <CourseCard key={course.id} course={course} />)}</div></section>
  </main>;
}
