import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withApiErrorBoundary } from "@/lib/api-error";
import { hasSameOrigin } from "@/lib/request-security";

export const POST = withApiErrorBoundary("analytics", async (req: NextRequest) => {
  if (!hasSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const userAgent = (req.headers.get("user-agent") ?? "unknown").slice(0, 512);
  const { pathname } = new URL(req.url);
  await db.analyticsEvent.create({ data: { userAgent, path: pathname.slice(0, 2048) } });

  return NextResponse.json({ ok: true });
});
