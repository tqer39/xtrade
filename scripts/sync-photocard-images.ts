#!/usr/bin/env npx tsx
/**
 * フォトカード画像同期スクリプト
 *
 * 使用方法:
 *   npx tsx scripts/sync-photocard-images.ts [--dry-run] [--verbose] [--limit=N] [--delay=MS]
 *
 * オプション:
 *   --dry-run    ドライラン（実際のアップロードなし）
 *   --verbose    詳細表示
 *   --limit=N    同期する最大画像数（デフォルト: 100）
 *   --delay=MS   リクエスト間の待機時間（デフォルト: 1000ms）
 *
 * 環境変数:
 *   DRY_RUN=true  ドライラン
 *   R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
 */

import { config } from 'dotenv';

// .env.local から環境変数を読み込む（R2接続より先に実行）
config({ path: '.env.local' });

function parseArgs(args: string[]): {
  dryRun: boolean;
  verbose: boolean;
  limit: number;
  delayMs: number;
} {
  const dryRun = args.includes('--dry-run') || process.env.DRY_RUN === 'true';
  const verbose = args.includes('--verbose') || args.includes('-v');

  let limit = 100;
  let delayMs = 1000;

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    }
    if (arg.startsWith('--delay=')) {
      delayMs = parseInt(arg.split('=')[1], 10);
    }
  }

  return { dryRun, verbose, limit, delayMs };
}

async function main() {
  const args = process.argv.slice(2);
  const { dryRun, verbose, limit, delayMs } = parseArgs(args);

  console.log('🖼️  フォトカード画像同期');
  console.log('================================');
  console.log(`モード: ${dryRun ? 'ドライラン' : '本番'}`);
  console.log(`詳細表示: ${verbose ? 'ON' : 'OFF'}`);
  console.log(`上限: ${limit} 件`);
  console.log(`待機時間: ${delayMs} ms`);

  if (dryRun) {
    console.log('\n⚠️  ドライランモード: R2へのアップロードは行いません');
  }

  // 環境変数チェック
  const requiredEnvVars = [
    'DATABASE_URL',
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0 && !dryRun) {
    console.error(`\n❌ 必要な環境変数が設定されていません: ${missingVars.join(', ')}`);
    process.exit(1);
  }

  try {
    // 動的インポート（環境変数読み込み後に実行）
    const { syncPhotocardImages } = await import('./photocard-sync');
    const stats = await syncPhotocardImages({ dryRun, verbose, limit, delayMs });

    console.log('\n================================');
    console.log('📊 同期結果:');
    console.log(`  アップロード: ${stats.uploaded} 件`);
    console.log(`  スキップ: ${stats.skipped} 件`);
    console.log(`  失敗: ${stats.failed} 件`);
    console.log('\n✅ 画像同期完了!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
