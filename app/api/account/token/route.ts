import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { signJwt } from "@/lib/jwt";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = signJwt({ sub: user.id, role: user.role, email: user.email, iat: issuedAt, exp: issuedAt + 15 * 60 });
  return NextResponse.json({ token });
}
