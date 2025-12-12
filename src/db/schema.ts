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
  // サブスクリプション関連
  subscriptionStatus: text('subscription_status').default('free'), // free|active|canceled|past_due
  subscriptionPlan: text('subscription_plan').default('free'), // free|basic|premium
  // 信頼スコア関連
  trustScore: integer('trust_score'), // 0〜100（3要素の合計）
  trustGrade: text('trust_grade'), // S/A/B/C/D/U
  // スコア内訳
  xProfileScore: integer('x_profile_score'), // 0〜40（Xプロフィールスコア）
  behaviorScore: integer('behavior_score'), // 0〜40（xtrade行動スコア）
  reviewScore: integer('review_score'), // 0〜20（レビュースコア）
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

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  trustJobs: many(userTrustJob),
  haveCards: many(userHaveCard),
  wantCards: many(userWantCard),
  cardSets: many(cardSet),
  initiatedTrades: many(trade, { relationName: 'initiatedTrades' }),
  respondedTrades: many(trade, { relationName: 'respondedTrades' }),
  offeredTradeItems: many(tradeItem),
  favoriteCards: many(userFavoriteCard),
  favoriteUsers: many(userFavoriteUser),
  // レビュー・統計関連
  reviewsGiven: many(tradeReview, { relationName: 'reviewsGiven' }),
  reviewsReceived: many(tradeReview, { relationName: 'reviewsReceived' }),
  tradeStats: one(userTradeStats),
  reviewStats: one(userReviewStats),
  // サブスクリプション関連
  stripeCustomer: one(stripeCustomer),
  subscriptions: many(subscription),
  paymentEvents: many(paymentEvent),
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
    source: text('source').default('seed'), // seed/user
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
  items: many(item),
}));

// =====================================
// アイテム関連テーブル
// =====================================

/**
 * アイテムマスターテーブル
 * ユーザーがマニュアルで登録可能、他ユーザーも検索・選択可能
 * フリーフォーマットでカードに限らず何でも交換可能
 */
export const item = pgTable(
  'item',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category'), // カテゴリは任意
    description: text('description'), // アイテムの説明
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
    index('item_name_idx').on(table.name),
    index('item_category_idx').on(table.category),
    index('item_photocard_master_id_idx').on(table.photocardMasterId),
  ]
);

// 後方互換性のためのエイリアス（既存コードで card を使用している場合）
export const card = item;

export const itemRelations = relations(item, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [item.createdByUserId],
    references: [user.id],
  }),
  photocardMaster: one(photocardMaster, {
    fields: [item.photocardMasterId],
    references: [photocardMaster.id],
  }),
  haveItems: many(userHaveCard),
  wantItems: many(userWantCard),
  cardSetItems: many(cardSetItem),
  tradeItems: many(tradeItem),
}));

// 後方互換性のためのエイリアス
export const cardRelations = itemRelations;

/**
 * ユーザーが持っているアイテムテーブル
 */
