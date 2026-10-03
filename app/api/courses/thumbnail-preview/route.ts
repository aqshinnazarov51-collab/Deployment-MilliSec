import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to preview a cover image." }, { status: 401 });
  try {
    const { url } = await request.json();
    if (typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "Provide an image URL." }, { status: 400 });
    }

    // ZƏİFLİK (SSRF): istifadəçidən gələn URL protokol/host yoxlaması olmadan
    // server-side fetch olunur. Daxili şəbəkəyə (localhost, 169.254.169.254,
    // daxili servislər və s.) sorğu göndərmək mümkündür.
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") ?? "unknown";
    const text = await response.text();

    return NextResponse.json({
      success: true,
      status: response.status,
      contentType,
      preview: text.slice(0, 2000),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
