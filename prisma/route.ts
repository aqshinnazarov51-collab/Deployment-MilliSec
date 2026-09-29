import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // ZƏİFLİK (Path Traversal): İstifadəçidən gələn filename sanitize edilmədən path.join olunur.
    // Hücumçu "../../../etc/passwd" kimi yollar göndərərək sistem fayllarını oxuya bilər.
    const filePath = path.join(process.cwd(), 'public', filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    return NextResponse.json({ success: true, content: fileContent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
