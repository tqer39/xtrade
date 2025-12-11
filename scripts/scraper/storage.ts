/**
 * CloudFlare R2 ストレージユーティリティ
 */

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import type { UploadResult } from './types';

/**
 * R2 クライアントを作成
 */
function createR2Client(): S3Client {
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 credentials not configured. Required: CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY'
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // MinIO はパススタイルのアクセスが必要
    forcePathStyle: true,
  });
}

/**
 * 画像バッファからハッシュベースのキーを生成
 */
export function generateImageKey(
  buffer: Buffer,
  options: {
    prefix?: string;
    extension?: string;
  } = {}
): string {
  const { prefix = 'cards', extension = 'png' } = options;
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  return `${prefix}/${hash}.${extension}`;
}

/**
 * 画像を R2 にアップロード
 */
export async function uploadImageToR2(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/png'
): Promise<UploadResult> {
  const client = createR2Client();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET || 'xtrade-card-images-dev';
  const customDomain =
    process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN || 'card-images.xtrade-dev.tqer39.dev';

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1年キャッシュ
    })
  );

  // ローカル開発時は http、本番は https
  const protocol = customDomain.startsWith('localhost') ? 'http' : 'https';

  return {
    key,
    url: `${protocol}://${customDomain}/${key}`,
    size: buffer.length,
  };
}

/**
 * 画像をダウンロードして R2 にアップロード
 */
export async function mirrorImageToR2(
  sourceUrl: string,
  buffer: Buffer,
  options: {
    prefix?: string;
    format?: 'png' | 'jpeg';
  } = {}
): Promise<UploadResult> {
  const { prefix = 'cards', format = 'png' } = options;

  const key = generateImageKey(buffer, { prefix, extension: format });
  const contentType = format === 'png' ? 'image/png' : 'image/jpeg';

  return uploadImageToR2(buffer, key, contentType);
}
