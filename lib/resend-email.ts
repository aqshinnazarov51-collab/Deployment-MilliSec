const RESEND_EMAILS_URL = "https://api.resend.com/emails";

function escapeHtmlAttribute(value: string) {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => replacements[character]);
}

export async function sendPasswordResetEmail(input: {
  apiKey: string;
  from: string;
  to: string;
  resetUrl: string;
}) {
  const resetUrl = escapeHtmlAttribute(input.resetUrl);
  return fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: "Reset your Lumio password",
      html: `<p>We received a request to reset your Lumio password.</p><p><a href="${resetUrl}">Choose a new password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`,
    }),
  });
}
