/**
 * スクレイピングシステムの型定義
 */

/**
 * スクレイパータイプ
 */
export type ScraperType = 'static' | 'llm' | 'api';

/**
 * スクレイピングソース設定
 */
export interface ScrapeSourceConfig {
  id: string;
  name: string;
  type: ScraperType;
  baseUrl: string;
  category?: string;
  groupName?: string;
  config?: ScraperConfig;
  isActive: boolean;
}

/**
 * スクレイパー固有設定
 */
export interface ScraperConfig {
  // 静的スクレイパー用
  selectors?: {
    cardList?: string;
    cardName?: string;
    cardImage?: string;
    nextPage?: string;
  };
  // LLMスクレイパー用
  prompt?: string;
  // API用
  apiEndpoint?: string;
  apiKey?: string;
  // 共通
  rateLimit?: number; // リクエスト間隔（ms）
  maxPages?: number;
}

/**
 * 抽出されたカード情報
 */
export interface ExtractedCard {
  name: string;
  imageUrl: string;
  series?: string;
  memberName?: string;
  groupName?: string;
  rarity?: string;
  releaseDate?: string;
  sourceUrl?: string;
}

/**
 * スクレイピング結果
 */
export interface ScrapeResult {
  sourceId: string;
  status: 'success' | 'failed';
  itemsFound: number;
  itemsCreated: number;
  itemsUpdated: number;
  cards: ExtractedCard[];
  errorMessage?: string;
  startedAt: Date;
  finishedAt: Date;
}

/**
 * 画像処理結果
 */
export interface ProcessedImage {
  buffer: Buffer;
  format: 'png' | 'jpeg';
  width: number;
  height: number;
  originalUrl: string;
}

/**
 * アップロード結果
 */
export interface UploadResult {
  key: string;
  url: string;
  size: number;
}
