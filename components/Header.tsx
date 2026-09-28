import Link from "next/link";
import { Bell } from "lucide-react";
import { CartButton } from "@/components/Cart";
import { CategoryMenu } from "@/components/CategoryMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBox } from "@/components/SearchBox";
import { ActiveLink } from "@/components/ActiveLink";
import { logoutAction } from "@/actions/auth";
import { markNotificationRead } from "@/actions/learning";
import { db } from "@/lib/db";
import type { getUser } from "@/lib/auth";

type User = NonNullable<Awaited<ReturnType<typeof getUser>>>;

export async function Header({ user }: { user: User | null }) {
  const [notices, categories] = await Promise.all([
    user ? db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }) : Promise.resolve([]),
    db.category.findMany({ where: { slug: { in: ["programming", "devops", "web-development", "mobile-development"] }, courses: { some: { status: "PUBLISHED" } } }, select: { name: true, slug: true, _count: { select: { courses: { where: { status: "PUBLISHED" } } } } }, orderBy: { name: "asc" } }),
  ]);
  const home = user?.role === "INSTRUCTOR" ? "/instructor" : user?.role === "ADMIN" ? "/admin" : "/student";
  const profile = user?.role === "INSTRUCTOR" ? "/instructor/profile" : user?.role === "ADMIN" ? "/admin" : "/student/profile";

  return <header className="topbar"><div className="topbar-inner">
    <Link href="/" className="brand"><span className="brand-mark">L</span>lumio</Link>
    <SearchBox />
    <nav className="nav-links" aria-label="Main navigation">
      <CategoryMenu categories={categories} />
      <CartButton />
      <ThemeToggle dark={user?.settings?.theme === "dark"} loggedIn={!!user} />
      {user ? <>
        <ActiveLink href={home} exact className="nav-main-link">{user.role === "ADMIN" ? "Admin console" : "My learning"}</ActiveLink>
        <details className="notification-menu">
          <summary className="icon-button" aria-label="Notifications"><Bell size={17} />{notices.some((notice) => !notice.readAt) && <span className="notification-dot" />}</summary>
          <div className="notification-panel"><strong className="notification-title">Notifications</strong>
            {notices.length ? notices.map((notice) => <div key={notice.id} className={`notification-item ${notice.readAt ? "is-read" : ""}`}><b>{notice.title}</b><div>{notice.body}</div>{!notice.readAt && <form action={markNotificationRead}><input type="hidden" name="notificationId" value={notice.id} /><button className="text-link notification-mark-read">Mark read</button></form>}</div>) : <p className="small-note notification-empty">You’re all caught up.</p>}
          </div>
        </details>
        <ActiveLink href={profile} className="button button-outline button-small nav-profile-link">{user.firstName}</ActiveLink>
        <form action={logoutAction}><button className="button button-small">Log out</button></form>
      </> : <><ActiveLink href="/login" className="nav-main-link">Log in</ActiveLink><Link href="/register" className="button button-small">Get started</Link></>}
    </nav>
  </div></header>;
}
