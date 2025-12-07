/**
 * LLM ベースのスクレイパー
 * Claude API を使用して HTML からカード情報を抽出
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedCard } from './types';

/**
 * LLM クライアントを作成
 */
function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey });
}

/**
 * HTML をクリーニング（不要な要素を削除）
 */
export function cleanHtml(html: string): string {
  return (
    html
      // scriptタグを削除
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // styleタグを削除
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // コメントを削除
      .replace(/<!--[\s\S]*?-->/g, '')
      // 連続する空白を1つに
      .replace(/\s+/g, ' ')
      // 改行を整理
      .replace(/>\s+</g, '><')
      .trim()
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
 * LLM を使って HTML からカード情報を抽出
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

  const client = createClient();
  const cleanedHtml = cleanHtml(html);

  // HTML が長すぎる場合はトリミング
  const maxHtmlLength = 100000;
  const trimmedHtml =
    cleanedHtml.length > maxHtmlLength ? cleanedHtml.slice(0, maxHtmlLength) + '...' : cleanedHtml;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: `以下のHTMLからカード情報を抽出してください。

${prompt}

HTML:
\`\`\`html
${trimmedHtml}
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
- 画像が見つからないカードはスキップしてください`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonFromResponse(text);
}

/**
 * ページ構造を分析してカード一覧ページかどうか判定
 */
export async function analyzePageStructure(html: string): Promise<{
  isCardListPage: boolean;
  suggestedSelectors?: {
    cardList: string;
    cardName: string;
    cardImage: string;
  };
}> {
  const client = createClient();
  const cleanedHtml = cleanHtml(html).slice(0, 50000);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `このHTMLがカード一覧ページかどうか分析してください。

HTML（抜粋）:
\`\`\`html
${cleanedHtml}
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
}`,
      },
    ],
  });

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
