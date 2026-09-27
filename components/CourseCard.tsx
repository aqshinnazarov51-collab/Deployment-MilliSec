import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { toggleWishlist } from "@/actions/courses";
import { AddToCart } from "@/components/Cart";
import { getSalePrice } from "@/lib/course-pricing";
import { getCourseCover } from "@/lib/course-covers";
import { getCatalogContent, getCourseBadge } from "@/lib/catalog-content";

type CourseView = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: number;
  thumbnail: string | null;
  level: string;
  category: { name: string };
  instructor: { firstName: string; lastName: string };
  _count: { enrollments: number; sections: number; reviews: number };
  reviews: { rating: number }[];
  sections?: { lessons: { durationMinutes: number }[] }[];
};

export function CourseCard({ course, wishlisted = false }: { course: CourseView; wishlisted?: boolean }) {
  const content = getCatalogContent(course.slug);
  const rating = content?.rating ?? (course.reviews.length
    ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
    : 0);
  const minutes = content?.durationMinutes ?? course.sections?.flatMap((section) => section.lessons)
    .reduce((sum: number, lesson) => sum + lesson.durationMinutes, 0) ?? 0;
  const duration = minutes
    ? `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60 ? `${minutes % 60}m` : ""}`.trim()
    : `${course._count.sections} sections`;
  const lessonCount = content?.lessons ?? course.sections?.reduce((sum: number, section) => sum + section.lessons.length, 0);
  const price = getSalePrice(course.price, course.slug);
  const badge = getCourseBadge(course.slug);

  return (
    <article className="course-card">
      <div className="course-art course-art-photo">
        <img className="course-art-image" src={getCourseCover(course.slug)} alt={`${course.title} course cover photo`} loading="lazy" />
        {badge && <span className={`course-badge course-badge-${badge.toLowerCase()}`}>{badge}</span>}
        <form action={toggleWishlist}>
          <input type="hidden" name="courseId" value={course.id} />
          <button className={`heart ${wishlisted ? "heart-active" : ""}`} title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}>
            <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </form>
      </div>
      <div className="course-body">
        <div className="course-category">{course.category.name}</div>
        <Link href={`/courses/${course.slug}`}><h3 className="course-title">{course.title}</h3></Link>
        <p className="course-subtitle">{course.subtitle}</p>
        <div className="course-meta">
          <span><strong><Star size={12} fill="currentColor" style={{ display: "inline", verticalAlign: "-2px" }} /> {rating ? rating.toFixed(1) : "New"}</strong> ({content?.reviews ?? course._count.reviews})</span>
          <span>{(content?.learners ?? Math.max(course._count.enrollments,course._count.reviews)).toLocaleString()} learners</span>
        </div>
        <div className="course-meta" style={{ marginTop: 0 }}>
          <span>{lessonCount ?? "—"} lessons</span><span>{duration}</span>
        </div>
        <div className="course-foot">
          <div><div className="course-price">{course.price === 0 ? "Free" : <>{price.original && <s className="old-price">${price.original}</s>}<strong>${price.current}</strong></>}</div><div className="course-instructor">{content?.instructor.join(" ") ?? `${course.instructor.firstName} ${course.instructor.lastName}`}</div></div>
          <div className="course-card-actions"><AddToCart item={{id:course.id,slug:course.slug,title:course.title,price:price.current,cover:getCourseCover(course.slug)}}/><Link href={`/courses/${course.slug}`} className="button button-quiet button-small">View course</Link></div>
        </div>
      </div>
    </article>
  );
}
