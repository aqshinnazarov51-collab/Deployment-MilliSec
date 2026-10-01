"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, LayoutDashboard, Compass, Heart, ShoppingBag, Award, UserRound, Settings, LogOut, PlusCircle, Users, BarChart3, Star, Menu, X, ShieldCheck, TicketPercent } from "lucide-react";
import { logoutAction } from "@/actions/auth";

const student = [["Dashboard", "/student", LayoutDashboard], ["My courses", "/student/courses", BookOpen], ["Browse courses", "/catalog", Compass], ["Favorites", "/student/wishlist", Heart], ["Orders", "/student/orders", ShoppingBag], ["Certificates", "/student/certificates", Award], ["Profile", "/student/profile", UserRound], ["Settings", "/student/settings", Settings]] as const;
const instructor = [["Dashboard", "/instructor", LayoutDashboard], ["My courses", "/instructor/courses", BookOpen], ["Create course", "/instructor/courses/new", PlusCircle], ["Promo codes", "/instructor/promos", TicketPercent], ["Students", "/instructor/students", Users], ["Sales", "/instructor/sales", BarChart3], ["Reviews", "/instructor/reviews", Star], ["Profile", "/instructor/profile", UserRound], ["Settings", "/instructor/settings", Settings]] as const;
const admin = [["Admin console", "/admin", ShieldCheck]] as const;

export function DashboardShell({ role, children }: { role: "STUDENT" | "INSTRUCTOR" | "ADMIN"; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = role === "STUDENT" ? student : role === "ADMIN" ? admin : instructor;
  return <div className="app-layout">
    <button onClick={() => setOpen(!open)} className="icon-button mobile-menu" style={{ position: "fixed", right: 14, bottom: 15, zIndex: 60 }} aria-label="Toggle menu">{open ? <X size={18} /> : <Menu size={18} />}</button>
    {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="sidebar-backdrop" />}
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="side-label">{role === "STUDENT" ? "Learning space" : role === "ADMIN" ? "Administration" : "Teaching space"}</div>
      <div className="side-nav">{links.map(([label, href, Icon]) => {
        const isRoot = href === "/student" || href === "/instructor";
        const active = pathname === href || (!isRoot && pathname.startsWith(`${href}/`));
        return <Link key={href + label} onClick={() => setOpen(false)} className={active ? "active" : ""} aria-current={active ? "page" : undefined} href={href}><Icon size={16} />{label}</Link>;
      })}</div>
      <div className="side-label">Account</div><div className="side-nav"><form action={logoutAction}><button><LogOut size={16} />Log out</button></form></div>
    </aside>
    <main className="dashboard-main">{children}</main>
  </div>;
}
