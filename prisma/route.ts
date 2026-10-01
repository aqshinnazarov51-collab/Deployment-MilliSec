import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // ZƏİFLİK (SSRF): İstifadəçidən gələn URL heç bir yoxlamadan keçmədən fetch olunur
    const response = await fetch(url);
    const data = await response.text();

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
