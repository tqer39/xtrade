import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MemberSeedData, PhotocardSeedData, SeriesSeedData } from '../types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_DATA_DIR = join(__dirname, '../../seed-data');

/**
 * メンバーシードデータを読み込む
 */
export function loadMemberSeedData(): MemberSeedData[] {
  const filePath = join(SEED_DATA_DIR, 'ini-members.json');
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * シリーズシードデータを読み込む
 */
export function loadSeriesSeedData(): SeriesSeedData[] {
  const filePath = join(SEED_DATA_DIR, 'ini-series.json');
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * フォトカードシードデータを読み込む
 */
export function loadPhotocardSeedData(): PhotocardSeedData[] {
  const filePath = join(SEED_DATA_DIR, 'ini-photocards.json');
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}
