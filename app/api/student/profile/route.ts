import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { emailSchema } from "@/lib/validation";
import { withApiErrorBoundary } from "@/lib/api-error";
import { hasSameOrigin } from "@/lib/request-security";

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

  const rawPhone = val(data.phone);
  const bio = val(data.bio);
  const city = val(data.city);
  const country = val(data.country);
  const website = val(data.website);
  const socialLinks = val(data.socialLinks);
  const tooLong = (value: string | null, limit: number) => Boolean(value && value.length > limit);
  let validWebsite = true;
  if (website) {
    try {
      const parsedWebsite = new URL(website);
      validWebsite = parsedWebsite.protocol === "http:" || parsedWebsite.protocol === "https:";
    } catch {
      validWebsite = false;
    }
  }
  if ((rawPhone && /[^0-9+\-\s()]/.test(rawPhone)) || !validWebsite ||
      tooLong(rawPhone, 30) || tooLong(bio, 1000) || tooLong(city, 100) ||
      tooLong(country, 100) || tooLong(website, 200) || tooLong(socialLinks, 1000)) {
    return redirectToProfile(`${profilePath}?error=Check+the+profile+fields`);
  }

  const profileData = { phone: rawPhone, bio, city, country, website, socialLinks };

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
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return redirectToProfile(`${profilePath}?error=Email+or+username+already+in+use`);
    }
    throw error;
  }

  return redirectToProfile(`${profilePath}?saved=1`);
}

export const POST = withApiErrorBoundary("student profile POST", async (req: NextRequest) => {
  if (!hasSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const user = await getUser();
  if (!user) return redirectToProfile("/login");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const formString = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : null;
  };
  const data = {
    firstName: formString("firstName"),
    lastName: formString("lastName"),
    username: formString("username"),
    email: formString("email"),
    phone: formString("phone"),
    bio: formString("bio"),
    city: formString("city"),
    country: formString("country"),
    website: formString("website"),
    socialLinks: formString("socialLinks"),
  };
  return applyUpdate(user.id, user.role, data);
});

export const GET = withApiErrorBoundary("student profile GET", async () =>
  NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } }),
);
