import { requireAdmin } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <DashboardShell role="ADMIN">{children}</DashboardShell>;
}
