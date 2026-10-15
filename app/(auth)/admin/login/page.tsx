import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { adminLoginAction } from "@/actions/auth";
import { Alert } from "@/components/Message";
import { getUser } from "@/lib/auth";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (user?.role === "ADMIN") redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <Link href="/" className="admin-auth-brand" aria-label="Lumio home">
          <span>L</span> Lumio
        </Link>
        <div className="admin-auth-icon"><ShieldCheck size={22} /></div>
        <div className="admin-kicker">SECURE ADMINISTRATION</div>
        <h1>Welcome back</h1>
        <p className="admin-auth-intro">Sign in with your administrator account to manage the Lumio platform.</p>
        <Alert error={error} />
        <form action={adminLoginAction} className="admin-auth-form">
          <div className="field">
            <label htmlFor="admin-email">Administrator email</label>
            <input id="admin-email" required name="email" type="email" autoComplete="username" />
          </div>
          <div className="field">
            <div className="admin-password-label">
              <label htmlFor="admin-password">Password</label>
              <Link className="text-link" href="/forgot-password">Forgot password?</Link>
            </div>
            <input id="admin-password" required name="password" type="password" autoComplete="current-password" />
          </div>
          <label className="admin-remember">
            <input type="checkbox" name="remember" />
            Keep me signed in for 30 days
          </label>
          <button className="button full admin-login-button"><LockKeyhole size={15} /> Sign in to admin</button>
        </form>
        <div className="admin-auth-note"><ShieldCheck size={14} /> Administrator access is restricted and protected by sign-in rate limits.</div>
        <Link href="/login" className="admin-auth-back"><ArrowLeft size={14} /> Return to standard sign in</Link>
      </section>
    </main>
  );
}
