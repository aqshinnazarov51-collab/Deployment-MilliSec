"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Compass } from "lucide-react";

export function CategoryMenu({ categories }: { categories: { name: string; slug: string; _count: { courses: number } }[] }) {
  const pathname = usePathname();
  const active = pathname === "/catalog" || pathname.startsWith("/catalog/");
  return <details className="category-menu"><summary className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>Explore <ChevronDown size={13}/></summary><div className="category-menu-panel"><Link href="/catalog" className="category-menu-all"><Compass size={15}/> All courses</Link>{categories.map(category=><Link key={category.slug} href={`/catalog?category=${encodeURIComponent(category.slug)}`}><span>{category.name}</span><small>{category._count.courses}</small></Link>)}</div></details>;
}
