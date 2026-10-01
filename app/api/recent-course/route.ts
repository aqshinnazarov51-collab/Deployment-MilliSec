import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serialize, deserialize } from "@/lib/recent";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const courseId = String(body.courseId ?? "");
  const courseTitle = String(body.courseTitle ?? "");
  if (!courseId || !courseTitle) {
    return NextResponse.json({ error: "courseId and courseTitle required" }, { status: 400 });
  }
  const payload = serialize({ courseId, courseTitle, viewedAt: Date.now() });
  const encoded = Buffer.from(payload, "utf-8").toString("base64");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("lumio_recent", encoded, { httpOnly: false, path: "/" });
  return res;
}

export async function GET() {
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
}
