import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToR2 } from '@/lib/r2';

// 許可するファイルタイプ
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// ファイルサイズ上限 (2MB)
const MAX_SIZE = 2 * 1024 * 1024;

// MIMEタイプから拡張子を取得
function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  return extensions[mimeType] ?? 'bin';
}

// ランダムID生成
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * POST: 画像をアップロード
 *
 * Request: multipart/form-data
 * - file: 画像ファイル (PNG, JPEG, WebP)
 *
 * Response: { url: string }
 */
export async function POST(request: NextRequest) {
  // 認証チェック
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // FormDataを取得
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;

  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // ファイルタイプ検証
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: PNG, JPEG, WebP' },
      { status: 400 }
    );
  }

  // ファイルサイズ検証
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size: 2MB' }, { status: 400 });
  }

  // ファイルをBufferに変換
  const buffer = Buffer.from(await file.arrayBuffer());

  // ファイルパスを生成（ユーザーID + タイムスタンプ + ランダムID）
  const ext = getExtension(file.type);
  const key = `cards/${session.user.id}/${Date.now()}-${generateId()}.${ext}`;

  try {
    // R2にアップロード
    const url = await uploadToR2(key, buffer, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Failed to upload image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
