import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

  const payload = verifyJwt(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await db.user.findMany({
    select: { id: true, email: true, role: true, firstName: true, lastName: true }
  });

  return NextResponse.json({
    message: "Welcome, admin.",
    userCount: users.length,
    users
  });
}