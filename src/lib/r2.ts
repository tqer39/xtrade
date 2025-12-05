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
