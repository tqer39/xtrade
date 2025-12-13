import type {
  BehaviorScoreInput,
  CombinedTrustScoreResult,
  CombinedTrustScoreWithEmailResult,
  EmailVerificationInput,
  NewTrustGrade,
  NewTrustScoreInput,
  RecentTradeScoreDetails,
  ReviewScoreInput,
  TotalTradeScoreDetails,
  TrustGrade,
  TrustScoreBreakdown,
  TrustScoreInput,
  TrustScoreResult,
  TwitterScoreDetails,
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
 * Xプロフィールスコアを計算する（0〜35点）
 *
 * 既存の calcTrustScore を0.35倍にスケール
 * ※ メール認証スコア導入に伴い、40点から35点に変更
 */
export function calcXProfileScore(p: TrustScoreInput): number {
  const result = calcTrustScore(p);
  // 100点満点を35点満点にスケール
  return Math.round((result.score / 100) * 35);
}

/**
 * 行動スコアを計算する（0〜35点）
 *
 * ※ メール認証スコア導入に伴い、40点から35点に変更
 */
export function calcBehaviorScore(p: BehaviorScoreInput): number {
  let score = 0;

  // トレード完了数（最大 +17）
  if (p.completedTradeCount >= 20) {
    score += 17;
  } else if (p.completedTradeCount >= 10) {
    score += 13;
  } else if (p.completedTradeCount >= 5) {
    score += 9;
  } else if (p.completedTradeCount >= 1) {
    score += 4;
  }

  // トレード成功率（最大 +9、5件以上のトレードが必要）
  const totalTrades =
    p.completedTradeCount > 0 ? p.completedTradeCount / (p.tradeSuccessRate / 100) : 0;
  if (totalTrades >= 5) {
    if (p.tradeSuccessRate >= 90) {
      score += 9;
    } else if (p.tradeSuccessRate >= 80) {
      score += 6;
    } else if (p.tradeSuccessRate >= 70) {
      score += 3;
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

  // 活動期間（最大 +4）
  if (p.daysSinceFirstTrade !== null) {
    if (p.daysSinceFirstTrade >= 180) {
      score += 4;
    } else if (p.daysSinceFirstTrade >= 30) {
      score += 2;
    }
  }

  return Math.max(0, Math.min(35, score));
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
 * メール認証スコアを計算する（0〜10点）
 */
export function calcEmailVerificationScore(p: EmailVerificationInput): number {
  return p.emailVerified ? 10 : 0;
}

/**
 * 3要素を統合した信頼スコアを計算する
 * @deprecated calcCombinedTrustScoreWithEmail を使用してください
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

/**
 * 4要素を統合した信頼スコアを計算する（メール認証含む）
 *
 * 配分:
 * - Xプロフィール: 0〜35点
 * - 行動スコア: 0〜35点
 * - レビュースコア: 0〜20点
 * - メール認証: 0〜10点
 * - 合計: 0〜100点
 */
export function calcCombinedTrustScoreWithEmail(
  xProfileInput: TrustScoreInput,
  behaviorInput: BehaviorScoreInput,
  reviewInput: ReviewScoreInput,
  emailInput: EmailVerificationInput
): CombinedTrustScoreWithEmailResult {
  const xProfileScore = calcXProfileScore(xProfileInput);
  const behaviorScore = calcBehaviorScore(behaviorInput);
  const reviewScore = calcReviewScore(reviewInput);
  const emailVerificationScore = calcEmailVerificationScore(emailInput);

  const totalScore = xProfileScore + behaviorScore + reviewScore + emailVerificationScore;

  return {
    totalScore,
    grade: scoreToGrade(totalScore),
    breakdown: {
      xProfile: xProfileScore,
      behavior: behaviorScore,
      review: reviewScore,
      emailVerification: emailVerificationScore,
    },
  };
}

// =====================================
// 新しい3軸スコアリングシステム
// =====================================

/**
 * 新しいスコアをグレードに変換
 * S: 90+, A: 75-89, B: 60-74, C: 45-59, D: 30-44, E: 0-29
 */
function scoreToNewGrade(score: number): NewTrustGrade {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'E';
}

/**
 * Twitter スコアを計算する（0〜40点）
 */
export function calcTwitterScore(input: NewTrustScoreInput): TwitterScoreDetails {
  let score = 0;
  let accountAgeDays = 0;
  let postFrequency = 0;

  // アカウント年齢（最大15点）
  if (input.xAccountCreatedAt) {
    accountAgeDays = Math.floor(
      (Date.now() - input.xAccountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    // 月ごとに0.5点、最大15点
    score += Math.min(15, Math.floor(accountAgeDays / 30) * 0.5);
  }

  // フォロワー数（最大10点）
  if (input.xFollowersCount) {
    // 対数スケールで評価
    score += Math.min(10, Math.log10(input.xFollowersCount + 1) * 2);
  }

  // 投稿頻度（最大10点）
  if (input.xStatusesCount && input.xAccountCreatedAt) {
    const monthsSinceCreation = Math.max(
      1,
      (Date.now() - input.xAccountCreatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    postFrequency = input.xStatusesCount / monthsSinceCreation;
    score += Math.min(10, Math.log10(postFrequency + 1) * 3);
  }

  // 認証バッジ（5点）
  if (input.xVerified) {
    score += 5;
  }

  return {
    score: Math.round(Math.max(0, Math.min(40, score))),
    accountAgeDays,
    followerCount: input.xFollowersCount ?? 0,
    postFrequency: Math.round(postFrequency * 10) / 10,
    hasVerifiedBadge: input.xVerified ?? false,
  };
}

/**
 * トータル取引スコアを計算する（0〜40点）
 */
export function calcTotalTradeScore(input: NewTrustScoreInput): TotalTradeScoreDetails {
  let score = 0;

  const completionRate = input.totalTrades > 0 ? input.completedTrades / input.totalTrades : 0;
  const troubleRate = input.totalTrades > 0 ? input.troubledTrades / input.totalTrades : 0;

  // 成約率（最大15点）
  score += completionRate * 15;

  // 取引総数（最大10点）
  score += Math.min(10, Math.log10(input.totalTrades + 1) * 3);

  // トラブル率（マイナス10点まで）
  score -= troubleRate * 10;

  // 平均評価（最大5点）
  score += (input.averageRating / 5) * 5;

  return {
    score: Math.round(Math.max(0, Math.min(40, score))),
    completionRate: Math.round(completionRate * 100) / 100,
    totalCount: input.totalTrades,
    troubleRate: Math.round(troubleRate * 100) / 100,
    averageRating: Math.round(input.averageRating * 10) / 10,
  };
}

/**
 * 直近取引スコアを計算する（0〜20点）
 */
export function calcRecentTradeScore(input: NewTrustScoreInput): RecentTradeScoreDetails {
  const recent = input.recentTrades.slice(0, 10);

  if (recent.length === 0) {
    return {
      score: 0,
      completionRate: 0,
      averageRating: 0,
      troubleRate: 0,
    };
  }

  const completed = recent.filter((t) => t.completed).length;
  const troubled = recent.filter((t) => t.troubled).length;
  const totalRating = recent.reduce((sum, t) => sum + t.rating, 0);

  const completionRate = completed / recent.length;
  const troubleRate = troubled / recent.length;
  const averageRating = totalRating / recent.length;

  let score = 0;
  // 成約率（最大10点）
  score += completionRate * 10;
  // トラブル率（マイナス5点まで）
  score -= troubleRate * 5;
  // 平均評価（最大5点）
  score += (averageRating / 5) * 5;

  return {
    score: Math.round(Math.max(0, Math.min(20, score))),
    completionRate: Math.round(completionRate * 100) / 100,
    averageRating: Math.round(averageRating * 10) / 10,
    troubleRate: Math.round(troubleRate * 100) / 100,
  };
}

/**
 * 新しい3軸信頼性スコアを計算する
 *
 * 配分:
 * - Twitter アカウント信頼性: 0〜40点
 * - トータル取引信頼性: 0〜40点
 * - 直近取引信頼性: 0〜20点
 * - 合計: 0〜100点
 */
export function calcNewTrustScore(input: NewTrustScoreInput): TrustScoreBreakdown {
  const twitter = calcTwitterScore(input);
  const totalTrade = calcTotalTradeScore(input);
  const recentTrade = calcRecentTradeScore(input);

  const total = twitter.score + totalTrade.score + recentTrade.score;
  const grade = scoreToNewGrade(total);

  return {
    total,
    grade,
    twitter,
    totalTrade,
    recentTrade,
  };
}
