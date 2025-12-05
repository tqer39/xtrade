import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

/**
 * BetterAuth が使用するユーザーテーブル
 * X (Twitter) OAuth でログインしたユーザーの基本情報を保存
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  twitterUsername: text('twitter_username'), // X ユーザー名（@なし）
  role: text('role').default('user').notNull(), // 'admin' | 'user'
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  // 信頼スコア関連
  trustScore: integer('trust_score'), // 0〜100
  trustGrade: text('trust_grade'), // S/A/B/C/D/U
  trustScoreUpdatedAt: timestamp('trust_score_updated_at'),
  trustScoreRefreshRequestedAt: timestamp('trust_score_refresh_requested_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * BetterAuth が使用するセッションテーブル
 * ログインセッションの管理
 */
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)]
);

/**
 * BetterAuth が使用する OAuth アカウントテーブル
 * X (Twitter) などの外部サービスとの連携情報を保存
 */
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)]
);

/**
 * BetterAuth が使用する検証テーブル
 * メール確認トークンなどの一時的な検証情報を保存
 */
export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
);

// =====================================
// Drizzle ORM Relations
// =====================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  trustJobs: many(userTrustJob),
  haveCards: many(userHaveCard),
  wantCards: many(userWantCard),
  cardSets: many(cardSet),
  initiatedTrades: many(trade, { relationName: 'initiatedTrades' }),
  respondedTrades: many(trade, { relationName: 'respondedTrades' }),
  offeredTradeItems: many(tradeItem),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// =====================================
// xtrade 独自のテーブル
// =====================================

/**
 * ログイン許可ユーザーのホワイトリストテーブル
 * 管理者が X ユーザー名で許可するユーザーを管理
 */
export const allowedUser = pgTable(
  'allowed_user',
  {
    id: text('id').primaryKey(),
    twitterUsername: text('twitter_username').notNull().unique(),
    addedBy: text('added_by')
      .notNull()
      .references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('allowed_user_twitter_username_idx').on(table.twitterUsername)]
);

export const allowedUserRelations = relations(allowedUser, ({ one }) => ({
  addedByUser: one(user, {
    fields: [allowedUser.addedBy],
    references: [user.id],
  }),
}));

// =====================================
// 信頼スコア再計算キュー
// =====================================

/**
 * 信頼スコア再計算ジョブテーブル
 * X API のレートリミット対策として非同期でキュー処理
 */
export const userTrustJob = pgTable(
  'user_trust_job',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('queued'), // queued | running | succeeded | failed
    createdAt: timestamp('created_at').defaultNow().notNull(),
    startedAt: timestamp('started_at'),
    finishedAt: timestamp('finished_at'),
    errorMessage: text('error_message'),
  },
  (table) => [
    index('user_trust_job_user_id_idx').on(table.userId),
    index('user_trust_job_status_idx').on(table.status),
    index('user_trust_job_created_at_idx').on(table.createdAt),
  ]
);

export const userTrustJobRelations = relations(userTrustJob, ({ one }) => ({
  user: one(user, {
    fields: [userTrustJob.userId],
    references: [user.id],
  }),
}));

// =====================================
// フォトカードマスターデータ
// =====================================

/**
 * メンバーマスターテーブル
 * アイドルグループのメンバー情報を管理
 */
export const memberMaster = pgTable(
  'member_master',
  {
    id: text('id').primaryKey(),
    groupName: text('group_name').notNull(), // グループ名（例: "INI"）
    name: text('name').notNull(), // メンバー名
    nameReading: text('name_reading'), // ひらがな読み
    nameRomaji: text('name_romaji'), // ローマ字
    debutRank: integer('debut_rank'), // デビュー順位
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('member_master_group_name_idx').on(table.groupName),
    index('member_master_name_idx').on(table.name),
  ]
);

/**
 * シリーズマスターテーブル
 * CD・アルバム・ライブなどのシリーズ情報を管理
 */
export const seriesMaster = pgTable(
  'series_master',
  {
    id: text('id').primaryKey(),
    groupName: text('group_name').notNull(), // グループ名
    name: text('name').notNull(), // シリーズ名
    releaseType: text('release_type'), // album/single/live_goods
    releaseDate: text('release_date'), // リリース日（YYYY-MM-DD）
    cardCount: integer('card_count'), // トレカ枚数
    sourceUrl: text('source_url'), // 参照元URL
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('series_master_group_name_idx').on(table.groupName),
    index('series_master_name_idx').on(table.name),
  ]
);

