/**
 * 画像処理ユーティリティ
 * WebP → PNG 変換、リサイズなど
 *
 * 外部サイトへのアクセス対策:
 * - 指数バックオフ付きリトライ
 * - 適切なヘッダー設定
 */

import sharp from 'sharp';
import { EXTERNAL_SITE_RETRY_OPTIONS, withRetry } from './retry';
import type { ProcessedImage } from './types';

/** 一般的なブラウザの User-Agent */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 画像URLから画像を取得して処理
 * - リトライ処理付き
 * - 適切なヘッダーを設定してブロックを回避
 */
export async function fetchAndProcessImage(
  imageUrl: string,
  options: {
    maxWidth?: number;
    format?: 'png' | 'jpeg';
  } = {}
): Promise<ProcessedImage> {
  const { maxWidth = 800, format = 'png' } = options;

  // リトライ付きで画像を取得
  const inputBuffer = await withRetry(async () => {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/webp,image/png,image/jpeg,image/*',
        // リファラーを設定（一部サイトで必要）
        Referer: new URL(imageUrl).origin,
      },
    });

    if (!response.ok) {
      const error = new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      // ステータスコードをエラーに付与（リトライ判定用）
      Object.assign(error, { status: response.status });
      throw error;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }, EXTERNAL_SITE_RETRY_OPTIONS);

  // sharp で処理
  let processor = sharp(inputBuffer);

  // メタデータ取得
  const metadata = await processor.metadata();

  // リサイズ（最大幅を超える場合のみ）
  if (metadata.width && metadata.width > maxWidth) {
    processor = processor.resize(maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // フォーマット変換
  let outputBuffer: Buffer;
  if (format === 'png') {
    outputBuffer = await processor.png({ quality: 90 }).toBuffer();
  } else {
    outputBuffer = await processor.jpeg({ quality: 85 }).toBuffer();
  }

  // 出力メタデータ取得
  const outputMetadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    format,
    width: outputMetadata.width ?? 0,
    height: outputMetadata.height ?? 0,
    originalUrl: imageUrl,
  };
}

/**
 * 画像フォーマットを検出
 */
export async function detectImageFormat(buffer: Buffer): Promise<string | undefined> {
  const metadata = await sharp(buffer).metadata();
  return metadata.format;
}

/**
 * 画像を最適化（品質調整）
 */
export async function optimizeImage(
  buffer: Buffer,
  options: {
    format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
    maxWidth?: number;
  } = {}
): Promise<Buffer> {
  const { format = 'png', quality = 85, maxWidth = 800 } = options;

  let processor = sharp(buffer);

  // リサイズ
  const metadata = await processor.metadata();
  if (metadata.width && metadata.width > maxWidth) {
    processor = processor.resize(maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // フォーマット変換
  switch (format) {
    case 'png':
      return processor.png({ quality }).toBuffer();
    case 'jpeg':
      return processor.jpeg({ quality }).toBuffer();
    case 'webp':
      return processor.webp({ quality }).toBuffer();
    default:
      return processor.toBuffer();
  }
}
