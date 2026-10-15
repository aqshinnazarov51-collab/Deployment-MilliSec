import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const userAgent = (req.headers.get("user-agent") ?? "unknown").slice(0, 512);
  const { pathname } = new URL(req.url);

  await db.analyticsEvent.create({ data: { userAgent, path: pathname.slice(0, 2048) } });

  return NextResponse.json({ ok: true });
}
