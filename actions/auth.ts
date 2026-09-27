"use server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, clearSession, homeForRole } from "@/lib/auth";
import { emailSchema, registerSchema } from "@/lib/validation";

const attempts = new Map<string, { count:number; reset:number }>();
export async function registerAction(form: FormData) {
  const data = Object.fromEntries(form.entries());
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const v = parsed.data;
  // Public sign-up can create learner or instructor accounts, never administrators.
  try {
    const passwordHash = await bcrypt.hash(v.password, 12);
    const user = await db.user.create({ data:{ email:v.email, username:v.username, firstName:v.firstName, lastName:v.lastName, role:v.role, passwordHash, profile:{ create:{} }, settings:{ create:{} } } });
    await createSession(user.id);
    redirect(homeForRole(user.role));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(`/register?error=${encodeURIComponent("That email or username is already in use")}`);
  }
}
export async function loginAction(form: FormData) {
  const email = emailSchema.safeParse(form.get("email"));
  const password = String(form.get("password") ?? "");
  if (!email.success || !password) redirect(`/login?error=${encodeURIComponent("Enter a valid email and password")}`);
  const now=Date.now(), key=email.data;
  const attempt=attempts.get(key);
  if (attempt && attempt.reset>now && attempt.count>=8) redirect(`/login?error=${encodeURIComponent("Too many attempts. Try again in a few minutes.")}`);
  const user=await db.user.findUnique({where:{email:email.data}});
  const valid=user && !user.blocked && await bcrypt.compare(password,user.passwordHash);
  if (!valid || !user) { attempts.set(key,{count:(attempt?.reset??0)>now?(attempt?.count??0)+1:1,reset:now+10*60_000}); redirect(`/login?error=${encodeURIComponent("Email or password is incorrect")}`); }
  attempts.delete(key);
  await createSession(user.id, form.get("remember") === "on");
  const next=String(form.get("next")??"");
  redirect(next.startsWith("/")&&!next.startsWith("//")&&!next.includes("\\")?next:homeForRole(user.role));
}
export async function logoutAction() { await clearSession(); redirect("/"); }
