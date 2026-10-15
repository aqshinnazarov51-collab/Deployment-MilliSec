import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const { pathname } = new URL(req.url);

  // FIXED: uses Prisma's parameterized query builder instead of raw SQL
  // string concatenation — values are safely escaped/bound, preventing SQLi.
  await db.analyticsEvent.create({
    data: {
      userAgent,
      path: pathname,
    },
  });

  return NextResponse.json({ ok: true });
}
