import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAvatarContentType, getAvatarFilename, getAvatarUploadDir } from "@/lib/avatar-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename: requestedFilename } = await params;
  const filename = getAvatarFilename(`/api/uploads/${requestedFilename}`);
  if (!filename) return new NextResponse("Not found", { status: 404 });

  try {
    const bytes = await readFile(path.join(getAvatarUploadDir(), filename));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": getAvatarContentType(filename),
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
