import { requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
export default async function StudentLayout({children}:{children:React.ReactNode}){await requireUser("STUDENT");return <DashboardShell role="STUDENT">{children}</DashboardShell>;}
