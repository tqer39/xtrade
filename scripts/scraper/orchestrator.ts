/**
 * スクレイピングオーケストレーター
 * 全体の処理フローを制御
 *
 * フェーズ分離アーキテクチャ:
 * - Phase 1: メタデータ収集（LLM でカード情報を抽出、DB に保存）
 * - Phase 2: 画像同期（未同期の画像を R2 にアップロード）
 *
 * 外部サイトへのアクセス対策:
 * - リクエスト間隔を設けてブロックを回避
 * - 指数バックオフ付きリトライ
 * - 適切な User-Agent 設定
 */

import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../src/db/drizzle';
import { photocardMaster, scrapeLog, scrapeSource as scrapeSourceTable } from '../../src/db/schema';
import { fetchAndProcessImage } from './image-processor';
import { extractCardsWithLLM } from './llm-scraper';
import { EXTERNAL_SITE_RETRY_OPTIONS, RateLimiter, sleep, withRetry } from './retry';
import { mirrorImageToR2 } from './storage';
import type {
  CardWithSyncStatus,
  ExtractedCard,
  ImageSyncStatus,
  MetadataSaveResult,
  ScrapeResult,
  ScraperConfig,
  ScraperMode,
  ScrapeSourceConfig,
} from './types';

/** 外部サイトへのリクエスト用レートリミッター（デフォルト: 2秒間隔） */
const externalSiteRateLimiter = new RateLimiter(2000);

/** 画像ダウンロード用レートリミッター（デフォルト: 1秒間隔） */
const imageRateLimiter = new RateLimiter(1000);

/** ソース間の待機時間（ミリ秒） */
const SOURCE_INTERVAL_MS = 5000;

// =====================================
// ソース管理
// =====================================

/**
 * アクティブなスクレイピングソースを取得
 */
export async function getActiveSources(): Promise<ScrapeSourceConfig[]> {
  const sources = await db
    .select()
    .from(scrapeSourceTable)
    .where(eq(scrapeSourceTable.isActive, true));

  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type as 'static' | 'llm' | 'api',
    baseUrl: s.baseUrl,
    category: s.category ?? undefined,
    groupName: s.groupName ?? undefined,
    config: s.config ? (JSON.parse(s.config) as ScraperConfig) : undefined,
    isActive: s.isActive,
  }));
}

// =====================================
// ログ管理
// =====================================

/**
 * スクレイピングログを作成
 */
async function createLog(
  sourceId: string,
  status: 'running' | 'success' | 'failed',
  startedAt: Date
): Promise<string> {
  const id = uuidv4();
  await db.insert(scrapeLog).values({
    id,
    sourceId,
    status,
    startedAt,
  });
  return id;
}

/**
 * スクレイピングログを更新
 */
async function updateLog(
  logId: string,
  result: {
    status: 'success' | 'failed';
    itemsFound?: number;
    itemsCreated?: number;
    itemsUpdated?: number;
    errorMessage?: string;
    finishedAt: Date;
  }
): Promise<void> {
  await db
    .update(scrapeLog)
    .set({
      status: result.status,
      itemsFound: result.itemsFound,
      itemsCreated: result.itemsCreated,
      itemsUpdated: result.itemsUpdated,
      errorMessage: result.errorMessage,
      finishedAt: result.finishedAt,
    })
    .where(eq(scrapeLog.id, logId));
}

/**
 * ソースの最終スクレイピング日時を更新
 */
async function updateSourceLastScraped(sourceId: string): Promise<void> {
  await db
    .update(scrapeSourceTable)
    .set({ lastScrapedAt: new Date() })
    .where(eq(scrapeSourceTable.id, sourceId));
}

// =====================================
// HTTP フェッチ
// =====================================

/** 一般的なブラウザの User-Agent */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * ページをフェッチ
 * - レートリミットを適用
 * - リトライ処理付き
 * - 適切なヘッダーを設定してブロックを回避
 */
async function fetchPage(url: string): Promise<string> {
  return externalSiteRateLimiter.execute(async () =>
    withRetry(async () => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          // リファラーを設定（一部サイトで必要）
          Referer: new URL(url).origin,
        },
      });

      if (!response.ok) {
        const error = new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
        // ステータスコードをエラーに付与（リトライ判定用）
        Object.assign(error, { status: response.status });
        throw error;
      }

      return response.text();
    }, EXTERNAL_SITE_RETRY_OPTIONS)
  );
}

// =====================================
// Phase 1: メタデータ収集
// =====================================

