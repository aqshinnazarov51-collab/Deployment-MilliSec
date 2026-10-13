import Link from "next/link";
import { redirect } from "next/navigation";
import { adminLoginAction } from "@/actions/auth";
import { Alert } from "@/components/Message";
import { getUser } from "@/lib/auth";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (user?.role === "ADMIN") redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="form-page">
      <section className="form-card">
        <div className="eyebrow">Lumio administration</div>
        <h1>Administrator sign in</h1>
        <p>Use an administrator account to continue to the operations dashboard.</p>
        <Alert error={error} />
        <form action={adminLoginAction}>
          <div className="field"><label htmlFor="admin-email">Email</label><input id="admin-email" required name="email" type="email" autoComplete="username" /></div>
          <div className="field"><label htmlFor="admin-password">Password</label><input id="admin-password" required name="password" type="password" autoComplete="current-password" /></div>
          <label className="small-note" style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 18px" }}><input type="checkbox" name="remember" defaultChecked /> Keep me signed in for 30 days</label>
          <button className="button full">Log in to admin</button>
        </form>
        <p className="small-note" style={{ textAlign: "center", marginTop: 18 }}><Link className="text-link" href="/login">Return to standard sign in</Link></p>
      </section>
    </main>
  );
}
