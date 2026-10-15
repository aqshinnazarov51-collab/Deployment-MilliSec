import assert from "node:assert/strict";
import { test } from "node:test";
import { SAFE_ERROR_MESSAGE, withApiErrorBoundary } from "../../lib/api-error";
import { hasSameOrigin } from "../../lib/request-security";
import { sendPasswordResetEmail } from "../../lib/resend-email";

function request(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { method: "POST", headers });
}

test("accepts a valid same-origin API request", () => {
  assert.equal(
    hasSameOrigin(request("https://lumio.test/api/profile", {
      host: "lumio.test",
      origin: "https://lumio.test",
    })),
    true,
  );
});

test("rejects missing, malformed, and cross-origin values", () => {
  assert.equal(hasSameOrigin(request("https://lumio.test/api/profile", { host: "lumio.test" })), false);
  assert.equal(
    hasSameOrigin(request("https://lumio.test/api/profile", { host: "lumio.test", origin: "not an origin" })),
    false,
  );
  assert.equal(
    hasSameOrigin(request("https://lumio.test/api/profile", {
      host: "lumio.test",
      origin: "https://attacker.test",
    })),
    false,
  );
  assert.equal(
    hasSameOrigin(request("https://lumio.test/api/profile", {
      host: "lumio.test",
      origin: "http://lumio.test",
    })),
    false,
  );
});

test("uses the public forwarded host and protocol behind a reverse proxy", () => {
  assert.equal(
    hasSameOrigin(request("http://next-internal:3000/api/profile", {
      host: "next-internal:3000",
      "x-forwarded-host": "lumio.test",
      "x-forwarded-proto": "https",
      origin: "https://lumio.test",
    })),
    true,
  );
});

test("API errors return a neutral response and do not log exception details", async () => {
  const originalError = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => logged.push(args);

  try {
    const route = withApiErrorBoundary("security test", async () => {
      throw new Error("secret token and C:\\private\\project\\file.ts:123");
    });
    const response = await route();
    const responseText = await response.text();
    const logText = JSON.stringify(logged);

    assert.equal(response.status, 500);
    assert.ok(responseText.includes(SAFE_ERROR_MESSAGE));
    assert.doesNotMatch(responseText, /secret token|private|file\.ts/);
    assert.doesNotMatch(logText, /secret token|private|file\.ts/);
  } finally {
    console.error = originalError;
  }
});

test("password reset mail has a fixed HTTPS destination and rejects redirects", async () => {
  const originalFetch = globalThis.fetch;
  const destinations: string[] = [];
  let redirectMode: RequestRedirect | undefined;
  globalThis.fetch = async (input, init) => {
    destinations.push(String(input));
    redirectMode = init?.redirect;
    return new Response(null, { status: 200 });
  };

  try {
    for (const resetUrl of [
      "http://127.0.0.1/",
      "http://2130706433/",
      "http://0177.0.0.1/",
      "http://[::1]/",
      "http://169.254.169.254/latest/meta-data",
      "http://10.0.0.1/",
      "http://rebind.test/",
    ]) {
      await sendPasswordResetEmail({
        apiKey: "test-only-key",
        from: "no-reply@example.test",
        to: "user@example.test",
        resetUrl,
      });
    }
    assert.deepEqual(destinations, Array(7).fill("https://api.resend.com/emails"));
    assert.equal(redirectMode, "error");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
