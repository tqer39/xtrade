/**
 * アイテムマスタのフィクスチャデータ
 * 画像は picsum.photos を使用（様々なアスペクト比でテスト）
 */
export const seedCards = [
  // ポケモンカード
  {
    id: 'card-pokemon-001',
    name: 'ピカチュウ VMAX',
    category: 'ポケモンカード',
    description: 'レアリティ: RRR。電気タイプの強力なVMAXカード。',
    imageUrl: 'https://picsum.photos/seed/pokemon1/400/560',
  },
  {
    id: 'card-pokemon-002',
    name: 'リザードン ex',
    category: 'ポケモンカード',
    description: 'レアリティ: SAR。炎タイプのexカード、高い人気を誇る。',
    imageUrl: 'https://picsum.photos/seed/pokemon2/400/600',
  },
  {
    id: 'card-pokemon-003',
    name: 'ミュウツー VSTAR',
    category: 'ポケモンカード',
    description: 'レアリティ: SR。エスパータイプのVSTARカード。',
    imageUrl: 'https://picsum.photos/seed/pokemon3/400/500',
  },
  {
    id: 'card-pokemon-004',
    name: 'カイリュー V',
    category: 'ポケモンカード',
    description: 'レアリティ: RR。ドラゴンタイプのVカード。',
    imageUrl: 'https://picsum.photos/seed/pokemon4/400/550',
  },
  {
    id: 'card-pokemon-005',
    name: 'ルカリオ VMAX',
    category: 'ポケモンカード',
    description: 'レアリティ: RRR。格闘タイプのVMAXカード。',
    imageUrl: 'https://picsum.photos/seed/pokemon5/400/580',
  },

  // 遊戯王
  {
    id: 'card-yugioh-001',
    name: '青眼の白龍',
    category: '遊戯王',
    description: 'レアリティ: UR。遊戯王を代表する伝説のドラゴン。',
    imageUrl: 'https://picsum.photos/seed/yugioh1/400/580',
  },
  {
    id: 'card-yugioh-002',
    name: 'ブラック・マジシャン',
    category: '遊戯王',
    description: 'レアリティ: UR。武藤遊戯のエースモンスター。',
    imageUrl: 'https://picsum.photos/seed/yugioh2/400/600',
  },
  {
    id: 'card-yugioh-003',
    name: '死者蘇生',
    category: '遊戯王',
    description: 'レアリティ: SR。墓地からモンスターを蘇生する魔法カード。',
    imageUrl: 'https://picsum.photos/seed/yugioh3/400/520',
  },
  {
    id: 'card-yugioh-004',
    name: '灰流うらら',
    category: '遊戯王',
    description: 'レアリティ: SR。強力な手札誘発モンスター。',
    imageUrl: 'https://picsum.photos/seed/yugioh4/400/560',
  },
  {
    id: 'card-yugioh-005',
    name: '増殖するG',
    category: '遊戯王',
    description: 'レアリティ: SR。ドロー効果を持つ手札誘発カード。',
    imageUrl: 'https://picsum.photos/seed/yugioh5/400/540',
  },

  // マジック：ザ・ギャザリング
  {
    id: 'card-mtg-001',
    name: 'Black Lotus',
    category: 'MTG',
    description: 'レアリティ: Mythic Rare。MTG史上最も価値のあるカードの一つ。',
    imageUrl: 'https://picsum.photos/seed/mtg1/400/560',
  },
  {
    id: 'card-mtg-002',
    name: 'Mox Pearl',
    category: 'MTG',
    description: 'レアリティ: Rare。パワー9の一枚、白マナを生み出すアーティファクト。',
    imageUrl: 'https://picsum.photos/seed/mtg2/400/580',
  },
  {
    id: 'card-mtg-003',
    name: 'Time Walk',
    category: 'MTG',
    description: 'レアリティ: Rare。追加ターンを得る強力な青の呪文。',
    imageUrl: 'https://picsum.photos/seed/mtg3/400/540',
  },

  // ワンピースカード
  {
    id: 'card-onepiece-001',
    name: 'モンキー・D・ルフィ（ギア5）',
    category: 'ワンピースカード',
    description: 'レアリティ: SEC。ニカの力を覚醒したルフィ。',
    imageUrl: 'https://picsum.photos/seed/onepiece1/400/600',
  },
  {
    id: 'card-onepiece-002',
    name: 'シャンクス',
    category: 'ワンピースカード',
    description: 'レアリティ: L。四皇の一人、赤髪のシャンクス。',
    imageUrl: 'https://picsum.photos/seed/onepiece2/400/550',
  },

  // INI（アイドル）
  {
    id: 'card-ini-001',
    name: '木村柾哉',
    category: 'INI',
    description: 'INIのリーダー。ダンス担当。',
    imageUrl: 'https://picsum.photos/seed/ini1/400/500',
  },
  {
    id: 'card-ini-002',
    name: '髙塚大夢',
    category: 'INI',
    description: 'INIメンバー。ボーカル担当。',
    imageUrl: 'https://picsum.photos/seed/ini2/400/600',
  },
  {
    id: 'card-ini-003',
    name: '田島将吾',
    category: 'INI',
    description: 'INIメンバー。ダンス担当。',
    imageUrl: 'https://picsum.photos/seed/ini3/400/560',
  },
  {
    id: 'card-ini-004',
    name: '藤牧京介',
    category: 'INI',
    description: 'INIメンバー。ボーカル担当。',
    imageUrl: 'https://picsum.photos/seed/ini4/400/580',
  },
  {
    id: 'card-ini-005',
    name: '尾崎匠海',
    category: 'INI',
    description: 'INIメンバー。ラップ・ボーカル担当。',
    imageUrl: 'https://picsum.photos/seed/ini5/400/520',
  },
  {
    id: 'card-ini-006',
    name: '西洸人',
    category: 'INI',
    description: 'INIメンバー。ダンス担当。',
    imageUrl: 'https://picsum.photos/seed/ini6/400/550',
  },
  {
    id: 'card-ini-007',
    name: '松田迅',
    category: 'INI',
    description: 'INIの最年少メンバー。ダンス担当。',
    imageUrl: 'https://picsum.photos/seed/ini7/400/600',
  },
  {
    id: 'card-ini-008',
    name: '池﨑理人',
    category: 'INI',
    description: 'INIメンバー。ラップ担当。',
    imageUrl: 'https://picsum.photos/seed/ini8/400/540',
  },
  {
    id: 'card-ini-009',
    name: '佐野雄大',
    category: 'INI',
    description: 'INIメンバー。ボーカル担当。',
    imageUrl: 'https://picsum.photos/seed/ini9/400/580',
  },
  {
    id: 'card-ini-010',
    name: '許豊凡',
    category: 'INI',
    description: 'INIメンバー。中国出身。ラップ担当。',
    imageUrl: 'https://picsum.photos/seed/ini10/400/560',
  },
  {
    id: 'card-ini-011',
    name: '後藤威尊',
    category: 'INI',
    description: 'INIメンバー。ダンス担当。',
    imageUrl: 'https://picsum.photos/seed/ini11/400/600',
  },
] as const;
