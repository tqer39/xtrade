/**
 * シードデータの型定義
 */

export interface MemberSeedData {
  name: string;
  nameReading: string;
  nameRomaji: string;
  debutRank: number;
}

export interface SeriesSeedData {
  name: string;
  releaseType: 'single' | 'album' | 'live_goods';
  releaseDate: string;
  cardCount: number;
  sourceUrl: string | null;
}

export interface PhotocardSeedData {
  name: string;
  memberName: string;
  series: string;
  releaseType: 'single' | 'album' | 'live_goods';
  releaseDate: string;
  rarity: string;
}

/**
 * DB登録用の型定義
 */

export interface MemberMasterInput {
  groupName: string;
  name: string;
  nameReading: string | null;
  nameRomaji: string | null;
  debutRank: number | null;
  imageUrl: string | null;
}

export interface SeriesMasterInput {
  groupName: string;
  name: string;
  releaseType: string | null;
  releaseDate: string | null;
  cardCount: number | null;
  sourceUrl: string | null;
}

export interface PhotocardMasterInput {
  name: string;
  normalizedName: string | null;
  groupName: string | null;
  memberName: string | null;
  memberNameReading: string | null;
  series: string | null;
  releaseType: string | null;
  releaseDate: string | null;
  rarity: string | null;
  imageUrl: string | null;
  source: 'seed' | 'user' | 'scrape';
  sourceUrl: string | null;
  verified: boolean;
}

export interface UpsertResult {
  action: 'created' | 'skipped' | 'updated';
  id: string;
}

export interface SyncStats {
  members: { created: number; skipped: number };
  series: { created: number; skipped: number };
  photocards: { created: number; skipped: number };
}
