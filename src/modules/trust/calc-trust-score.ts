import type {
  BehaviorScoreInput,
  CombinedTrustScoreResult,
  ReviewScoreInput,
  TrustGrade,
  TrustScoreInput,
  TrustScoreResult,
} from './types';

/**
 * スコアをグレードに変換
 * S: 80+, A: 65-79, B: 50-64, C: 35-49, D: 0-34
 */
function scoreToGrade(score: number): TrustGrade {
  if (score >= 80) return 'S';
  if (score >= 65) return 'A';
  if (score >= 50) return 'B';
  if (score >= 35) return 'C';
  return 'D';
}

/**
 * 信頼スコアを計算する
 *
 * @param p - 計算に使用する入力パラメータ
 * @returns スコア（0〜100）とグレード
 *
 * @example
 * ```ts
 * const result = calcTrustScore({
 *   accountAgeDays: 1000,
 *   tweetCount: 500,
 *   followersCount: 300,
 *   hasProfileImage: true,
 *   hasDescription: true,
 *   verified: false,
 *   isProtected: false,
 * })
 * // { score: 55, grade: 'B' }
 * ```
 */
export function calcTrustScore(p: TrustScoreInput): TrustScoreResult {
  let score = 0;

  // アカウント年齢（最大 +30、最小 -20）
  if (p.accountAgeDays >= 365 * 5) {
    score += 30;
  } else if (p.accountAgeDays >= 365 * 2) {
    score += 20;
  } else if (p.accountAgeDays >= 180) {
    score += 10;
  } else if (p.accountAgeDays >= 30) {
    score += 5;
  } else {
    score -= 20;
  }

  // ツイート数（最大 +25、最小 -10）
  if (p.tweetCount >= 5000) {
    score += 25;
  } else if (p.tweetCount >= 1000) {
    score += 15;
  } else if (p.tweetCount >= 200) {
    score += 5;
  } else if (p.tweetCount === 0) {
    score -= 10;
  }

  // フォロワー数（最大 +20）
  if (p.followersCount >= 1000) {
    score += 20;
  } else if (p.followersCount >= 200) {
    score += 10;
  } else if (p.followersCount >= 50) {
    score += 5;
  }

  // プロフィール画像（+10 or -15）
  if (p.hasProfileImage) {
    score += 10;
  } else {
    score -= 15;
  }

  // 自己紹介（+5）
  if (p.hasDescription) {
    score += 5;
  }

  // 認証済み（+10）
  if (p.verified) {
    score += 10;
  }

  // 鍵垢（-10）
  if (p.isProtected) {
    score -= 10;
  }

  // スコアを 0〜100 の範囲に収める
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    grade: scoreToGrade(finalScore),
  };
}

/**
 * Xプロフィールスコアを計算する（0〜40点）
 *
 * 既存の calcTrustScore を0.4倍にスケール
 */
export function calcXProfileScore(p: TrustScoreInput): number {
  const result = calcTrustScore(p);
  // 100点満点を40点満点にスケール
  return Math.round((result.score / 100) * 40);
}

/**
 * 行動スコアを計算する（0〜40点）
 */
export function calcBehaviorScore(p: BehaviorScoreInput): number {
  let score = 0;

  // トレード完了数（最大 +20）
  if (p.completedTradeCount >= 20) {
    score += 20;
  } else if (p.completedTradeCount >= 10) {
    score += 15;
  } else if (p.completedTradeCount >= 5) {
    score += 10;
  } else if (p.completedTradeCount >= 1) {
    score += 5;
  }

  // トレード成功率（最大 +10、5件以上のトレードが必要）
  const totalTrades =
    p.completedTradeCount > 0 ? p.completedTradeCount / (p.tradeSuccessRate / 100) : 0;
  if (totalTrades >= 5) {
    if (p.tradeSuccessRate >= 90) {
      score += 10;
    } else if (p.tradeSuccessRate >= 80) {
      score += 7;
    } else if (p.tradeSuccessRate >= 70) {
      score += 4;
    }
  }

  // 応答速度（最大 +5）
  if (p.avgResponseTimeHours !== null) {
    if (p.avgResponseTimeHours <= 24) {
      score += 5;
    } else if (p.avgResponseTimeHours <= 48) {
      score += 3;
    }
  }

  // 活動期間（最大 +5）
  if (p.daysSinceFirstTrade !== null) {
    if (p.daysSinceFirstTrade >= 180) {
      score += 5;
    } else if (p.daysSinceFirstTrade >= 30) {
      score += 3;
    }
  }

  return Math.max(0, Math.min(40, score));
}

/**
 * レビュースコアを計算する（0〜20点）
 */
export function calcReviewScore(p: ReviewScoreInput): number {
  let score = 0;

  // 平均評価（最大 +12、3件以上のレビューが必要）
  if (p.reviewCount >= 3 && p.avgRating !== null) {
    if (p.avgRating >= 4.5) {
      score += 12;
    } else if (p.avgRating >= 4.0) {
      score += 9;
    } else if (p.avgRating >= 3.5) {
      score += 6;
    } else if (p.avgRating >= 3.0) {
      score += 3;
    }
  }

  // レビュー件数ボーナス（最大 +4）
  if (p.reviewCount >= 10) {
    score += 4;
  } else if (p.reviewCount >= 5) {
    score += 2;
  }

  // ネガティブ評価ペナルティ（最大 -4）
  if (p.negativeCount >= 2) {
    score -= 4;
  } else if (p.negativeCount >= 1) {
    score -= 2;
  }

  return Math.max(0, Math.min(20, score));
}

/**
 * 3要素を統合した信頼スコアを計算する
 */
export function calcCombinedTrustScore(
  xProfileInput: TrustScoreInput,
  behaviorInput: BehaviorScoreInput,
  reviewInput: ReviewScoreInput
): CombinedTrustScoreResult {
  const xProfileScore = calcXProfileScore(xProfileInput);
  const behaviorScore = calcBehaviorScore(behaviorInput);
  const reviewScore = calcReviewScore(reviewInput);

  const totalScore = xProfileScore + behaviorScore + reviewScore;

  return {
    totalScore,
    grade: scoreToGrade(totalScore),
    breakdown: {
      xProfile: xProfileScore,
      behavior: behaviorScore,
      review: reviewScore,
    },
  };
}
