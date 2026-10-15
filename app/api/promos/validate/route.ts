import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createSafeQuote } from "@/lib/promo-codes";
import { withApiErrorBoundary } from "@/lib/api-error";

export const POST = withApiErrorBoundary("promo validation POST", async (request: Request) => {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to apply a promo code." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const code = typeof input.code === "string" ? input.code : "";
  const rawCourseIds: unknown[] = Array.isArray(input.courseIds) ? input.courseIds : [];
  const courseIds: string[] = [...new Set(rawCourseIds.filter((id): id is string => typeof id === "string"))].slice(0, 50);
  if (!courseIds.length) return NextResponse.json({ error: "No courses to price." }, { status: 400 });

  const quote = await createSafeQuote(code, courseIds);
  if (!quote) {
    return NextResponse.json(
      { error: "That promo code is invalid, inactive, expired, or does not apply to these courses." },
      { status: 400 },
    );
  }
  return NextResponse.json(quote);
});