/**
 * カードメタデータをDBに保存（重複チェック付き）
 * 画像のダウンロード・アップロードは行わない
 */
async function saveCardMetadata(
  cards: ExtractedCard[],
  source: ScrapeSourceConfig
): Promise<MetadataSaveResult> {
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const card of cards) {
    try {
      // sourceImageUrl で重複チェック
      const existing = await db
        .select()
        .from(photocardMaster)
        .where(eq(photocardMaster.sourceImageUrl, card.imageUrl))
        .limit(1);

      if (existing.length > 0) {
        console.log(`Skip duplicate: ${card.name} (${card.imageUrl})`);
        skipped++;
        continue;
      }

      // 新規作成（画像は未同期状態で保存）
      await db.insert(photocardMaster).values({
        id: uuidv4(),
        name: card.name,
        groupName: card.groupName || source.groupName,
        memberName: card.memberName,
        series: card.series,
        rarity: card.rarity,
        sourceImageUrl: card.imageUrl, // 元サイトの画像URL
        imageUrl: null, // 廃止予定フィールド（後方互換のため保持）
        r2ImageUrl: null, // 画像同期後に設定
        imageSyncStatus: 'pending', // 未同期
        source: 'scrape',
        sourceUrl: card.sourceUrl || source.baseUrl,
        verified: false,
      });
      created++;
      console.log(`Created: ${card.name}`);
    } catch (error) {
      console.error(`Error saving card ${card.name}:`, error);
      errors++;
    }
  }

  return { created, skipped, errors };
}

/**
 * LLMスクレイパーを実行してカード情報を抽出
 */
async function runLLMScraper(source: ScrapeSourceConfig): Promise<ExtractedCard[]> {
  const prompt =
    source.config?.prompt ||
    `
このページからカード（フォトカード）情報を抽出してください。
- グループ名: ${source.groupName || '不明'}
- カテゴリ: ${source.category || '不明'}
`;

  const html = await fetchPage(source.baseUrl);

  return extractCardsWithLLM(html, prompt);
}

/**
 * Phase 1: メタデータのみ収集
 */
export async function scrapeMetadata(source: ScrapeSourceConfig): Promise<ScrapeResult> {
  const startedAt = new Date();
  const logId = await createLog(source.id, 'running', startedAt);

  try {
    console.log(`[Phase 1] Starting metadata scrape: ${source.name} (${source.type})`);

    let cards: ExtractedCard[] = [];

    switch (source.type) {
      case 'llm':
        cards = await runLLMScraper(source);
        break;
      case 'static':
        console.warn('Static scraper not implemented yet');
        break;
      case 'api':
        console.warn('API fetcher not implemented yet');
        break;
    }

    console.log(`Found ${cards.length} cards`);

    // メタデータのみ保存（画像はダウンロードしない）
    const { created, skipped, errors } = await saveCardMetadata(cards, source);

    // ログを更新
    const finishedAt = new Date();
    await updateLog(logId, {
      status: errors > 0 && created === 0 ? 'failed' : 'success',
      itemsFound: cards.length,
      itemsCreated: created,
      itemsUpdated: skipped, // skipped を updated として記録
      finishedAt,
    });

    await updateSourceLastScraped(source.id);

    console.log(
      `[Phase 1] Completed: ${source.name} - Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`
    );

    return {
      sourceId: source.id,
      status: errors > 0 && created === 0 ? 'failed' : 'success',
      itemsFound: cards.length,
      itemsCreated: created,
      itemsUpdated: skipped,
      cards,
      startedAt,
      finishedAt,
    };
  } catch (error) {
    const finishedAt = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);

    await updateLog(logId, {
      status: 'failed',
      errorMessage,
      finishedAt,
    });

    console.error(`[Phase 1] Failed: ${source.name} - ${errorMessage}`);

    return {
      sourceId: source.id,
      status: 'failed',
      itemsFound: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      cards: [],
      errorMessage,
      startedAt,
      finishedAt,
    };
  }
}

// =====================================
// Phase 2: 画像同期
// =====================================

/**
 * 未同期のカードを取得
 */
async function getPendingImages(limit: number = 100): Promise<CardWithSyncStatus[]> {
  const records = await db
    .select({
      id: photocardMaster.id,
      name: photocardMaster.name,
      sourceImageUrl: photocardMaster.sourceImageUrl,
      imageSyncStatus: photocardMaster.imageSyncStatus,
      imageSyncError: photocardMaster.imageSyncError,
    })
    .from(photocardMaster)
    .where(eq(photocardMaster.imageSyncStatus, 'pending'))
    .limit(limit);

  return records
    .filter((r) => r.sourceImageUrl !== null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      sourceImageUrl: r.sourceImageUrl!,
      imageSyncStatus: (r.imageSyncStatus || 'pending') as ImageSyncStatus,
      imageSyncError: r.imageSyncError,
    }));
}

