/**
 * スクレイピングオーケストレーター
 * 全体の処理フローを制御
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
import type { ExtractedCard, ScrapeResult, ScraperConfig, ScrapeSourceConfig } from './types';

/** 外部サイトへのリクエスト用レートリミッター（デフォルト: 2秒間隔） */
const externalSiteRateLimiter = new RateLimiter(2000);

/** 画像ダウンロード用レートリミッター（デフォルト: 1秒間隔） */
const imageRateLimiter = new RateLimiter(1000);

/** ソース間の待機時間（ミリ秒） */
const SOURCE_INTERVAL_MS = 5000;

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

/**
 * カードをDBに保存（upsert）
 */
async function saveCards(
  cards: ExtractedCard[],
  source: ScrapeSourceConfig
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const card of cards) {
    // 既存のカードを検索（名前とシリーズで一致）
    const existing = await db
      .select()
      .from(photocardMaster)
      .where(eq(photocardMaster.name, card.name))
      .limit(1);

    if (existing.length > 0) {
      // 画像URLが異なる場合のみ更新
      if (existing[0].imageUrl !== card.imageUrl && card.imageUrl) {
        await db
          .update(photocardMaster)
          .set({
            imageUrl: card.imageUrl,
            sourceUrl: card.sourceUrl || source.baseUrl,
            source: 'scrape',
          })
          .where(eq(photocardMaster.id, existing[0].id));
        updated++;
      }
    } else {
      // 新規作成
      await db.insert(photocardMaster).values({
        id: uuidv4(),
        name: card.name,
        groupName: card.groupName || source.groupName,
        memberName: card.memberName,
        series: card.series,
        rarity: card.rarity,
        imageUrl: card.imageUrl,
        source: 'scrape',
        sourceUrl: card.sourceUrl || source.baseUrl,
        verified: false,
      });
      created++;
    }
  }

  return { created, updated };
}

/**
 * 画像を処理してR2にアップロード
 * - レートリミットを適用してブロックを回避
 * - 失敗しても他の画像の処理を継続
 */
async function processAndUploadImages(cards: ExtractedCard[]): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();

  for (const card of cards) {
    if (!card.imageUrl) continue;

    try {
      // レートリミットを適用して画像を取得・処理
      const processed = await imageRateLimiter.execute(() => fetchAndProcessImage(card.imageUrl));

      // R2にアップロード
      const result = await mirrorImageToR2(card.imageUrl, processed.buffer, {
        prefix: 'cards',
        format: processed.format,
      });

      imageMap.set(card.imageUrl, result.url);
      console.log(`Uploaded: ${card.name} -> ${result.url}`);
    } catch (error) {
      console.warn(`Failed to process image for ${card.name}:`, error);
      // 元のURLをそのまま使用
      imageMap.set(card.imageUrl, card.imageUrl);
    }
  }

  return imageMap;
}

/**
 * LLMスクレイパーを実行
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
 * 単一ソースのスクレイピングを実行
 */
export async function scrapeSource(source: ScrapeSourceConfig): Promise<ScrapeResult> {
  const startedAt = new Date();
  const logId = await createLog(source.id, 'running', startedAt);

  try {
    console.log(`Starting scrape: ${source.name} (${source.type})`);

    let cards: ExtractedCard[] = [];

    switch (source.type) {
      case 'llm':
        cards = await runLLMScraper(source);
        break;
      case 'static':
        // TODO: 静的スクレイパーの実装
        console.warn('Static scraper not implemented yet');
        break;
      case 'api':
        // TODO: APIフェッチャーの実装
        console.warn('API fetcher not implemented yet');
        break;
    }

    console.log(`Found ${cards.length} cards`);

    // 画像を処理・アップロード
    const imageMap = await processAndUploadImages(cards);

    // 画像URLを更新
    const cardsWithNewUrls = cards.map((card) => ({
      ...card,
      imageUrl: imageMap.get(card.imageUrl) || card.imageUrl,
    }));

    // DBに保存
    const { created, updated } = await saveCards(cardsWithNewUrls, source);

    // ログを更新
    const finishedAt = new Date();
    await updateLog(logId, {
      status: 'success',
      itemsFound: cards.length,
      itemsCreated: created,
      itemsUpdated: updated,
      finishedAt,
    });

    await updateSourceLastScraped(source.id);

    console.log(`Completed: ${source.name} - Created: ${created}, Updated: ${updated}`);

    return {
      sourceId: source.id,
      status: 'success',
      itemsFound: cards.length,
      itemsCreated: created,
      itemsUpdated: updated,
      cards: cardsWithNewUrls,
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

    console.error(`Failed: ${source.name} - ${errorMessage}`);

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

/**
 * 全てのアクティブなソースをスクレイピング
 * ソース間に待機時間を設けてブロックを回避
 */
export async function scrapeAllSources(): Promise<ScrapeResult[]> {
  const sources = await getActiveSources();
  console.log(`Found ${sources.length} active sources`);

  const results: ScrapeResult[] = [];

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];

    // 2つ目以降のソースの前に待機（同一サイトへの連続アクセスを避ける）
    if (i > 0) {
      console.log(`Waiting ${SOURCE_INTERVAL_MS / 1000}s before next source...`);
      await sleep(SOURCE_INTERVAL_MS);
    }

    const result = await scrapeSource(source);
    results.push(result);
  }

  return results;
}
