#!/usr/bin/env npx tsx
/**
 * フォトカードマスターデータ同期スクリプト
 *
 * 使用方法:
 *   npx tsx scripts/sync-photocard-data.ts [--dry-run] [--verbose]
 *
 * 環境変数:
 *   DRY_RUN=true  ドライラン（DBに書き込まない）
 */

import { syncPhotocardData } from './photocard-sync';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || process.env.DRY_RUN === 'true';
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log('🎴 フォトカードマスターデータ同期');
  console.log('================================');
  console.log(`モード: ${dryRun ? 'ドライラン' : '本番'}`);
  console.log(`詳細表示: ${verbose ? 'ON' : 'OFF'}`);

  if (dryRun) {
    console.log('\n⚠️  ドライランモード: データベースへの書き込みは行いません');
  }

  try {
    const stats = await syncPhotocardData({ dryRun, verbose });

    console.log('\n================================');
    console.log('📊 同期結果:');
    console.log(`  メンバー: 作成 ${stats.members.created} / スキップ ${stats.members.skipped}`);
    console.log(`  シリーズ: 作成 ${stats.series.created} / スキップ ${stats.series.skipped}`);
    console.log(
      `  フォトカード: 作成 ${stats.photocards.created} / スキップ ${stats.photocards.skipped}`
    );
    console.log('\n✅ 同期完了!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
