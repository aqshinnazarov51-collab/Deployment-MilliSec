import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  let user: Awaited<ReturnType<typeof getUser>>;
  try {
    user = await getUser();
  } catch (error) {
    console.error("Admin stats authentication failed", error);
    return NextResponse.json({ error: "The admin report is temporarily unavailable" }, { status: 500, headers });
  }
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401, headers });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Administrator access required" }, { status: 403, headers });

  try {
    const users = await db.user.findMany({
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ message: "Welcome, admin.", userCount: users.length, users }, { headers });
  } catch (error) {
    console.error("Admin stats request failed", error);
    return NextResponse.json({ error: "The admin report is temporarily unavailable" }, { status: 500, headers });
  }
}
