/**
 * 信頼スコア計算の入力パラメータ
 */
export interface TrustScoreInput {
  /** アカウント作成からの日数 */
  accountAgeDays: number;
  /** 総ツイート数 */
  tweetCount: number;
  /** フォロワー数 */
  followersCount: number;
  /** プロフィール画像があるか */
  hasProfileImage: boolean;
  /** 自己紹介があるか */
  hasDescription: boolean;
  /** 認証済みか（有料 or 旧認証） */
  verified: boolean;
  /** 鍵垢か */
  isProtected: boolean;
}

/**
 * 信頼スコアのグレード
 * S: 80+, A: 65-79, B: 50-64, C: 35-49, D: 0-34, U: 未評価
 */
export type TrustGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'U';

/**
 * 信頼スコア計算の結果
 */
export interface TrustScoreResult {
  /** スコア（0〜100） */
  score: number;
  /** グレード */
  grade: TrustGrade;
}

/**
 * 行動スコア計算の入力パラメータ
 */
export interface BehaviorScoreInput {
  /** トレード完了数 */
  completedTradeCount: number;
  /** トレード成功率（0-100%） */
  tradeSuccessRate: number;
  /** 平均応答時間（時間） */
  avgResponseTimeHours: number | null;
  /** 初回トレードからの日数 */
  daysSinceFirstTrade: number | null;
}

/**
 * レビュースコア計算の入力パラメータ
 */
export interface ReviewScoreInput {
  /** 平均評価（1.0-5.0） */
  avgRating: number | null;
  /** レビュー件数 */
  reviewCount: number;
  /** ポジティブ評価件数（4以上） */
  positiveCount: number;
  /** ネガティブ評価件数（2以下） */
  negativeCount: number;
}

/**
 * メール認証スコア計算の入力パラメータ
 */
export interface EmailVerificationInput {
  /** メールアドレスが認証済みか */
  emailVerified: boolean;
}

/**
 * 3要素統合スコアの結果（旧バージョン互換）
 * @deprecated calcCombinedTrustScoreWithEmail を使用してください
 */
export interface CombinedTrustScoreResult {
  /** 合計スコア（0〜100） */
  totalScore: number;
  /** グレード */
  grade: TrustGrade;
  /** スコア内訳 */
  breakdown: {
    /** Xプロフィールスコア（0〜40） */
    xProfile: number;
    /** 行動スコア（0〜40） */
    behavior: number;
    /** レビュースコア（0〜20） */
    review: number;
  };
}

/**
 * 4要素統合スコアの結果（メール認証含む）
 */
export interface CombinedTrustScoreWithEmailResult {
  /** 合計スコア（0〜100） */
  totalScore: number;
  /** グレード */
  grade: TrustGrade;
  /** スコア内訳 */
  breakdown: {
    /** Xプロフィールスコア（0〜35） */
    xProfile: number;
    /** 行動スコア（0〜35） */
    behavior: number;
    /** レビュースコア（0〜20） */
    review: number;
    /** メール認証スコア（0〜10） */
    emailVerification: number;
  };
}

/**
 * X API から取得するユーザープロフィール
 */
export interface XUserProfile {
  id: string;
  username: string;
  name: string;
  created_at: string; // ISO 8601
  description: string | null;
  profile_image_url: string | null;
  protected: boolean;
  verified: boolean;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
}

/**
 * 信頼スコアジョブのステータス
 */
export type TrustJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

// =====================================
// 新しい3軸スコアリングシステム
// =====================================

/**
 * 新しい信頼性グレード
 * S: 90+, A: 75-89, B: 60-74, C: 45-59, D: 30-44, E: 0-29
 */
export type NewTrustGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Twitter スコアの詳細
 */
export interface TwitterScoreDetails {
  /** スコア（0〜40） */
  score: number;
  /** アカウント年齢（日数） */
  accountAgeDays: number;
  /** フォロワー数 */
  followerCount: number;
  /** 月平均投稿数 */
  postFrequency: number;
  /** 認証バッジの有無 */
  hasVerifiedBadge: boolean;
}

/**
 * トータル取引スコアの詳細
 */
export interface TotalTradeScoreDetails {
  /** スコア（0〜40） */
  score: number;
  /** 成約率（0〜1） */
  completionRate: number;
  /** 取引総数 */
  totalCount: number;
  /** トラブル率（0〜1） */
  troubleRate: number;
  /** 平均評価（0〜5） */
  averageRating: number;
}

/**
 * 直近取引スコアの詳細
 */
export interface RecentTradeScoreDetails {
  /** スコア（0〜20） */
  score: number;
  /** 直近10件の成約率（0〜1） */
  completionRate: number;
  /** 直近の平均評価（0〜5） */
  averageRating: number;
  /** 直近のトラブル率（0〜1） */
  troubleRate: number;
}

/**
 * 新しい3軸信頼性スコアの結果
 */
export interface TrustScoreBreakdown {
  /** 総合スコア（0〜100） */
  total: number;
  /** グレード */
  grade: NewTrustGrade;
  /** Twitter アカウント信頼性 */
  twitter: TwitterScoreDetails;
  /** トータル取引信頼性 */
  totalTrade: TotalTradeScoreDetails;
  /** 直近取引信頼性 */
  recentTrade: RecentTradeScoreDetails;
}

/**
 * 信頼スコア履歴エントリ
 */
export interface TrustScoreHistoryEntry {
  id: string;
  userId: string;
  trustScore: number;
  twitterScore: number;
  totalTradeScore: number;
  recentTradeScore: number;
  reason: string | null;
  createdAt: Date;
}

/**
 * 新しいスコア計算の入力データ
 */
export interface NewTrustScoreInput {
  // Twitter データ
  xAccountCreatedAt?: Date;
  xFollowersCount?: number;
  xStatusesCount?: number;
  xVerified?: boolean;

  // 取引データ
  totalTrades: number;
  completedTrades: number;
  troubledTrades: number;
  averageRating: number;
  recentTrades: Array<{
    completed: boolean;
    troubled: boolean;
    rating: number;
  }>;
}
