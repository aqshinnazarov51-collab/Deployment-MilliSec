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

function createErrorResponse() {
  return NextResponse.json({ error: "The profile could not be updated." }, { status: 500 });
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
  } catch {
    return redirectToProfile(`${profilePath}?error=Email+or+username+already+in+use`);
  }

  return redirectToProfile(`${profilePath}?saved=1`);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  let originHost = "";
  try {
    originHost = origin ? new URL(origin).host : "";
  } catch {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!host || !originHost || originHost !== host) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const user = await requireUser();
  const form = await req.formData();
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
  try {
    return await applyUpdate(user.id, user.role, data);
  } catch {
    return createErrorResponse();
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
