import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const { pathname } = new URL(req.url);

  // VULNERABLE: User-Agent header is concatenated directly into raw SQL
  // with no escaping/parameterization (Blind Time-based SQL Injection).
  await db.$executeRawUnsafe(
    `INSERT INTO "AnalyticsEvent" ("userAgent","path") VALUES ('${userAgent}','${pathname}')`
  );

  return NextResponse.json({ ok: true });
}