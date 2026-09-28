"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ActiveLink({ href, children, className = "", exact = false }: { href: string; children: React.ReactNode; className?: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  return <Link href={href} className={`${className}${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>{children}</Link>;
}
