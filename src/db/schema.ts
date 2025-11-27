import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * BetterAuth が使用するユーザーテーブル
 * X (Twitter) OAuth でログインしたユーザーの基本情報を保存
 */
export const users = pgTable('users', {
  // プライマリキー（UUID）
  id: uuid('id').primaryKey().defaultRandom(),

  // ユーザー名（X のユーザー名）
  name: text('name'),

  // メールアドレス（X から取得できる場合）
  email: text('email'),

  // プロフィール画像 URL
  image: text('image'),

  // メールアドレスの検証状態
  emailVerified: timestamp('email_verified'),

  // タイムスタンプ
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * BetterAuth が使用するセッションテーブル
 * ログインセッションの管理
 */
export const sessions = pgTable('sessions', {
  // プライマリキー（UUID）
  id: uuid('id').primaryKey().defaultRandom(),

  // セッショントークン
  token: text('token').notNull().unique(),

  // ユーザー ID（外部キー）
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // セッション有効期限
  expiresAt: timestamp('expires_at').notNull(),

  // IP アドレス
  ipAddress: text('ip_address'),

  // User Agent
  userAgent: text('user_agent'),

  // タイムスタンプ
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * BetterAuth が使用する OAuth アカウントテーブル
 * X (Twitter) などの外部サービスとの連携情報を保存
 */
export const accounts = pgTable('accounts', {
  // プライマリキー（UUID）
  id: uuid('id').primaryKey().defaultRandom(),

  // ユーザー ID（外部キー）
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // アカウントタイプ（例: "oauth"）
  type: text('type').notNull(),

  // プロバイダー名（例: "twitter"）
  provider: text('provider').notNull(),

  // プロバイダーから発行されたアカウント ID
  providerAccountId: text('provider_account_id').notNull(),

  // アクセストークン
  accessToken: text('access_token'),

  // リフレッシュトークン
  refreshToken: text('refresh_token'),

  // トークンの有効期限（秒）
  expiresAt: timestamp('expires_at'),

  // トークンのスコープ
  scope: text('scope'),

  // ID トークン（OIDC の場合）
  idToken: text('id_token'),

  // タイムスタンプ
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * xtrade 独自のユーザープロフィール拡張テーブル
 * users テーブルを拡張し、xtrade 固有の情報を保存
 */
export const profiles = pgTable('profiles', {
  // プライマリキー（UUID）
  id: uuid('id').primaryKey().defaultRandom(),

  // ユーザー ID（外部キー、1対1関係）
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  // 表示名（X のユーザー名とは別に設定可能）
  displayName: text('display_name'),

  // 自己紹介文
  bio: text('bio'),

  // X (Twitter) のユーザー名（@xxx）
  twitterUsername: text('twitter_username'),

  // X (Twitter) のユーザー ID
  twitterUserId: text('twitter_user_id'),

  // タイムスタンプ
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// TODO(DBAgent): 今後、以下のテーブルを追加予定
// - trades: トレード情報テーブル
// - rooms: トレーディングルームテーブル
// - trade_items: トレードアイテムテーブル
// - room_members: ルームメンバーテーブル
// - reports: 通報テーブル
