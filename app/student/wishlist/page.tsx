import Link from "next/link";
import { Heart } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CourseCard } from "@/components/CourseCard";
import { EmptyState } from "@/components/EmptyState";

export default async function WishlistPage() {
  const user = await requireUser("STUDENT");
  const items = await db.wishlist.findMany({
    where: { userId: user.id },
    include: { course: { include: { category: true, instructor: true, sections: { select: { lessons: { select: { durationMinutes: true } } } }, _count: { select: { enrollments: true, sections: true, reviews: true } }, reviews: { select: { rating: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return <>
    <div className="page-title-row"><div><div className="eyebrow">Saved for later</div><h1>Your favorites</h1><p>Courses you’re curious about, all in one place.</p></div></div>
    {items.length ? <div className="course-grid">{items.map((item) => <CourseCard key={item.id} course={item.course} wishlisted />)}</div>
      : <div className="panel"><EmptyState icon={Heart} title="Save a course for another day" action={{ href: "/catalog", label: "Explore courses" }}>Tap the heart on any course to keep it close for later.</EmptyState></div>}
  </>;
}