/**
 * フォトカードマスターテーブル
 * トレカの公式データを管理、ユーザーのカード登録時に候補として使用
 */
export const photocardMaster = pgTable(
  'photocard_master',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(), // カード名
    normalizedName: text('normalized_name'), // 検索用正規化名
    groupName: text('group_name'), // グループ名（例: "INI"）
    memberName: text('member_name'), // メンバー名
    memberNameReading: text('member_name_reading'), // ひらがな読み
    series: text('series'), // シリーズ名
    releaseType: text('release_type'), // album/single/live_goods
    releaseDate: text('release_date'), // リリース日
    rarity: text('rarity'), // レアリティ
    imageUrl: text('image_url'),
    source: text('source').default('seed'), // seed/user/scrape
    sourceUrl: text('source_url'), // 参照元URL
    verified: boolean('verified').default(false), // 検証済みフラグ
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('photocard_master_name_idx').on(table.name),
    index('photocard_master_group_idx').on(table.groupName),
    index('photocard_master_member_idx').on(table.memberName),
    index('photocard_master_series_idx').on(table.series),
  ]
);

export const memberMasterRelations = relations(memberMaster, ({ many }) => ({
  photocards: many(photocardMaster),
}));

export const seriesMasterRelations = relations(seriesMaster, ({ many }) => ({
  photocards: many(photocardMaster),
}));

export const photocardMasterRelations = relations(photocardMaster, ({ many }) => ({
  cards: many(card),
}));

// =====================================
// カード関連テーブル
// =====================================

/**
 * カードマスターテーブル
 * ユーザーがマニュアルで登録可能、他ユーザーも検索・選択可能
 */
export const card = pgTable(
  'card',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    rarity: text('rarity'),
    imageUrl: text('image_url'),
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    // フォトカードマスターへの参照（マスターから選択した場合に設定）
    photocardMasterId: text('photocard_master_id').references(() => photocardMaster.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('card_name_idx').on(table.name),
    index('card_category_idx').on(table.category),
    index('card_photocard_master_id_idx').on(table.photocardMasterId),
  ]
);

export const cardRelations = relations(card, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [card.createdByUserId],
    references: [user.id],
  }),
  photocardMaster: one(photocardMaster, {
    fields: [card.photocardMasterId],
    references: [photocardMaster.id],
  }),
  haveCards: many(userHaveCard),
  wantCards: many(userWantCard),
  cardSetItems: many(cardSetItem),
  tradeItems: many(tradeItem),
}));

/**
 * ユーザーが持っているカードテーブル
 */
export const userHaveCard = pgTable(
  'user_have_card',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => card.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('user_have_card_user_id_idx').on(table.userId),
    index('user_have_card_card_id_idx').on(table.cardId),
    unique('user_have_card_user_card_unique').on(table.userId, table.cardId),
  ]
);

export const userHaveCardRelations = relations(userHaveCard, ({ one }) => ({
  user: one(user, {
    fields: [userHaveCard.userId],
    references: [user.id],
  }),
  card: one(card, {
    fields: [userHaveCard.cardId],
    references: [card.id],
  }),
}));

/**
 * ユーザーが欲しいカードテーブル
 */
export const userWantCard = pgTable(
  'user_want_card',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => card.id, { onDelete: 'cascade' }),
    priority: integer('priority').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('user_want_card_user_id_idx').on(table.userId),
    index('user_want_card_card_id_idx').on(table.cardId),
    unique('user_want_card_user_card_unique').on(table.userId, table.cardId),
  ]
);

export const userWantCardRelations = relations(userWantCard, ({ one }) => ({
  user: one(user, {
    fields: [userWantCard.userId],
    references: [user.id],
  }),
  card: one(card, {
    fields: [userWantCard.cardId],
    references: [card.id],
  }),
}));

// =====================================
// カードセット関連テーブル
// =====================================

/**
 * カードセットマスターテーブル
 * ユーザーが作成・管理するカードセット（複数カードをグループ化）
 */
