import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const COOKIE = "lumio_session";
function hash(token: string) { const secret=process.env.AUTH_SECRET;if(!secret||secret.length<32)throw new Error("AUTH_SECRET must contain at least 32 characters");return createHmac("sha256",secret).update(token).digest("hex"); }
export async function createSession(userId: string, remember = true) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + (remember ? 30 : 1) * 86400000);
  await db.session.create({ data: { userId, tokenHash: hash(token), expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", expires:expiresAt });
}
export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where:{ tokenHash:hash(token) }, include:{ user:{ include:{ profile:true, settings:true } } } });
  if (!session || session.expiresAt < new Date() || session.user.blocked) return null;
  return session.user;
}
export async function requireUser(role?: "STUDENT" | "INSTRUCTOR" | "ADMIN") {
  const user = await getUser();
  if (!user) redirect("/login");
  if (role && user.role !== role && user.role !== "ADMIN") redirect(user.role === "INSTRUCTOR" ? "/instructor" : "/student");
  return user;
}
export async function clearSession() {
  const jar = await cookies(); const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where:{ tokenHash:hash(token) } });
  jar.delete(COOKIE);
}
export function homeForRole(role: string) { return role === "INSTRUCTOR" ? "/instructor" : role === "ADMIN" ? "/admin" : "/student"; }
