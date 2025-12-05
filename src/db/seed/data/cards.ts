/**
 * カードマスタのフィクスチャデータ
 */
export const seedCards = [
  // ポケモンカード
  {
    id: 'card-pokemon-001',
    name: 'ピカチュウ VMAX',
    category: 'ポケモンカード',
    rarity: 'RRR',
  },
  {
    id: 'card-pokemon-002',
    name: 'リザードン ex',
    category: 'ポケモンカード',
    rarity: 'SAR',
  },
  {
    id: 'card-pokemon-003',
    name: 'ミュウツー VSTAR',
    category: 'ポケモンカード',
    rarity: 'SR',
  },
  {
    id: 'card-pokemon-004',
    name: 'カイリュー V',
    category: 'ポケモンカード',
    rarity: 'RR',
  },
  {
    id: 'card-pokemon-005',
    name: 'ルカリオ VMAX',
    category: 'ポケモンカード',
    rarity: 'RRR',
  },

  // 遊戯王
  {
    id: 'card-yugioh-001',
    name: '青眼の白龍',
    category: '遊戯王',
    rarity: 'UR',
  },
  {
    id: 'card-yugioh-002',
    name: 'ブラック・マジシャン',
    category: '遊戯王',
    rarity: 'UR',
  },
  {
    id: 'card-yugioh-003',
    name: '死者蘇生',
    category: '遊戯王',
    rarity: 'SR',
  },
  {
    id: 'card-yugioh-004',
    name: '灰流うらら',
    category: '遊戯王',
    rarity: 'SR',
  },
  {
    id: 'card-yugioh-005',
    name: '増殖するG',
    category: '遊戯王',
    rarity: 'SR',
  },

  // マジック：ザ・ギャザリング
  {
    id: 'card-mtg-001',
    name: 'Black Lotus',
    category: 'MTG',
    rarity: 'Mythic Rare',
  },
  {
    id: 'card-mtg-002',
    name: 'Mox Pearl',
    category: 'MTG',
    rarity: 'Rare',
  },
  {
    id: 'card-mtg-003',
    name: 'Time Walk',
    category: 'MTG',
    rarity: 'Rare',
  },

  // ワンピースカード
  {
    id: 'card-onepiece-001',
    name: 'モンキー・D・ルフィ（ギア5）',
    category: 'ワンピースカード',
    rarity: 'SEC',
  },
  {
    id: 'card-onepiece-002',
    name: 'シャンクス',
    category: 'ワンピースカード',
    rarity: 'L',
  },
] as const;
