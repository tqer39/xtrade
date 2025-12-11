/**
 * LLM ベースのスクレイパー
 * Claude API を使用して HTML からカード情報を抽出
 *
 * Anthropic API のレートリミット対策:
 * - シングルトンクライアント
 * - 指数バックオフ付きリトライ
 * - rate limit ヘッダーの考慮
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_RETRY_OPTIONS, withRetry } from './retry';
import type { ExtractedCard } from './types';

/** シングルトンクライアントインスタンス */
let clientInstance: Anthropic | null = null;

/**
 * LLM クライアントを取得（シングルトン）
 */
function getClient(): Anthropic {
  if (!clientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    clientInstance = new Anthropic({ apiKey });
  }
  return clientInstance;
}

/**
 * HTML をクリーニング（不要な要素を削除）
 * 商品データ部分を優先的に抽出するため、script/style/head を削除
 */
export function cleanHtml(html: string): string {
  let cleaned = html
    // headタグ全体を削除
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
    // scriptタグを削除
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // styleタグを削除
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // noscriptタグを削除
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    // SVGタグを削除（アイコン等）
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    // コメントを削除
    .replace(/<!--[\s\S]*?-->/g, '')
    // data-* 属性を削除（不要なデータ削減）
    .replace(/\s+data-[a-z-]+="[^"]*"/gi, '')
    // class属性の長いクラス名を短縮
    .replace(/\s+class="[^"]{100,}"/gi, ' class="..."')
    // 連続する空白を1つに
    .replace(/\s+/g, ' ')
    // 改行を整理
    .replace(/>\s+</g, '><')
    .trim();

  // 商品グリッド部分を抽出（Shopify サイト対応）
  cleaned = extractProductSection(cleaned);

  // さらに圧縮
  cleaned = compressHtml(cleaned);

  return cleaned;
}

/**
 * 商品セクションを抽出（ECサイト対応）
 * main タグまたは product-grid を含む部分を優先
 */
function extractProductSection(html: string): string {
  // product-grid を含む部分を探す（Shopify）
  const productGridIndex = html.indexOf('product-grid');
  if (productGridIndex > 0) {
    // product-grid から抽出開始
    return html.substring(productGridIndex);
  }

  // main タグの内容を抽出
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch && mainMatch[1].length > 1000) {
    return mainMatch[1];
  }

  // collection を含む部分を探す
  const collectionIndex = html.indexOf('collection');
  if (collectionIndex > 0) {
    return html.substring(collectionIndex);
  }

  return html;
}

/**
 * 商品情報に不要な属性を削除してさらに圧縮
 */
function compressHtml(html: string): string {
  return (
    html
      // id 属性を削除
      .replace(/\s+id="[^"]*"/gi, '')
      // style 属性を削除
      .replace(/\s+style="[^"]*"/gi, '')
      // onclick 等のイベント属性を削除
      .replace(/\s+on\w+="[^"]*"/gi, '')
      // aria-* 属性を削除
      .replace(/\s+aria-[a-z-]+="[^"]*"/gi, '')
      // role 属性を削除
      .replace(/\s+role="[^"]*"/gi, '')
      // tabindex 属性を削除
      .replace(/\s+tabindex="[^"]*"/gi, '')
      // link タグを削除
      .replace(/<link\b[^>]*>/gi, '')
      // 空の div/span を削除
      .replace(/<(div|span)[^>]*>\s*<\/\1>/gi, '')
      // 連続する空白を1つに
      .replace(/\s+/g, ' ')
  );
}

/**
 * LLM レスポンスから JSON を抽出
 */
function parseJsonFromResponse(text: string): ExtractedCard[] {
  // JSON配列を探す
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn('No JSON array found in LLM response');
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // バリデーション
    return parsed.filter(
      (item): item is ExtractedCard =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.name === 'string' &&
        typeof item.imageUrl === 'string' &&
        item.name.length > 0 &&
        item.imageUrl.length > 0
    );
  } catch {
    console.warn('Failed to parse JSON from LLM response');
    return [];
  }
}