export const userHaveCard = pgTable(
  'user_have_card',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    cardId: text('card_id') // TODO: itemId に変更予定
      .notNull()
      .references(() => item.id, { onDelete: 'cascade' }),
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
 * ユーザーが欲しいアイテムテーブル
 */
export const userWantCard = pgTable(
  'user_want_card',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    cardId: text('card_id') // TODO: itemId に変更予定
      .notNull()
      .references(() => item.id, { onDelete: 'cascade' }),
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
  reviews: many(tradeReview),
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
// お気に入り関連テーブル
// =====================================

/**
 * ユーザーがお気に入りにしたアイテムテーブル
 */
export const userFavoriteCard = pgTable(
  'user_favorite_card',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => card.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('user_favorite_card_user_id_idx').on(table.userId),
    index('user_favorite_card_card_id_idx').on(table.cardId),
    unique('user_favorite_card_user_card_unique').on(table.userId, table.cardId),
  ]
);

export const userFavoriteCardRelations = relations(userFavoriteCard, ({ one }) => ({
  user: one(user, {
    fields: [userFavoriteCard.userId],
    references: [user.id],
  }),
  card: one(card, {
    fields: [userFavoriteCard.cardId],
    references: [card.id],
  }),
}));

/**
 * ユーザーがお気に入りにしたユーザーテーブル
 */
export const userFavoriteUser = pgTable(
  'user_favorite_user',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    favoriteUserId: text('favorite_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('user_favorite_user_user_id_idx').on(table.userId),
    index('user_favorite_user_favorite_user_id_idx').on(table.favoriteUserId),
    unique('user_favorite_user_unique').on(table.userId, table.favoriteUserId),
  ]
);

export const userFavoriteUserRelations = relations(userFavoriteUser, ({ one }) => ({
  user: one(user, {
    fields: [userFavoriteUser.userId],
    references: [user.id],
  }),
  favoriteUser: one(user, {
    fields: [userFavoriteUser.favoriteUserId],
    references: [user.id],
  }),
}));

// =====================================
// トレードレビュー関連テーブル
// =====================================

/**
 * トレードレビューテーブル
 * トレード完了後に相手ユーザーを評価
 */
export const tradeReview = pgTable(
  'trade_review',
  {
    id: text('id').primaryKey(),
    tradeId: text('trade_id')
      .notNull()
      .references(() => trade.id, { onDelete: 'cascade' }),
    reviewerUserId: text('reviewer_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    revieweeUserId: text('reviewee_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5
    comment: text('comment'),
    isPublic: boolean('is_public').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique('trade_review_unique').on(table.tradeId, table.reviewerUserId),
    index('trade_review_trade_id_idx').on(table.tradeId),
    index('trade_review_reviewer_idx').on(table.reviewerUserId),
    index('trade_review_reviewee_idx').on(table.revieweeUserId),
    index('trade_review_rating_idx').on(table.rating),
  ]
);

export const tradeReviewRelations = relations(tradeReview, ({ one }) => ({
  trade: one(trade, {
    fields: [tradeReview.tradeId],
    references: [trade.id],
  }),
  reviewer: one(user, {
    fields: [tradeReview.reviewerUserId],
    references: [user.id],
    relationName: 'reviewsGiven',
  }),
  reviewee: one(user, {
    fields: [tradeReview.revieweeUserId],
    references: [user.id],
    relationName: 'reviewsReceived',
  }),
}));

// =====================================
// ユーザー統計テーブル（キャッシュ）
// =====================================

/**
 * ユーザートレード統計テーブル
 * トレード完了・キャンセル時に更新されるキャッシュ
 */
export const userTradeStats = pgTable('user_trade_stats', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  completedCount: integer('completed_count').default(0).notNull(),
  canceledCount: integer('canceled_count').default(0).notNull(),
  disputedCount: integer('disputed_count').default(0).notNull(),
  avgResponseTimeHours: integer('avg_response_time_hours'), // 平均応答時間（時間）
  firstTradeAt: timestamp('first_trade_at'),
  lastTradeAt: timestamp('last_trade_at'),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const userTradeStatsRelations = relations(userTradeStats, ({ one }) => ({
  user: one(user, {
    fields: [userTradeStats.userId],
    references: [user.id],
  }),
}));

/**
 * ユーザーレビュー統計テーブル
 * レビュー作成時に更新されるキャッシュ
 */
export const userReviewStats = pgTable('user_review_stats', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  reviewCount: integer('review_count').default(0).notNull(),
  avgRating: integer('avg_rating'), // 平均評価×10（小数点1桁保持、例: 45 = 4.5）
  positiveCount: integer('positive_count').default(0).notNull(), // rating >= 4
  negativeCount: integer('negative_count').default(0).notNull(), // rating <= 2
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const userReviewStatsRelations = relations(userReviewStats, ({ one }) => ({
  user: one(user, {
    fields: [userReviewStats.userId],
    references: [user.id],
  }),
}));

// =====================================
// Stripe サブスクリプション関連テーブル
// =====================================

/**
 * Stripe 顧客テーブル
 * ユーザーと Stripe Customer の紐付け
 */
export const stripeCustomer = pgTable(
  'stripe_customer',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    stripeCustomerId: text('stripe_customer_id').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('stripe_customer_user_id_idx').on(table.userId),
    index('stripe_customer_stripe_id_idx').on(table.stripeCustomerId),
  ]
);

export const stripeCustomerRelations = relations(stripeCustomer, ({ one }) => ({
  user: one(user, {
    fields: [stripeCustomer.userId],
    references: [user.id],
  }),
}));

/**
 * サブスクリプションテーブル
 * ユーザーの契約状態を管理
 */
export const subscription = pgTable(
  'subscription',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
    stripePriceId: text('stripe_price_id').notNull(),
    status: text('status').notNull(), // active|canceled|past_due|paused|trialing|incomplete|incomplete_expired
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    canceledAt: timestamp('canceled_at'),
    endedAt: timestamp('ended_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('subscription_user_id_idx').on(table.userId),
    index('subscription_stripe_id_idx').on(table.stripeSubscriptionId),
    index('subscription_status_idx').on(table.status),
  ]
);

export const subscriptionRelations = relations(subscription, ({ one, many }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
  paymentEvents: many(paymentEvent),
}));

/**
 * 支払いイベントテーブル
 * Webhook イベントの記録（冪等性担保・監査ログ）
 */
export const paymentEvent = pgTable(
  'payment_event',
  {
    id: text('id').primaryKey(),
    stripeEventId: text('stripe_event_id').notNull().unique(),
    eventType: text('event_type').notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    subscriptionId: text('subscription_id').references(() => subscription.id, {
      onDelete: 'set null',
    }),
    payload: text('payload'), // JSON string
    processedAt: timestamp('processed_at'),
    error: text('error'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('payment_event_stripe_event_id_idx').on(table.stripeEventId),
    index('payment_event_type_idx').on(table.eventType),
    index('payment_event_user_id_idx').on(table.userId),
  ]
);

export const paymentEventRelations = relations(paymentEvent, ({ one }) => ({
  user: one(user, {
    fields: [paymentEvent.userId],
    references: [user.id],
  }),
  subscription: one(subscription, {
    fields: [paymentEvent.subscriptionId],
    references: [subscription.id],
  }),
}));

// =====================================
// User リレーション拡張
// =====================================

// TODO(DBAgent): 今後、以下のテーブルを追加予定
// - reports: 通報テーブル
