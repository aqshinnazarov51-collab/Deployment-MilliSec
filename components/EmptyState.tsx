import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children: React.ReactNode; action?: { href: string; label: string } }) {
  return <div className="empty-state empty-state-visual">
    <span className="empty-state-art"><span className="empty-state-orbit" /><Icon size={25} strokeWidth={1.7} /></span>
    <strong>{title}</strong>
    <span className="empty-state-copy">{children}</span>
    {action && <Link className="button button-small" href={action.href}>{action.label}</Link>}
  </div>;
}
