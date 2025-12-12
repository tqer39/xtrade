#!/usr/bin/env npx tsx
/**
 * カード画像スクレイピング CLI
 *
 * 使用方法:
 *   npx tsx scripts/scraper/index.ts                       # 全ソースをスクレイピング（メタデータ + 画像）
 *   npx tsx scripts/scraper/index.ts --mode metadata       # メタデータのみ収集
 *   npx tsx scripts/scraper/index.ts --mode sync-images    # 画像のみ同期
 *   npx tsx scripts/scraper/index.ts --mode all            # メタデータ + 画像（デフォルト）
 *   npx tsx scripts/scraper/index.ts --dry-run             # ドライラン（DB保存なし）
 */

import { scrapeAllSources, syncImages } from './orchestrator';
import type { ScraperMode } from './types';

function parseArgs(): { mode: ScraperMode; isDryRun: boolean } {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  // --mode オプションを解析
  const modeIndex = args.indexOf('--mode');
  let mode: ScraperMode = 'all';

  if (modeIndex !== -1 && args[modeIndex + 1]) {
    const modeArg = args[modeIndex + 1];
    if (modeArg === 'metadata' || modeArg === 'sync-images' || modeArg === 'all') {
      mode = modeArg;
    } else {
      console.error(`Invalid mode: ${modeArg}`);
      console.error('Valid modes: metadata, sync-images, all');
      process.exit(1);
    }
  }

  return { mode, isDryRun };
}

async function main() {
  const { mode, isDryRun } = parseArgs();

  console.log('='.repeat(50));
  console.log('Card Image Scraper');
  console.log('='.repeat(50));
  console.log(`Mode: ${mode}${isDryRun ? ' (DRY RUN)' : ''}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  try {
    if (mode === 'sync-images') {
      // 画像同期のみ
      const syncResult = await syncImages();

      console.log('');
      console.log('='.repeat(50));
      console.log('Image Sync Summary');
      console.log('='.repeat(50));
      console.log(`Total pending: ${syncResult.total}`);
      console.log(`Synced: ${syncResult.synced}`);
      console.log(`Failed: ${syncResult.failed}`);
      console.log(`Finished at: ${new Date().toISOString()}`);

      process.exit(syncResult.failed > 0 ? 1 : 0);
    }

    // metadata または all モード
    const results = await scrapeAllSources(mode);

    console.log('');
    console.log('='.repeat(50));
    console.log('Summary');
    console.log('='.repeat(50));

    let totalFound = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const result of results) {
      const status = result.status === 'success' ? '✓' : '✗';
      console.log(
        `${status} ${result.sourceId}: Found ${result.itemsFound}, Created ${result.itemsCreated}, Skipped ${result.itemsUpdated}`
      );

      if (result.status === 'success') {
        successCount++;
        totalFound += result.itemsFound;
        totalCreated += result.itemsCreated;
        totalUpdated += result.itemsUpdated;
      } else {
        failedCount++;
        if (result.errorMessage) {
          console.log(`  Error: ${result.errorMessage}`);
        }
      }
    }

    console.log('');
    console.log(
      `Total: ${results.length} sources (${successCount} success, ${failedCount} failed)`
    );
    console.log(`Cards: ${totalFound} found, ${totalCreated} created, ${totalUpdated} skipped`);
    console.log(`Finished at: ${new Date().toISOString()}`);

    process.exit(failedCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
