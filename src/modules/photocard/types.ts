/**
 * フォトカードマスター関連の型定義
 */

export interface PhotocardMaster {
  id: string;
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
  source: string | null;
  sourceUrl: string | null;
  verified: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberMaster {
  id: string;
  groupName: string;
  name: string;
  nameReading: string | null;
  nameRomaji: string | null;
  debutRank: number | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeriesMaster {
  id: string;
  groupName: string;
  name: string;
  releaseType: string | null;
  releaseDate: string | null;
  cardCount: number | null;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchPhotocardMasterInput {
  query?: string;
  groupName?: string;
  memberName?: string;
  series?: string;
  limit?: number;
}
