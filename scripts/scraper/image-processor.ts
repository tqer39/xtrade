/**
 * 画像処理ユーティリティ
 * WebP → PNG 変換、リサイズなど
 */

import sharp from 'sharp';
import type { ProcessedImage } from './types';

/**
 * 画像URLから画像を取得して処理
 */
export async function fetchAndProcessImage(
  imageUrl: string,
  options: {
    maxWidth?: number;
    format?: 'png' | 'jpeg';
  } = {}
): Promise<ProcessedImage> {
  const { maxWidth = 800, format = 'png' } = options;

  // 画像を取得
  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'image/webp,image/png,image/jpeg,image/*',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

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
