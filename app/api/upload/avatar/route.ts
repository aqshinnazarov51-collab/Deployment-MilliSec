import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAvatarFilename, getAvatarUploadDir, getAvatarUrl } from "@/lib/avatar-storage";

export const runtime = "nodejs";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function validImage(bytes: Buffer, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/gif") return bytes.subarray(0, 3).toString() === "GIF";
  if (type === "image/webp") return bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  return false;
}

async function removeStoredAvatar(url: string | null | undefined) {
  const filename = getAvatarFilename(url);
  if (filename) await unlink(path.join(getAvatarUploadDir(), filename)).catch(() => {});
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your profile photo" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0 || file.size > 2 * 1024 * 1024 || !extensions[file.type]) {
    return NextResponse.json({ error: "Choose an image under 2 MB" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!validImage(bytes, file.type)) {
    return NextResponse.json({ error: "This image file could not be verified" }, { status: 400 });
  }

  const filename = `${randomUUID()}.${extensions[file.type]}`;
  const uploadDir = getAvatarUploadDir();
  const target = path.join(uploadDir, filename);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(target, bytes, { flag: "wx" });

  try {
    const previous = await db.profile.findUnique({ where: { userId: user.id }, select: { avatarUrl: true } });
    const url = getAvatarUrl(filename);
    await db.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, avatarUrl: url },
      update: { avatarUrl: url },
    });
    await removeStoredAvatar(previous?.avatarUrl);
    return NextResponse.json({ url });
  } catch (error) {
    await unlink(target).catch(() => {});
    console.error("Avatar upload could not be saved:", error);
    return NextResponse.json({ error: "The photo could not be saved. Please try again." }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { avatarUrl: true } });
  await db.profile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: { avatarUrl: null } });
  await removeStoredAvatar(profile?.avatarUrl);
  return NextResponse.json({ ok: true });
}
