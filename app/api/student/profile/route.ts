import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { emailSchema } from "@/lib/validation";

function val(v: string | null) {
  const t = (v ?? "").trim();
  return t || null;
}

function profilePathFor(role: string) {
  return role === "INSTRUCTOR" ? "/instructor/profile" : "/student/profile";
}

function redirectToProfile(path: string) {
  // Keep Location relative to the browser's public origin. Using req.url here
  // can expose an internal localhost URL when deployed behind an AWS proxy.
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}

async function applyUpdate(userId: string, role: string, data: Record<string, string | null>) {
  const firstName = (data.firstName ?? "").trim();
  const lastName = (data.lastName ?? "").trim();
  const username = (data.username ?? "").trim();
  const email = emailSchema.safeParse(data.email);
  const profilePath = profilePathFor(role);

  if (!firstName || firstName.length > 50 || !lastName || lastName.length > 50 ||
      username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9_.-]+$/.test(username) ||
      !email.success) {
    return redirectToProfile(`${profilePath}?error=Check+the+required+fields`);
  }

  const profileData = {
    phone: val(data.phone),
    bio: val(data.bio),
    city: val(data.city),
    country: val(data.country),
    website: val(data.website),
    socialLinks: val(data.socialLinks),
  };

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        username,
        email: email.data,
        profile: { upsert: { create: profileData, update: profileData } },
      },
    });
  } catch {
    return redirectToProfile(`${profilePath}?error=Email+or+username+already+in+use`);
  }

  return redirectToProfile(`${profilePath}?saved=1`);
}

// VULN: CSRF — mirrors actions/account.ts updateProfile, but as a
// plain route handler (POST + GET). No anti-CSRF token, no origin check.
export async function POST(req: NextRequest) {
  const user = await requireUser();
  const form = await req.formData();
  const data = {
    firstName: form.get("firstName") as string | null,
    lastName: form.get("lastName") as string | null,
    username: form.get("username") as string | null,
    email: form.get("email") as string | null,
    phone: form.get("phone") as string | null,
    bio: form.get("bio") as string | null,
    city: form.get("city") as string | null,
    country: form.get("country") as string | null,
    website: form.get("website") as string | null,
    socialLinks: form.get("socialLinks") as string | null,
  };
  return applyUpdate(user.id, user.role, data);
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const sp = req.nextUrl.searchParams;
  const data = {
    firstName: sp.get("firstName"),
    lastName: sp.get("lastName"),
    username: sp.get("username"),
    email: sp.get("email"),
    phone: sp.get("phone"),
    bio: sp.get("bio"),
    city: sp.get("city"),
    country: sp.get("country"),
    website: sp.get("website"),
    socialLinks: sp.get("socialLinks"),
  };
  return applyUpdate(user.id, user.role, data);
}
