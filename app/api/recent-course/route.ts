import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serialize, deserialize } from "@/lib/recent";
import { withApiErrorBoundary } from "@/lib/api-error";
import { hasSameOrigin } from "@/lib/request-security";

export const POST = withApiErrorBoundary("recent-course POST", async (req: Request) => {
  if (!hasSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const courseId = typeof input.courseId === "string" ? input.courseId : "";
  const courseTitle = typeof input.courseTitle === "string" ? input.courseTitle : "";
  if (!courseId || courseId.length > 100 || !courseTitle || courseTitle.length > 200) {
    return NextResponse.json({ error: "courseId and courseTitle required" }, { status: 400 });
  }

  const payload = serialize({ courseId, courseTitle, viewedAt: Date.now() });
  const encoded = Buffer.from(payload, "utf-8").toString("base64");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("lumio_recent", encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
});

export const GET = withApiErrorBoundary("recent-course GET", async () => {
  const jar = await cookies();
  const raw = jar.get("lumio_recent")?.value;
  if (!raw) return NextResponse.json({ recent: null });
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const recent = deserialize(decoded);
    return NextResponse.json({ recent });
  } catch {
    return NextResponse.json({ recent: null });
  }
});
