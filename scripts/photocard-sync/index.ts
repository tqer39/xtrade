import {
  getMemberReadingMap,
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
