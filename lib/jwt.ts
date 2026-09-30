import { createHmac } from "node:crypto";

const SECRET = process.env.AUTH_SECRET!;

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
  const sig = createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${sig}`;
}

export function verifyJwt(token: string): Record<string, any> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  let header: any;
  try { header = JSON.parse(b64urlDecode(h)); } catch { return null; }

  // УЯЗВИМОСТЬ: доверяем alg:"none" и пропускаем проверку подписи
  if (header.alg === "none") {
    try { return JSON.parse(b64urlDecode(p)); } catch { return null; }
  }

  const expected = createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
  if (expected !== sig) return null;
  try { return JSON.parse(b64urlDecode(p)); } catch { return null; }
}