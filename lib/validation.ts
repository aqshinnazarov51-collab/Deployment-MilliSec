import { z } from "zod";
export const emailSchema = z.string().trim().email("Enter a valid email address").max(254).transform(v => v.toLowerCase());
export const passwordSchema = z.string().min(12, "Use at least 12 characters").max(72);
export const registerSchema = z.object({ firstName:z.string().trim().min(1).max(50), lastName:z.string().trim().min(1).max(50), username:z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/), email:emailSchema, password:passwordSchema, confirmPassword:z.string() }).refine(v => v.password === v.confirmPassword, { path:["confirmPassword"], message:"Passwords do not match" });
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
