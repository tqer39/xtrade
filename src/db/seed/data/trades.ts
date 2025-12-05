/**
 * トレードのフィクスチャデータ
 */
export const seedTrades = [
  {
    id: 'trade-001',
    roomSlug: 'sample-trade-room-1',
    initiatorUserId: 'test-user-1',
    responderUserId: 'test-user-2',
    status: 'proposed',
  },
  {
    id: 'trade-002',
    roomSlug: 'sample-trade-room-2',
    initiatorUserId: 'test-user-2',
    responderUserId: 'test-user-1',
    status: 'draft',
  },
  {
    id: 'trade-003',
    roomSlug: 'sample-trade-room-3',
    initiatorUserId: 'test-admin',
    responderUserId: 'test-user-1',
    status: 'completed',
  },
] as const;

/**
 * トレードアイテムのフィクスチャデータ
 */
export const seedTradeItems = [
  // trade-001 のアイテム
  {
    id: 'trade-item-001',
    tradeId: 'trade-001',
    offeredByUserId: 'test-user-1',
    cardId: 'card-pokemon-001',
    quantity: 1,
  },
  {
    id: 'trade-item-002',
    tradeId: 'trade-001',
    offeredByUserId: 'test-user-2',
    cardId: 'card-yugioh-001',
    quantity: 1,
  },

  // trade-003 のアイテム
  {
    id: 'trade-item-003',
    tradeId: 'trade-003',
    offeredByUserId: 'test-admin',
    cardId: 'card-mtg-001',
    quantity: 1,
  },
  {
    id: 'trade-item-004',
    tradeId: 'trade-003',
    offeredByUserId: 'test-user-1',
    cardId: 'card-onepiece-001',
    quantity: 2,
  },
] as const;

/**
 * トレード履歴のフィクスチャデータ
 */
export const seedTradeHistory = [
  {
    id: 'trade-history-001',
    tradeId: 'trade-001',
    fromStatus: 'draft',
    toStatus: 'proposed',
    changedByUserId: 'test-user-1',
    reason: '出品開始',
  },
  {
    id: 'trade-history-002',
    tradeId: 'trade-003',
    fromStatus: 'draft',
    toStatus: 'proposed',
    changedByUserId: 'test-admin',
    reason: '出品開始',
  },
  {
    id: 'trade-history-003',
    tradeId: 'trade-003',
    fromStatus: 'proposed',
    toStatus: 'agreed',
    changedByUserId: 'test-user-1',
    reason: '取引に合意',
  },
  {
    id: 'trade-history-004',
    tradeId: 'trade-003',
    fromStatus: 'agreed',
    toStatus: 'completed',
    changedByUserId: 'test-admin',
    reason: '取引完了',
  },
] as const;
