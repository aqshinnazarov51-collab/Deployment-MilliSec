"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { emailSchema, passwordSchema } from "@/lib/validation";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function requestPasswordResetAction(form: FormData) {
  const parsedEmail = emailSchema.safeParse(form.get("email"));
  if (!parsedEmail.success) {
    redirect(`/forgot-password?error=${encodeURIComponent("Enter a valid email address")}`);
  }

  const email = parsedEmail.data;
  const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true } });

  // Keep the public response identical for known and unknown email addresses.
  if (!user) redirect("/forgot-password?sent=1");

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (process.env.NODE_ENV === "production" && (!apiKey || !from)) {
    // Do not create a token that cannot be delivered in an unconfigured deployment.
    redirect("/forgot-password?sent=1");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt } });

  const isProduction = process.env.NODE_ENV === "production";
  const configuredBaseUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  const configuredLocalUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(configuredBaseUrl);
  const baseUrl = configuredBaseUrl && !(isProduction && configuredLocalUrl)
    ? configuredBaseUrl
    : isProduction ? "https://lumiocourse.site" : "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  let emailSent = false;

  if (apiKey && from) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [user.email],
          subject: "Reset your Lumio password",
          html: `<p>We received a request to reset your Lumio password.</p><p><a href="${resetUrl}">Choose a new password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`,
        }),
      });
      if (!response.ok) throw new Error(`Email service returned ${response.status}`);
      emailSent = true;
    } catch (error) {
      console.error("Password reset email could not be sent:", error instanceof Error ? error.message : "unknown error");
      if (process.env.NODE_ENV === "production") {
        await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
      }
    }
  }

  // A convenient reset link is exposed only on a local development server.
  if (process.env.NODE_ENV !== "production" && (!emailSent || !apiKey || !from)) {
    redirect(`/forgot-password?sent=1&devResetUrl=${encodeURIComponent(resetUrl)}`);
  }

  redirect("/forgot-password?sent=1");
}

export async function completePasswordResetAction(form: FormData) {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");

  if (!/^[a-f0-9]{64}$/.test(token)) redirect("/forgot-password?error=This+reset+link+is+invalid+or+expired");
  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(parsedPassword.error.issues[0].message)}`);
  }
  if (password !== confirmPassword) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent("Passwords do not match")}`);
  }

  const tokenHash = hashToken(token);
  const resetRecord = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!resetRecord || resetRecord.expiresAt <= new Date()) {
    redirect(`/forgot-password?error=${encodeURIComponent("This reset link is invalid or expired")}`);
  }

  const passwordHash = await bcrypt.hash(parsedPassword.data, 12);
  const changed = await db.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.deleteMany({
      where: { id: resetRecord.id, tokenHash, expiresAt: { gt: new Date() } },
    });
    if (consumed.count !== 1) return false;
    await tx.user.update({ where: { id: resetRecord.userId }, data: { passwordHash } });
    await tx.passwordResetToken.deleteMany({ where: { userId: resetRecord.userId } });
    await tx.session.deleteMany({ where: { userId: resetRecord.userId } });
    return true;
  });

  if (!changed) redirect(`/forgot-password?error=${encodeURIComponent("This reset link is invalid or expired")}`);
  redirect("/login?reset=1");
}
