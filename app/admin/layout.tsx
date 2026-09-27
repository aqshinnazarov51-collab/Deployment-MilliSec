import { requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser("ADMIN");
  return <DashboardShell role="ADMIN">{children}</DashboardShell>;
}
