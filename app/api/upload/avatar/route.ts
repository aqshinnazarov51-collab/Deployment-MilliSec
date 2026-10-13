import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAvatarFilename, getAvatarUploadDir, getAvatarUrl } from "@/lib/avatar-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 128 * 1024;
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

function isStoragePermissionError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && ["EACCES", "EPERM", "EROFS"].includes(String(error.code)));
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

async function removeStoredAvatar(url: string | null | undefined) {
  const filename = getAvatarFilename(url);
  if (filename) await unlink(path.join(getAvatarUploadDir(), filename)).catch(() => {});
}

export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof getUser>>;
  try {
    user = await getUser();
  } catch (error) {
    console.error("Avatar upload authentication failed", error);
    return errorResponse("The upload service is temporarily unavailable. Please try again.", 500);
  }
  if (!user) return errorResponse("Sign in to update your profile photo.", 401);

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_SIZE) {
    return errorResponse("Choose an image under 2 MB.", 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.error("Avatar upload request could not be parsed", error);
    return errorResponse("The upload request could not be read. Choose an image under 2 MB and try again.", 400);
  }

  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_SIZE || !extensions[file.type]) {
    return errorResponse("Choose a JPG, PNG, WebP, or GIF image under 2 MB.", 400);
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(await file.arrayBuffer());
  } catch (error) {
    console.error("Avatar upload data could not be read", error);
    return errorResponse("The image could not be read. Please choose it again and retry.", 400);
  }
  if (!validImage(bytes, file.type)) return errorResponse("This image file could not be verified.", 400);

  const filename = `${randomUUID()}.${extensions[file.type]}`;
  const uploadDir = getAvatarUploadDir();
  const target = path.join(uploadDir, filename);
  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(target, bytes, { flag: "wx" });

    const previous = await db.profile.findUnique({ where: { userId: user.id }, select: { avatarUrl: true } });
    const url = getAvatarUrl(filename);
    await db.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, avatarUrl: url },
      update: { avatarUrl: url },
    });
    await removeStoredAvatar(previous?.avatarUrl);
    return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await unlink(target).catch(() => {});
    console.error("Avatar upload could not be saved", { userId: user.id, uploadDir, error });
    const message = isStoragePermissionError(error)
      ? "The server cannot write to the upload folder. Please contact support."
      : "The photo could not be saved. Please try again.";
    return errorResponse(message, 500);
  }
}

export async function DELETE() {
  let user: Awaited<ReturnType<typeof getUser>>;
  try {
    user = await getUser();
  } catch (error) {
    console.error("Avatar removal authentication failed", error);
    return errorResponse("The profile service is temporarily unavailable. Please try again.", 500);
  }
  if (!user) return errorResponse("Authentication required.", 401);

  try {
    const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { avatarUrl: true } });
    await db.profile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: { avatarUrl: null } });
    await removeStoredAvatar(profile?.avatarUrl);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Avatar could not be removed", { userId: user.id, error });
    return errorResponse("The photo could not be removed. Please try again.", 500);
  }
}
