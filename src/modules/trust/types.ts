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
 * 3要素統合スコアの結果
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
