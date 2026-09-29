import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// VULN: CSRF — state-changing GET request, no anti-CSRF token check.
export async function GET(req: NextRequest) {
  const user = await requireUser();
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  await db.user.update({ where: { id: user.id }, data: { email } });
  return NextResponse.redirect(new URL("/student/profile?saved=1", req.url));
}
