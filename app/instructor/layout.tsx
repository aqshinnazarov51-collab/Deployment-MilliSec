import { requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
export default async function InstructorLayout({children}:{children:React.ReactNode}){await requireUser("INSTRUCTOR");return <DashboardShell role="INSTRUCTOR">{children}</DashboardShell>;}
