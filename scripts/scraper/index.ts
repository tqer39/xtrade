#!/usr/bin/env npx tsx
/**
 * カード画像スクレイピング CLI
 *
 * 使用方法:
 *   npx tsx scripts/scraper/index.ts          # 全ソースをスクレイピング
 *   npx tsx scripts/scraper/index.ts --dry-run # ドライラン（DB保存なし）
 */

import { scrapeAllSources } from './orchestrator';

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log('='.repeat(50));
  console.log('Card Image Scraper');
  console.log('='.repeat(50));
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  try {
    const results = await scrapeAllSources();

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
        `${status} ${result.sourceId}: Found ${result.itemsFound}, Created ${result.itemsCreated}, Updated ${result.itemsUpdated}`
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
    console.log(`Cards: ${totalFound} found, ${totalCreated} created, ${totalUpdated} updated`);
    console.log(`Finished at: ${new Date().toISOString()}`);

    process.exit(failedCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