export const cardSet = pgTable(
  'card_set',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    isPublic: boolean('is_public').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('card_set_user_id_idx').on(table.userId)]
);

export const cardSetRelations = relations(cardSet, ({ one, many }) => ({
  user: one(user, {
    fields: [cardSet.userId],
    references: [user.id],
  }),
  items: many(cardSetItem),
}));

/**
 * カードセット内のアイテムテーブル
 * セット内のカードと数量を管理
 */
export const cardSetItem = pgTable(
  'card_set_item',
  {
    id: text('id').primaryKey(),
    setId: text('set_id')
      .notNull()
      .references(() => cardSet.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => card.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('card_set_item_set_id_idx').on(table.setId),
    unique('card_set_item_set_card_unique').on(table.setId, table.cardId),
  ]
);

export const cardSetItemRelations = relations(cardSetItem, ({ one }) => ({
  set: one(cardSet, {
    fields: [cardSetItem.setId],
    references: [cardSet.id],
  }),
  card: one(card, {
    fields: [cardSetItem.cardId],
    references: [card.id],
  }),
}));

// =====================================
// トレード関連テーブル
// =====================================

/**
 * トレードテーブル
 * ステートマシン: draft → proposed → agreed → completed/disputed/canceled/expired
 */
export const trade = pgTable(
  'trade',
  {
    id: text('id').primaryKey(),
    roomSlug: text('room_slug').notNull().unique(),
    initiatorUserId: text('initiator_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    responderUserId: text('responder_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    status: text('status').notNull().default('draft'), // draft|proposed|agreed|completed|disputed|canceled|expired
    proposedExpiredAt: timestamp('proposed_expired_at'), // 出品者が仮設定する期限
    agreedExpiredAt: timestamp('agreed_expired_at'), // 合意後の確定期限
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('trade_room_slug_idx').on(table.roomSlug),
    index('trade_initiator_idx').on(table.initiatorUserId),
    index('trade_responder_idx').on(table.responderUserId),
    index('trade_status_idx').on(table.status),
  ]
);

export const tradeRelations = relations(trade, ({ one, many }) => ({
  initiator: one(user, {
    fields: [trade.initiatorUserId],
    references: [user.id],
    relationName: 'initiatedTrades',
  }),
  responder: one(user, {
    fields: [trade.responderUserId],
    references: [user.id],
    relationName: 'respondedTrades',
  }),
  items: many(tradeItem),
  history: many(tradeHistory),
}));

/**
 * トレードアイテムテーブル
 * オファー内容を保存
 */
export const tradeItem = pgTable(
  'trade_item',
  {
    id: text('id').primaryKey(),
    tradeId: text('trade_id')
      .notNull()
      .references(() => trade.id, { onDelete: 'cascade' }),
    offeredByUserId: text('offered_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => card.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('trade_item_trade_id_idx').on(table.tradeId),
    index('trade_item_offered_by_idx').on(table.offeredByUserId),
  ]
);

export const tradeItemRelations = relations(tradeItem, ({ one }) => ({
  trade: one(trade, {
    fields: [tradeItem.tradeId],
    references: [trade.id],
  }),
  offeredBy: one(user, {
    fields: [tradeItem.offeredByUserId],
    references: [user.id],
  }),
  card: one(card, {
    fields: [tradeItem.cardId],
    references: [card.id],
  }),
}));

/**
 * トレード状態履歴テーブル
 * 状態遷移の監査ログ
 */
export const tradeHistory = pgTable(
  'trade_history',
  {
    id: text('id').primaryKey(),
    tradeId: text('trade_id')
      .notNull()
      .references(() => trade.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    changedByUserId: text('changed_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('trade_history_trade_id_idx').on(table.tradeId)]
);

export const tradeHistoryRelations = relations(tradeHistory, ({ one }) => ({
  trade: one(trade, {
    fields: [tradeHistory.tradeId],
    references: [trade.id],
  }),
  changedBy: one(user, {
    fields: [tradeHistory.changedByUserId],
    references: [user.id],
  }),
}));

// =====================================
// User リレーション拡張
// =====================================

// TODO(DBAgent): 今後、以下のテーブルを追加予定
// - reports: 通報テーブル
