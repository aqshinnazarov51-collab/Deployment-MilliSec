import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return secret;
}

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}
function b64urlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function signJwt(payload: Record<string, any>) {
  const header = { alg: "HS256", typ: "JWT" };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", getSecret()).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${sig}`;
}

export function verifyJwt(token: string): Record<string, any> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  if (!/^[A-Za-z0-9_-]{43}$/.test(sig)) return null;
  let header: any;
  try { header = JSON.parse(b64urlDecode(h)); } catch { return null; }

  if (header.alg !== "HS256" || header.typ !== "JWT") return null;

  let expected: Buffer;
  let provided: Buffer;
  try {
    expected = createHmac("sha256", getSecret()).update(`${h}.${p}`).digest();
    provided = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) return null;

  try {
    const payload: unknown = JSON.parse(b64urlDecode(p));
    if (!payload || typeof payload !== "object") return null;
    const exp = (payload as { exp?: unknown }).exp;
    if (typeof exp !== "number" || !Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return null;
    return payload as Record<string, any>;
  } catch {
    return null;
  }
}
