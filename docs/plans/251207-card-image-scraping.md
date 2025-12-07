# カード画像スクレイピングシステム設計

- **作成日**: 2025-12-07
- **ステータス**: 設計中
- **担当 Agent**: ArchAgent（起点）→ APIAgent

## 概要

公式カード画像を自動収集し、`photocardMaster` テーブルに画像URLを登録するシステムを構築する。
LLM を活用して動的なコンテンツ変更にも対応可能な汎用的なスクレイピングアーキテクチャを採用する。

## 課題

1. **出品者がいなくてもカード検索可能にしたい**
   - 現状: `photocardMaster` にデータがない、または画像がない
   - 解決: 公式画像付きのマスターデータを自動収集

2. **公式画像が必須**
   - 画像なしのカードは UX が低下（NO IMAGE 表示）
   - 可能な限り公式画像を収集したい

3. **コンテンツが動的に増加**
   - 新商品、新シリーズが継続的にリリース
   - 手動更新は非現実的

---

## 対象コンテンツ

### Phase 1: K-POP フォトカード（初期ターゲット）

| グループ | 公式サイト例 | 取得難易度 |
| --- | --- | --- |
| INI | LAPONE 公式、商品ページ | 中（商品画像から抽出） |
| JO1 | 同上 | 中 |
| その他 | 各事務所公式 | 変動 |

### Phase 2: トレーディングカード

| カテゴリ | 公式サイト | 取得難易度 |
| --- | --- | --- |
| ポケモンカード | pokemon-card.com | 中（カード検索DB） |
| 遊戯王 | yugioh-card.com | 低（カードDB公開） |
| ワンピースカード | onepiece-cardgame.com | 低 |
| MTG | scryfall.com (API) | 低（公開API） |

---

## アーキテクチャ

```text
┌──────────────────────────────────────────────────────────────────┐
│                     GitHub Actions (Cron)                        │
│                   毎日 / 週次でトリガー                            │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Scraping Orchestrator                          │
│   ・ソース設定を読み込み                                           │
│   ・各ソースに対してスクレイピング実行                              │
│   ・結果を DB に保存                                               │
└──────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Static Scraper  │  │   LLM Scraper    │  │   API Fetcher    │
│ (固定パーサー)    │  │ (Claude 支援)     │  │ (公開 API)       │
│                  │  │                  │  │                  │
│ 例: pokemon-card │  │ 例: 未知のサイト  │  │ 例: Scryfall    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Image Processor                               │
│   ・WebP → PNG 変換                                              │
│   ・リサイズ・最適化                                              │
│   ・R2/Vercel Blob にアップロード                                 │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Database                                 │
│   ・photocardMaster.imageUrl 更新                                │
│   ・scrapeLog テーブルで履歴管理                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## DBスキーマ追加

### scrapeSource テーブル（スクレイピング対象定義）

```typescript
export const scrapeSource = pgTable('scrape_source', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),           // ソース名（例: "pokemon-card-db"）
  type: text('type').notNull(),            // "static" | "llm" | "api"
  baseUrl: text('base_url').notNull(),     // ベースURL
  category: text('category'),              // 対象カテゴリ（例: "ポケモンカード"）
  config: text('config'),                  // JSON: パーサー設定やプロンプト
  isActive: boolean('is_active').default(true),
  lastScrapedAt: timestamp('last_scraped_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

### scrapeLog テーブル（実行ログ）

```typescript
export const scrapeLog = pgTable('scrape_log', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull().references(() => scrapeSource.id),
  status: text('status').notNull(),        // "running" | "success" | "failed"
  itemsFound: integer('items_found'),
  itemsUpdated: integer('items_updated'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at'),
});
```

---

## LLM Scraper の仕組み

### 概念

従来のスクレイピングは固定のセレクタ（CSSセレクタ、XPath）に依存するため、サイト構造が変わると壊れる。
LLM を使うことで、以下が可能になる：

1. **構造非依存の抽出**: HTML を渡して「カード名と画像URLを抽出して」と指示
2. **自己修復**: サイト構造が変わっても LLM が適応
3. **新規ソース対応**: 新しいサイトも設定追加だけで対応

### 実装案

```typescript
// scripts/scraper/llm-scraper.ts

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface CardInfo {
  name: string;
  imageUrl: string;
  series?: string;
  memberName?: string;
}

export async function extractCardsWithLLM(
  html: string,
  prompt: string
): Promise<CardInfo[]> {
  // HTML を適切なサイズにトリミング（不要なスクリプト・スタイル削除）
  const cleanedHtml = cleanHtml(html);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `以下のHTMLからカード情報を抽出してください。

${prompt}

HTML:
\`\`\`html
${cleanedHtml}
\`\`\`

JSON配列形式で回答してください:
[{"name": "カード名", "imageUrl": "画像URL", "series": "シリーズ名", "memberName": "メンバー名"}]`
    }],
  });

  // JSON パース
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonFromLLMResponse(text);
}
```

### コスト見積もり

| 処理 | トークン数（概算） | 1回あたりコスト |
| --- | --- | --- |
| HTML 入力 | ~10,000 | $0.03 |
| 出力 | ~1,000 | $0.015 |
| **合計** | | **~$0.05/ページ** |

週次で 100 ページ処理した場合、月間 $20 程度。

---

## 画像処理パイプライン

### WebP → PNG 変換

```typescript
// scripts/scraper/image-processor.ts

