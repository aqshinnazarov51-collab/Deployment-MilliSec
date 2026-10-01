import path from "node:path";

const avatarFilenamePattern = /^[a-f0-9-]{36}\.(?:jpg|png|webp|gif)$/i;

export function getAvatarUploadDir() {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (!configured) {
    return process.env.NODE_ENV === "production"
      ? path.resolve("/var/lib/lumio/uploads")
      : path.resolve(process.cwd(), "public", "uploads");
  }
  return path.isAbsolute(configured)
    ? path.resolve(configured)
    : path.resolve(process.cwd(), configured);
}

export function getAvatarFilename(url: string | null | undefined) {
  if (!url) return null;
  const filename = url.startsWith("/api/uploads/")
    ? url.slice("/api/uploads/".length)
    : url.startsWith("/uploads/")
      ? url.slice("/uploads/".length)
      : "";
  return avatarFilenamePattern.test(filename) ? filename : null;
}

export function getAvatarUrl(filename: string) {
  return `/api/uploads/${filename}`;
}

export function getAvatarSrc(url: string | null | undefined) {
  const filename = getAvatarFilename(url);
  return filename ? getAvatarUrl(filename) : url ?? "";
}

export function getAvatarContentType(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  return extension === ".jpg" ? "image/jpeg" : `image/${extension.slice(1)}`;
}
