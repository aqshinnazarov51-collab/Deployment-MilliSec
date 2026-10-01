import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { signJwt } from "@/lib/jwt";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const token = signJwt({ sub: user.id, role: user.role, email: user.email });
  return NextResponse.json({ token });
}