/**
 * 画像同期ステータスを更新
 */
async function updateImageSyncStatus(
  cardId: string,
  status: ImageSyncStatus,
  r2ImageUrl?: string,
  errorMessage?: string
): Promise<void> {
  await db
    .update(photocardMaster)
    .set({
      imageSyncStatus: status,
      r2ImageUrl: r2ImageUrl || null,
      imageUrl: r2ImageUrl || null, // 後方互換のため両方更新
      imageSyncedAt: status === 'synced' ? new Date() : null,
      imageSyncError: errorMessage || null,
    })
    .where(eq(photocardMaster.id, cardId));
}

/**
 * 単一の画像を同期
 */
async function syncSingleImage(card: CardWithSyncStatus): Promise<boolean> {
  try {
    console.log(`[Phase 2] Syncing image: ${card.name}`);

    // レートリミットを適用して画像を取得・処理
    const processed = await imageRateLimiter.execute(() =>
      fetchAndProcessImage(card.sourceImageUrl)
    );

    // R2にアップロード
    const result = await mirrorImageToR2(card.sourceImageUrl, processed.buffer, {
      prefix: 'cards',
      format: processed.format,
    });

    // 成功: ステータスを更新
    await updateImageSyncStatus(card.id, 'synced', result.url);
    console.log(`[Phase 2] Uploaded: ${card.name} -> ${result.url}`);

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Phase 2] Failed to sync image for ${card.name}:`, errorMessage);

    // 失敗: ステータスを更新
    await updateImageSyncStatus(card.id, 'failed', undefined, errorMessage);

    return false;
  }
}

/**
 * Phase 2: 画像同期
 */
export async function syncImages(limit: number = 100): Promise<{
  total: number;
  synced: number;
  failed: number;
}> {
  console.log(`[Phase 2] Starting image sync (limit: ${limit})`);

  const pendingCards = await getPendingImages(limit);
  console.log(`[Phase 2] Found ${pendingCards.length} pending images`);

  let synced = 0;
  let failed = 0;

  for (const card of pendingCards) {
    const success = await syncSingleImage(card);
    if (success) {
      synced++;
    } else {
      failed++;
    }
  }

  console.log(`[Phase 2] Completed - Synced: ${synced}, Failed: ${failed}`);

  return {
    total: pendingCards.length,
    synced,
    failed,
  };
}

// =====================================
// 従来互換 API（all モード）
// =====================================

/**
 * 単一ソースのスクレイピングを実行（従来互換）
 * メタデータ収集 + 画像同期を一度に行う
 */
export async function scrapeSource(source: ScrapeSourceConfig): Promise<ScrapeResult> {
  // Phase 1: メタデータ収集
  const metadataResult = await scrapeMetadata(source);

  if (metadataResult.status === 'failed') {
    return metadataResult;
  }

  // Phase 2: 画像同期
  // 新しく作成されたカードの画像のみ同期
  if (metadataResult.itemsCreated > 0) {
    await syncImages(metadataResult.itemsCreated);
  }

  return metadataResult;
}

/**
 * 全てのアクティブなソースをスクレイピング
 * ソース間に待機時間を設けてブロックを回避
 */
export async function scrapeAllSources(mode: ScraperMode = 'all'): Promise<ScrapeResult[]> {
  const sources = await getActiveSources();
  console.log(`Found ${sources.length} active sources (mode: ${mode})`);

  const results: ScrapeResult[] = [];

  if (mode === 'sync-images') {
    // 画像同期のみ（ソースに関係なく未同期の画像を処理）
    await syncImages();
    return results;
  }

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];

    // 2つ目以降のソースの前に待機（同一サイトへの連続アクセスを避ける）
    if (i > 0) {
      console.log(`Waiting ${SOURCE_INTERVAL_MS / 1000}s before next source...`);
      await sleep(SOURCE_INTERVAL_MS);
    }

    let result: ScrapeResult;

    if (mode === 'metadata') {
      // メタデータのみ
      result = await scrapeMetadata(source);
    } else {
      // all: メタデータ + 画像同期
      result = await scrapeSource(source);
    }

    results.push(result);
  }

  return results;
}
