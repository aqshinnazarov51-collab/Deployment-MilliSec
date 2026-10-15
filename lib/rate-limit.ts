import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { db } from "@/lib/db";

const WINDOW_MS = 10 * 60 * 1000;
const ACCOUNT_IP_LIMIT = 8;
const IP_LIMIT = 60;

export type LoginRateLimitContext = {
  ipKey: string;
  accountIpKey: string;
};

type Bucket = { count: number; windowStartedAt: Date; blockedUntil: Date | null };

function digest(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function getLoginRateLimitContext(email: string): Promise<LoginRateLimitContext> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for") ?? "";
  const forwardedIps = forwarded.split(",").map((value) => value.trim()).filter((value) => isIP(value));
  const realIp = requestHeaders.get("x-real-ip")?.trim() ?? "";
  const ip = forwardedIps.at(-1) ?? (isIP(realIp) ? realIp : "unknown");
  return {
    ipKey: digest(`login-ip:${ip}`),
    accountIpKey: digest(`login-account-ip:${email}:${ip}`),
  };
}

async function readBucket(key: string) {
  const rows = await db.$queryRaw<Bucket[]>`
    SELECT "count", "windowStartedAt", "blockedUntil"
    FROM "RateLimitBucket"
    WHERE "key" = ${key}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

function isBlocked(bucket: Bucket | null, limit: number, now: number) {
  if (!bucket) return false;
  if (bucket.blockedUntil && bucket.blockedUntil.getTime() > now) return true;
  return bucket.windowStartedAt.getTime() > now - WINDOW_MS && bucket.count >= limit;
}

export async function isLoginRateLimited(context: LoginRateLimitContext) {
  const now = Date.now();
  const [ipBucket, accountBucket] = await Promise.all([
    readBucket(context.ipKey),
    readBucket(context.accountIpKey),
  ]);
  return isBlocked(ipBucket, IP_LIMIT, now) || isBlocked(accountBucket, ACCOUNT_IP_LIMIT, now);
}

async function recordFailure(key: string, limit: number, now: Date) {
  const cutoff = new Date(now.getTime() - WINDOW_MS);
  const blockedUntil = new Date(now.getTime() + WINDOW_MS);
  await db.$executeRaw`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowStartedAt", "blockedUntil", "updatedAt")
    VALUES (${key}, 1, ${now}, NULL, ${now})
    ON CONFLICT("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."windowStartedAt" <= ${cutoff} THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "windowStartedAt" = CASE WHEN "RateLimitBucket"."windowStartedAt" <= ${cutoff} THEN ${now} ELSE "RateLimitBucket"."windowStartedAt" END,
      "blockedUntil" = CASE
        WHEN (CASE WHEN "RateLimitBucket"."windowStartedAt" <= ${cutoff} THEN 1 ELSE "RateLimitBucket"."count" + 1 END) >= ${limit}
        THEN ${blockedUntil}
        ELSE NULL
      END,
      "updatedAt" = ${now}
    WHERE "RateLimitBucket"."blockedUntil" IS NULL OR "RateLimitBucket"."blockedUntil" <= ${now}
  `;
}

export async function recordLoginFailure(context: LoginRateLimitContext) {
  const now = new Date();
  await recordFailure(context.ipKey, IP_LIMIT, now);
  await recordFailure(context.accountIpKey, ACCOUNT_IP_LIMIT, now);
  await db.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "updatedAt" < ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}`;
}

export async function clearAccountLoginFailures(context: LoginRateLimitContext) {
  await db.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "key" = ${context.accountIpKey}`;
}
