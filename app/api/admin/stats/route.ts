import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { withApiErrorBoundary } from "@/lib/api-error";

export const GET = withApiErrorBoundary("admin stats GET", async () => {
  const headers = { "Cache-Control": "private, no-store" };
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401, headers });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Administrator access required" }, { status: 403, headers });

  const users = await db.user.findMany({
    select: { id: true, email: true, role: true, firstName: true, lastName: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ message: "Welcome, admin.", userCount: users.length, users }, { headers });
});
