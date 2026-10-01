import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createSafeQuote } from "@/lib/promo-codes";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to apply a promo code." }, { status: 401 });
  try {
    const body = await request.json();
    const code = typeof body.code === "string" ? body.code : "";
    const rawCourseIds: unknown[] = Array.isArray(body.courseIds) ? body.courseIds : [];
    const courseIds: string[] = [...new Set(rawCourseIds.filter((id): id is string => typeof id === "string"))].slice(0, 50);
    if (!courseIds.length) return NextResponse.json({ error: "No courses to price." }, { status: 400 });
    const quote = await createSafeQuote(code, courseIds);
    if (!quote) return NextResponse.json({ error: "That promo code is invalid, inactive, expired, or does not apply to these courses." }, { status: 400 });
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json({ error: "Could not check that promo code." }, { status: 400 });
  }
}
