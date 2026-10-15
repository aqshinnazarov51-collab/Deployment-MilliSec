import Link from "next/link";
import { requestPasswordResetAction } from "@/actions/password-reset";
import { Alert } from "@/components/Message";

type SearchParams = Promise<{ error?: string; sent?: string; devResetUrl?: string }>;

export default async function ForgotPassword({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const devResetHref = getDevelopmentResetHref(params.devResetUrl);
  return (
    <main className="form-page">
      <section className="form-card">
        <div className="eyebrow">Account recovery</div>
        <h1>Reset your password.</h1>
        <p>Enter the email address for your Lumio account. If it is registered, we’ll send a reset link.</p>
        {params.sent ? <Alert success="If that email is registered, a password reset link has been sent." /> : <Alert error={params.error} />}
        {devResetHref && process.env.NODE_ENV !== "production" && (
          <div className="success-note" role="status" style={{ marginBottom: 16 }}>
            Development link (shown only on your local server): <Link className="text-link" href={devResetHref}>Reset password</Link>
          </div>
        )}
        <form action={requestPasswordResetAction}>
          <div className="field">
            <label htmlFor="reset-email">Email</label>
            <input id="reset-email" required name="email" type="email" autoComplete="email" />
          </div>
          <button className="button full">Send reset link</button>
        </form>
        <p className="small-note" style={{ textAlign: "center", marginTop: 18 }}>
          Remember your password? <Link className="text-link" href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

function getDevelopmentResetHref(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const token = url.searchParams.get("token");
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.hash ||
      url.pathname !== "/reset-password" ||
      url.searchParams.size !== 1 ||
      !token ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return null;
    }

    // Keep the link on this application even if the query string contains
    // an absolute URL. Never pass an untrusted scheme through to an anchor.
    return `/reset-password?token=${encodeURIComponent(token)}`;
  } catch {
    return null;
  }
}