import sharp from 'sharp';

export async function processImage(
  imageBuffer: Buffer,
  originalFormat: string
): Promise<Buffer> {
  let processor = sharp(imageBuffer);

  // WebP の場合は PNG に変換
  if (originalFormat === 'webp') {
    processor = processor.png();
  }

  // リサイズ（最大幅 800px）
  processor = processor.resize(800, null, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  return processor.toBuffer();
}
```

### ストレージ

CloudFlare R2 を推奨（既存の CloudFlare インフラと統合、エグレス無料）

```typescript
// scripts/scraper/storage.ts

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadImage(
  buffer: Buffer,
  key: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: 'xtrade-card-images',
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
  }));

  return `https://images.xtrade.tqer39.dev/${key}`;
}
```

---

## GitHub Actions ワークフロー

```yaml
# .github/workflows/scrape-cards.yml

name: Scrape Card Images

on:
  schedule:
    - cron: '0 3 * * 0'  # 毎週日曜 03:00 UTC
  workflow_dispatch:      # 手動実行も可能

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run scraper
        run: npm run scrape:cards
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          CLOUDFLARE_R2_ENDPOINT: ${{ secrets.CLOUDFLARE_R2_ENDPOINT }}
          CLOUDFLARE_R2_ACCESS_KEY_ID: ${{ secrets.CLOUDFLARE_R2_ACCESS_KEY_ID }}
          CLOUDFLARE_R2_SECRET_ACCESS_KEY: ${{ secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY }}
```

---

## 実装ステップ

### Phase 1: 基盤構築

1. [ ] DB スキーマ追加（scrapeSource, scrapeLog）
2. [ ] CloudFlare R2 バケット作成・設定
3. [ ] 画像処理ユーティリティ（sharp）
4. [ ] 基本的なスクレイピングフレームワーク

### Phase 2: 静的スクレイパー実装

1. [ ] ポケモンカード公式 DB スクレイパー
2. [ ] 遊戯王カード DB スクレイパー
3. [ ] Scryfall API フェッチャー（MTG）

### Phase 3: LLM スクレイパー実装

1. [ ] Claude API 統合
2. [ ] HTML クリーニング・トリミング
3. [ ] プロンプトテンプレート設計
4. [ ] エラーハンドリング・リトライ

### Phase 4: 本番運用

1. [ ] GitHub Actions ワークフロー設定
2. [ ] モニタリング・アラート設定
3. [ ] 初期データ投入

---

## 代替案・検討事項

### 代替案 1: 外部サービス利用

| サービス | 特徴 | コスト |
| --- | --- | --- |
| Firecrawl | LLM スクレイピング特化 | $19/月〜 |
| Apify | 汎用スクレイピング | 従量課金 |

初期は自前実装し、スケール時に検討する。

### 代替案 2: ユーザー投稿依存

ユーザーがカード画像をアップロードする運用。

**メリット:**

- 開発コスト低
- 著作権リスク低減

**デメリット:**

- カバレッジ低い
- 画質・正確性のばらつき

併用が現実的（自動収集 + ユーザー補完）。

---

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 著作権侵害 | 公式画像の利用規約確認、必要に応じて表示のみ（ホットリンク） |
| サイト構造変更 | LLM スクレイパーで自動適応 + アラート |
| API コスト超過 | 週次実行、差分更新、キャッシュ |
| 画像取得ブロック | User-Agent ローテーション、リクエスト間隔調整 |

---

## 完了条件

- [ ] `photocardMaster` に画像 URL が登録される
- [ ] 検索時に画像付きでカードが表示される
- [ ] GitHub Actions で定期実行される
- [ ] 新規ソース追加が設定のみで可能
- [ ] エラー発生時にアラート通知

---

## 参照

- [Listing Feature 計画](./251205-listing-feature.md)
- [アーキテクチャ設計書](../architecture.ja.md)
- [Anthropic API ドキュメント](https://docs.anthropic.com/)
- [CloudFlare R2 ドキュメント](https://developers.cloudflare.com/r2/)
