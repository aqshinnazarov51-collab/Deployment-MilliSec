import { z } from "zod";
export const emailSchema = z.string().trim().email("Enter a valid email address").max(254).transform(v => v.toLowerCase());
export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_BYTES = 72;

const commonPasswords = new Set([
  "password", "password1", "password12", "password123", "password1234", "password12345",
  "passw0rd", "passw0rd1", "qwerty", "qwerty123", "qwerty123456", "qwertyuiop",
  "letmein", "letmein1", "welcome", "welcome1", "admin", "admin123", "administrator",
  "iloveyou", "abc123", "changeme", "default", "secret", "guest", "root", "login",
  "student123", "instructor123", "testing123", "test1234", "1234567890", "123456789012345",
  "1234567890123456", "000000000000000", "111111111111111",
]);
const commonPasswordPrefixes = [
  "password", "passw0rd", "qwerty", "letmein", "welcome", "admin", "administrator",
  "iloveyou", "changeme", "default", "secret", "guest", "root", "student", "instructor", "test",
];

function normalizePassword(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function isCommonPassword(value: string) {
  const normalized = normalizePassword(value);
  const predictableSequence = /^(?:1234567890|0123456789|9876543210|0987654321)+$/.test(normalized);
  const repeatedCharacter = /^(.)\1{14,}$/u.test(normalized);
  return predictableSequence || repeatedCharacter || commonPasswords.has(normalized) || commonPasswordPrefixes.some((prefix) =>
    new RegExp(`^(?:${prefix}){1,4}\\d{0,12}$`).test(normalized),
  );
}

export function passwordUsesAccountInfo(password: string, values: Array<string | null | undefined>) {
  const normalizedPassword = normalizePassword(password);
  return values
    .flatMap((value) => value ? [value, ...(value.includes("@") ? [value.split("@")[0]] : [])] : [])
    .map(normalizePassword)
    .some((value) => Array.from(value).length >= 4 && normalizedPassword.includes(value));
}

export const passwordSchema = z.string()
  .max(256, "Password is too long")
  .refine((value) => Array.from(value).length >= PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine((value) => Buffer.byteLength(value, "utf8") <= PASSWORD_MAX_BYTES, `Use no more than ${PASSWORD_MAX_BYTES} UTF-8 bytes`)
  .refine((value) => !isCommonPassword(value), "This password is too common. Choose a unique passphrase.");

export const registerSchema = z.object({ firstName:z.string().trim().min(1).max(50), lastName:z.string().trim().min(1).max(50), username:z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/), email:emailSchema, password:passwordSchema, confirmPassword:z.string() })
  .refine(v => v.password === v.confirmPassword, { path:["confirmPassword"], message:"Passwords do not match" })
  .refine(v => !passwordUsesAccountInfo(v.password, [v.email, v.username, v.firstName, v.lastName]), { path:["password"], message:"Do not include your name, username, or email in your password" });
const courseThumbnailSchema = z.string().trim().max(400).refine((value) => {
  if (/^.{1,12}\|#[0-9a-f]{6}$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use a preset cover or a valid HTTP/HTTPS image URL");

export const courseSchema = z.object({ title:z.string().trim().min(5).max(100), subtitle:z.string().trim().min(5).max(180), description:z.string().trim().min(30).max(6000), categoryId:z.string().min(1), level:z.enum(["BEGINNER","INTERMEDIATE","ADVANCED"]), language:z.string().trim().min(2).max(40), price:z.coerce.number().int().min(0).max(100000), status:z.enum(["DRAFT","PUBLISHED","HIDDEN"]), thumbnail:courseThumbnailSchema.optional(), sections:z.array(z.object({ title:z.string().trim().min(2).max(100), lessons:z.array(z.object({ title:z.string().trim().min(2).max(120), description:z.string().trim().max(1000).default(""), videoUrl:z.union([z.string().trim().url().refine(v=>v.startsWith("https://")||v.startsWith("http://"),"Video links must use HTTP or HTTPS"),z.literal("")]).optional(), durationMinutes:z.coerce.number().int().min(1).max(600) })).min(1) })).min(1) });
