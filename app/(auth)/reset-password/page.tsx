import Link from "next/link";
import { completePasswordResetAction } from "@/actions/password-reset";
import { Alert } from "@/components/Message";

type SearchParams = Promise<{ token?: string; error?: string }>;

export default async function ResetPassword({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = params.token ?? "";
  const tokenLooksValid = /^[a-f0-9]{64}$/.test(token);
  return (
    <main className="form-page">
      <section className="form-card">
        <div className="eyebrow">Account recovery</div>
        <h1>Choose a new password.</h1>
        <p>Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.</p>
        <Alert error={params.error} />
        {tokenLooksValid ? (
          <form action={completePasswordResetAction}>
            <input type="hidden" name="token" value={token} />
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input id="new-password" required name="password" type="password" minLength={8} maxLength={72} autoComplete="new-password" />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" required name="confirmPassword" type="password" minLength={8} maxLength={72} autoComplete="new-password" />
            </div>
            <button className="button full">Update password</button>
          </form>
        ) : (
          <div className="panel" style={{ padding: 16 }}>
            This reset link is missing or invalid. <Link className="text-link" href="/forgot-password">Request a new link</Link>.
          </div>
        )}
        <p className="small-note" style={{ textAlign: "center", marginTop: 18 }}>
          <Link className="text-link" href="/login">Back to log in</Link>
        </p>
      </section>
    </main>
  );
}
