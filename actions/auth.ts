"use server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, clearSession, homeForRole } from "@/lib/auth";
import { emailSchema, registerSchema } from "@/lib/validation";
import {
  clearAccountLoginFailures,
  getLoginRateLimitContext,
  isLoginRateLimited,
  recordLoginFailure,
} from "@/lib/rate-limit";

const unavailableMessage = "Sign in is temporarily unavailable. Please try again.";

async function getRateLimitContext(email: string, path: string) {
  try {
    const context = await getLoginRateLimitContext(email);
    return { context, blocked: await isLoginRateLimited(context) };
  } catch {
    redirect(`${path}?error=${encodeURIComponent(unavailableMessage)}`);
  }
}

async function registerFailedLogin(context: Awaited<ReturnType<typeof getLoginRateLimitContext>>, path: string) {
  try {
    await recordLoginFailure(context);
  } catch {
    redirect(`${path}?error=${encodeURIComponent(unavailableMessage)}`);
  }
}

async function clearFailedLogin(context: Awaited<ReturnType<typeof getLoginRateLimitContext>>, path: string) {
  try {
    await clearAccountLoginFailures(context);
  } catch {
    redirect(`${path}?error=${encodeURIComponent(unavailableMessage)}`);
  }
}

export async function registerAction(form: FormData) {
  const data = Object.fromEntries(form.entries());
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const v = parsed.data;
  // The public form cannot choose a privileged role; new accounts are always learners.
  try {
    const passwordHash = await bcrypt.hash(v.password, 12);
    const user = await db.user.create({ data: { email: v.email, username: v.username, firstName: v.firstName, lastName: v.lastName, role: "STUDENT", passwordHash, profile: { create: {} }, settings: { create: {} } } });
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

  const { context, blocked } = await getRateLimitContext(email.data, "/login");
  if (blocked) redirect(`/login?error=${encodeURIComponent("Too many attempts. Try again in a few minutes.")}`);

  let user;
  let valid = false;
  try {
    user = await db.user.findUnique({ where: { email: email.data } });
    valid = Boolean(user && !user.blocked && await bcrypt.compare(password, user.passwordHash));
  } catch {
    redirect(`/login?error=${encodeURIComponent(unavailableMessage)}`);
  }
  if (!valid || !user) {
    await registerFailedLogin(context, "/login");
    redirect(`/login?error=${encodeURIComponent("Email or password is incorrect")}`);
  }

  await clearFailedLogin(context, "/login");
  await createSession(user.id, form.get("remember") === "on");
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : homeForRole(user.role));
}

export async function adminLoginAction(form: FormData) {
  const email = emailSchema.safeParse(form.get("email"));
  const password = String(form.get("password") ?? "");
  if (!email.success || !password) redirect(`/admin/login?error=${encodeURIComponent("Enter a valid email and password")}`);

  const { context, blocked } = await getRateLimitContext(email.data, "/admin/login");
  if (blocked) redirect(`/admin/login?error=${encodeURIComponent("Too many attempts. Try again in a few minutes.")}`);

  let user;
  let valid = false;
  try {
    user = await db.user.findUnique({ where: { email: email.data } });
    valid = Boolean(user && user.role === "ADMIN" && !user.blocked && await bcrypt.compare(password, user.passwordHash));
  } catch {
    redirect(`/admin/login?error=${encodeURIComponent(unavailableMessage)}`);
  }
  if (!valid || !user) {
    await registerFailedLogin(context, "/admin/login");
    redirect(`/admin/login?error=${encodeURIComponent("Email or password is incorrect")}`);
  }

  await clearFailedLogin(context, "/admin/login");
  await createSession(user.id, form.get("remember") === "on");
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
