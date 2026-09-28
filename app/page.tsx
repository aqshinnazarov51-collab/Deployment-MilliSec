import Link from "next/link";
import { ArrowRight, Code2, Compass, Globe2, HeartHandshake, Server, Smartphone, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { CourseCard } from "@/components/CourseCard";
import { FeaturedCourseCarousel } from "@/components/FeaturedCourseCarousel";
import { getCourseCover } from "@/lib/course-covers";

const categoryIcons = {
  programming: Code2,
  devops: Server,
  "web-development": Globe2,
  "mobile-development": Smartphone,
} as const;

export default async function Home() {
  const [courses, categories, newest, educators] = await Promise.all([
    db.course.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true, instructor: true, sections: { select: { lessons: { select: { durationMinutes: true } } } }, _count: { select: { enrollments: true, sections: true, reviews: true } }, reviews: { select: { rating: true } } },
      orderBy: [{ enrollments: { _count: "desc" } }, { createdAt: "desc" }],
      take: 6,
    }),
    db.category.findMany({ include: { _count: { select: { courses: true } } } }),
    db.course.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true, instructor: true, sections: { select: { lessons: { select: { durationMinutes: true } } } }, _count: { select: { enrollments: true, sections: true, reviews: true } }, reviews: { select: { rating: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.user.findMany({ where: { role: "INSTRUCTOR", courses: { some: { status: "PUBLISHED" } } }, include: { profile: true, _count: { select: { courses: true } } }, take: 3 }),
  ]);

  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const featuredCover = courses[0] ? getCourseCover(courses[0].slug) : getCourseCover("practical-typescript");
  const featuredSlides = courses.length ? courses.map((course) => ({ slug: course.slug, title: course.title, subtitle: course.subtitle, cover: getCourseCover(course.slug), category: course.category.name })) : [{ slug: "practical-typescript", title: "Practical skills for your next step", subtitle: "Build confidence with a focused, hands-on course.", cover: featuredCover, category: "Lumio" }];

  return <>
    <section className="hero hero-showcase">
      <div className="shell hero-grid">
        <div className="hero-copy-block">
          <div className="eyebrow"><span className="eyebrow-dot" />Make room for what’s next</div>
          <h1>Learn something <em>that moves you forward.</em></h1>
          <p className="hero-copy">Explore practical courses, learn at your own pace, and turn your curiosity into skills you can use.</p>
          <div className="hero-actions">
            <Link href="/catalog" className="button">Start learning <ArrowRight size={16} /></Link>
            <Link href="/catalog" className="button button-outline">Explore courses</Link>
          </div>
          <div className="hero-proof"><div className="avatars"><span className="avatar-dot">JM</span><span className="avatar-dot">AR</span><span className="avatar-dot">SK</span><span className="avatar-dot">+</span></div><span><strong>A little progress adds up.</strong><br />Learn alongside a curious community.</span></div>
        </div>
        <FeaturedCourseCarousel slides={featuredSlides} />
      </div>
    </section>

    <section className="section category-showcase-section">
      <div className="shell">
        <div className="section-heading"><div><div className="eyebrow">Find your direction</div><h2>Explore by category</h2><p>Choose a path and find your next hands-on course.</p></div><Link href="/catalog" className="text-link">All courses <ArrowRight size={14} /></Link></div>
        <div className="category-showcase-grid">
          {(["programming", "devops", "web-development", "mobile-development"] as const).map((slug) => {
            const category = categoryBySlug.get(slug);
            if (!category) return null;
            const Icon = categoryIcons[slug];
            const matchingCourse = courses.find((course) => course.category.slug === slug);
            const cover = matchingCourse ? getCourseCover(matchingCourse.slug) : featuredCover;
            return <Link key={category.id} href={`/catalog?category=${encodeURIComponent(category.slug)}`} className="category-showcase-card" style={{ backgroundImage: `linear-gradient(180deg,rgba(11,18,35,.03) 8%,rgba(11,18,35,.8) 100%),url("${cover}")` }}>
              <span className="category-showcase-icon"><Icon size={19} /></span>
              <span className="category-showcase-copy"><strong>{category.name}</strong><small>{category._count.courses} courses to explore</small></span>
              <span className="category-showcase-arrow"><ArrowRight size={17} /></span>
            </Link>;
          })}
        </div>
      </div>
    </section>

    <section className="section section-soft">
      <div className="shell"><div className="section-heading"><div><div className="eyebrow">Most loved by learners</div><h2>Courses to get you moving</h2><p>Ideas worth your time, taught by people who love what they do.</p></div><Link href="/catalog" className="text-link">See everything <ArrowRight size={14} /></Link></div><div className="course-grid">{courses.slice(0, 3).map((course) => <CourseCard key={course.id} course={course} />)}</div></div>
    </section>

    <section className="section">
      <div className="shell"><div className="section-heading"><div><div className="eyebrow">Just added</div><h2>New ideas to explore</h2><p>Fresh courses from instructors in the Lumio community.</p></div><Link href="/catalog?sort=newest" className="text-link">See new courses <ArrowRight size={14} /></Link></div><div className="course-grid">{newest.map((course) => <CourseCard key={course.id} course={course} />)}</div></div>
    </section>

    <section className="section section-soft">
      <div className="shell"><div className="section-heading"><div><div className="eyebrow">Good teachers make a difference</div><h2>Meet your next favorite instructor</h2></div><Link href="/catalog" className="text-link">Find an educator <ArrowRight size={14} /></Link></div><div className="educator-grid">{educators.map((educator) => <Link key={educator.id} className="educator-card" href={`/educators/${educator.username}`}><span className="educator-avatar">{educator.profile?.avatarUrl ? <img src={educator.profile.avatarUrl} alt="" /> : `${educator.firstName[0]}${educator.lastName[0]}`}</span><strong>{educator.firstName} {educator.lastName}</strong><span className="small-note">{educator._count.courses} courses · Lumio educator</span><p className="small-note">{educator.profile?.bio ?? "Sharing practical ideas, one lesson at a time."}</p></Link>)}</div></div>
    </section>

    <section className="section">
      <div className="shell"><div className="section-heading"><div><div className="eyebrow">A better way to grow</div><h2>Learning that fits your life</h2></div></div><div className="feature-grid"><div className="feature"><div className="feature-icon"><Compass size={21} /></div><h3>Go at your own pace</h3><p>Short, focused lessons make it easy to learn in the time you have.</p></div><div className="feature"><div className="feature-icon"><Sparkles size={21} /></div><h3>Learn by doing</h3><p>Build real confidence with practical projects and useful examples.</p></div><div className="feature"><div className="feature-icon"><HeartHandshake size={21} /></div><h3>Keep what you learn</h3><p>Return to your courses, track progress, and celebrate each milestone.</p></div></div><div className="cta"><div><h2>Your next skill is closer than you think.</h2><p>Find a course that makes you curious. Start when you’re ready.</p></div><Link href="/catalog" className="button cta-button">Find your course <ArrowRight size={15} /></Link></div></div>
    </section>

    <footer className="footer"><div className="shell"><div className="footer-grid"><div><Link href="/" className="brand footer-brand"><span className="brand-mark">L</span>lumio</Link><p>Practical learning for curious people. Make space for something new.</p></div><div className="footer-links"><div><strong>Discover</strong><Link href="/catalog">Explore courses</Link><Link href="/register?role=INSTRUCTOR">Teach on Lumio</Link></div><div><strong>Your account</strong><Link href="/login">Log in</Link><Link href="/register">Create account</Link></div></div></div><div className="footer-bottom">© 2026 Lumio Learning. Made for the joy of getting better.</div></div></footer>
  </>;
}