/**
 * HTML の最大長（これを超えるとトリミング）
 * Anthropic API の rate limit（30,000 input tokens/分）を考慮
 * 日本語は約2文字≒1トークン、HTMLタグ等を含めて安全マージンを取る
 */
const MAX_HTML_LENGTH = 40000;

/** カード抽出用プロンプトテンプレート */
const CARD_EXTRACTION_PROMPT = `以下のHTMLからカード情報を抽出してください。

{customPrompt}

HTML:
\`\`\`html
{html}
\`\`\`

JSON配列形式で回答してください。各カードは以下の形式で：
[
  {
    "name": "カード名（必須）",
    "imageUrl": "画像URL（必須、絶対URL）",
    "series": "シリーズ名（任意）",
    "memberName": "メンバー名（任意）",
    "groupName": "グループ名（任意）",
    "rarity": "レアリティ（任意）"
  }
]

注意事項：
- 画像URLは絶対URLで出力してください
- 相対URLの場合はベースURLと結合してください
- 画像が見つからないカードはスキップしてください`;

/**
 * LLM を使って HTML からカード情報を抽出
 * Anthropic API のレートリミットを考慮したリトライ処理付き
 */
export async function extractCardsWithLLM(
  html: string,
  prompt: string,
  options: {
    maxTokens?: number;
    model?: string;
  } = {}
): Promise<ExtractedCard[]> {
  const { maxTokens = 4096, model = 'claude-sonnet-4-20250514' } = options;

  const client = getClient();
  const cleanedHtml = cleanHtml(html);

  // HTML が長すぎる場合はトリミング
  const trimmedHtml =
    cleanedHtml.length > MAX_HTML_LENGTH
      ? `${cleanedHtml.slice(0, MAX_HTML_LENGTH)}...`
      : cleanedHtml;

  // プロンプトを構築
  const fullPrompt = CARD_EXTRACTION_PROMPT.replace('{customPrompt}', prompt).replace(
    '{html}',
    trimmedHtml
  );

  // リトライ付きで API を呼び出し
  const response = await withRetry(
    async () =>
      client.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      }),
    ANTHROPIC_API_RETRY_OPTIONS
  );

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonFromResponse(text);
}

/** ページ構造分析の最大 HTML 長 */
const MAX_ANALYSIS_HTML_LENGTH = 50000;

/** ページ構造分析用プロンプト */
const PAGE_ANALYSIS_PROMPT = `このHTMLがカード一覧ページかどうか分析してください。

HTML（抜粋）:
\`\`\`html
{html}
\`\`\`

以下のJSON形式で回答:
{
  "isCardListPage": true/false,
  "suggestedSelectors": {
    "cardList": "カード一覧のCSSセレクタ",
    "cardName": "カード名のCSSセレクタ",
    "cardImage": "カード画像のCSSセレクタ"
  },
  "reason": "判断理由"
}`;

/**
 * ページ構造を分析してカード一覧ページかどうか判定
 * Anthropic API のレートリミットを考慮したリトライ処理付き
 */
export async function analyzePageStructure(html: string): Promise<{
  isCardListPage: boolean;
  suggestedSelectors?: {
    cardList: string;
    cardName: string;
    cardImage: string;
  };
}> {
  const client = getClient();
  const cleanedHtml = cleanHtml(html).slice(0, MAX_ANALYSIS_HTML_LENGTH);
  const fullPrompt = PAGE_ANALYSIS_PROMPT.replace('{html}', cleanedHtml);

  const response = await withRetry(
    async () =>
      client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      }),
    ANTHROPIC_API_RETRY_OPTIONS
  );

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        isCardListPage: result.isCardListPage === true,
        suggestedSelectors: result.suggestedSelectors,
      };
    }
  } catch {
    // パースエラーは無視
  }

  return { isCardListPage: false };
}
