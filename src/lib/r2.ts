import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// R2 クライアント設定
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? '';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

// ファイルをR2にアップロード
export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

// 許可された画像MIMEタイプ
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// MIMEタイプから拡張子を取得
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  return mimeToExt[mimeType] ?? 'jpg';
}

// 外部URLから画像をダウンロードしてR2にアップロード
export async function uploadImageFromUrl(
  sourceUrl: string,
  key: string
): Promise<{ url: string; contentType: string; size: number }> {
  // 画像をダウンロード
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error(
      `Invalid image type: ${contentType}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`Image too large: ${buffer.length} bytes. Maximum: ${MAX_IMAGE_SIZE} bytes`);
  }

  // 拡張子を付与したキーを生成
  const extension = getExtensionFromMimeType(contentType);
  const finalKey = key.includes('.') ? key : `${key}.${extension}`;

  // R2にアップロード
  const url = await uploadToR2(finalKey, buffer, contentType);

  return { url, contentType, size: buffer.length };
}
