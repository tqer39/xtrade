import {
  getMemberReadingMap,
  getPhotocardsWithoutImages,
  updatePhotocardImageUrl,
  upsertMemberMaster,
  upsertPhotocardMaster,
  upsertSeriesMaster,
} from './loaders/db-loader';
import { loadMemberSeedData, loadPhotocardSeedData, loadSeriesSeedData } from './sources/seed-data';
import { generateNormalizedName } from './transformers/normalize-name';
import type { SyncStats } from './types';

const GROUP_NAME = 'INI';

export interface SyncOptions {
  dryRun: boolean;
  verbose: boolean;
}

/**
 * フォトカードマスターデータを同期
 */
export async function syncPhotocardData(options: SyncOptions): Promise<SyncStats> {
  const { dryRun, verbose } = options;
  const stats: SyncStats = {
    members: { created: 0, skipped: 0 },
    series: { created: 0, skipped: 0 },
    photocards: { created: 0, skipped: 0 },
    images: { uploaded: 0, skipped: 0, failed: 0 },
  };

  // 1. メンバーマスターを同期
  console.log('\n📌 メンバーマスターを同期中...');
  const memberSeedData = loadMemberSeedData();

  for (const member of memberSeedData) {
    const result = await upsertMemberMaster(
      {
        groupName: GROUP_NAME,
        name: member.name,
        nameReading: member.nameReading,
        nameRomaji: member.nameRomaji,
        debutRank: member.debutRank,
        imageUrl: null,
      },
      dryRun
    );

    if (result.action === 'created') {
      stats.members.created++;
      if (verbose) {
        console.log(`  ✅ 作成: ${member.name}`);
      }
    } else {
      stats.members.skipped++;
      if (verbose) {
        console.log(`  ⏭️ スキップ: ${member.name}`);
      }
    }
  }

  // 2. シリーズマスターを同期
  console.log('\n📌 シリーズマスターを同期中...');
  const seriesSeedData = loadSeriesSeedData();

  for (const series of seriesSeedData) {
    const result = await upsertSeriesMaster(
      {
        groupName: GROUP_NAME,
        name: series.name,
        releaseType: series.releaseType,
        releaseDate: series.releaseDate,
        cardCount: series.cardCount,
        sourceUrl: series.sourceUrl,
      },
      dryRun
    );

    if (result.action === 'created') {
      stats.series.created++;
      if (verbose) {
        console.log(`  ✅ 作成: ${series.name}`);
      }
    } else {
      stats.series.skipped++;
      if (verbose) {
        console.log(`  ⏭️ スキップ: ${series.name}`);
      }
    }
  }

  // 3. フォトカードマスターを同期
  console.log('\n📌 フォトカードマスターを同期中...');
  const photocardSeedData = loadPhotocardSeedData();

  // メンバー読みマップを取得
  const memberReadingMap = await getMemberReadingMap();

  for (const photocard of photocardSeedData) {
    const memberReading = memberReadingMap.get(photocard.memberName) ?? null;
    const normalizedName = generateNormalizedName(photocard.name, memberReading);

    const result = await upsertPhotocardMaster(
      {
        name: photocard.name,
        normalizedName,
        groupName: GROUP_NAME,
        memberName: photocard.memberName,
        memberNameReading: memberReading,
        series: photocard.series,
        releaseType: photocard.releaseType,
        releaseDate: photocard.releaseDate,
        rarity: photocard.rarity,
        imageUrl: null,
        source: 'seed',
        sourceUrl: null,
        verified: true,
      },
      dryRun
    );

    if (result.action === 'created') {
      stats.photocards.created++;
      if (verbose) {
        console.log(`  ✅ 作成: ${photocard.name}`);
      }
    } else {
      stats.photocards.skipped++;
      if (verbose) {
        console.log(`  ⏭️ スキップ: ${photocard.name}`);
      }
    }
  }

  return stats;
}

export interface ImageSyncOptions {
  dryRun: boolean;
  verbose: boolean;
  /** 同期する最大画像数（レート制限用） */
  limit?: number;
  /** リクエスト間の待機時間（ミリ秒） */
  delayMs?: number;
}

/**
 * フォトカード画像を同期
 * 外部URLから画像をダウンロードしてR2にアップロード
 */
export async function syncPhotocardImages(options: ImageSyncOptions): Promise<SyncStats['images']> {
  const { dryRun, verbose, limit = 100, delayMs = 1000 } = options;
  const stats = { uploaded: 0, skipped: 0, failed: 0 };

  // R2アップロード関数を動的インポート（環境変数依存のため）
  const { uploadImageFromUrl } = await import('@/lib/r2');

  // imageUrl未設定のフォトカードを取得
  const photocards = await getPhotocardsWithoutImages();
  console.log(`\n📷 画像同期対象: ${photocards.length} 件`);

  if (photocards.length === 0) {
    console.log('  ℹ️ 同期対象の画像はありません');
    return stats;
  }

  // シードデータから画像URLを取得
  const seedData = loadPhotocardSeedData();
  const seedImageMap = new Map<string, string>();
  for (const seed of seedData) {
    if (seed.imageUrl) {
      // name + memberName + series でマッチング
      const key = `${seed.name}|${seed.memberName}|${seed.series}`;
      seedImageMap.set(key, seed.imageUrl);
    }
  }

  console.log(`  📦 シードデータの画像URL: ${seedImageMap.size} 件`);

  let processed = 0;
  for (const photocard of photocards) {
    if (processed >= limit) {
      console.log(`  ⚠️ 上限 (${limit}件) に達しました`);
      break;
    }

    const key = `${photocard.name}|${photocard.memberName ?? ''}|${photocard.series ?? ''}`;
    const sourceUrl = seedImageMap.get(key);

    if (!sourceUrl) {
      stats.skipped++;
      if (verbose) {
        console.log(`  ⏭️ 画像URLなし: ${photocard.name}`);
      }
      continue;
    }

    try {
      const r2Key = `photocards/official/${photocard.id}`;

      if (dryRun) {
        console.log(`  🔍 [DRY-RUN] アップロード予定: ${photocard.name}`);
        console.log(`      → ソース: ${sourceUrl}`);
        console.log(`      → 保存先: ${r2Key}`);
        stats.uploaded++;
      } else {
        const result = await uploadImageFromUrl(sourceUrl, r2Key);

        // DB更新
        await updatePhotocardImageUrl(photocard.id, result.url, false);

        if (verbose) {
          console.log(`  ✅ アップロード完了: ${photocard.name}`);
          console.log(`      → サイズ: ${(result.size / 1024).toFixed(1)} KB`);
        }
        stats.uploaded++;
      }

      processed++;

      // レート制限: 次のリクエストまで待機
      if (processed < photocards.length && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      stats.failed++;
      console.error(`  ❌ 失敗: ${photocard.name}`);
      console.error(`      → エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return stats;
}
