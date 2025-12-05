import type { TrustGrade, TrustScoreInput, TrustScoreResult } from './types';

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
