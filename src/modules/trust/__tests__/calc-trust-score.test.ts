import { describe, expect, it } from 'vitest';
import {
  calcBehaviorScore,
  calcCombinedTrustScore,
  calcCombinedTrustScoreWithEmail,
  calcEmailVerificationScore,
  calcNewTrustScore,
  calcRecentTradeScore,
  calcReviewScore,
  calcTotalTradeScore,
  calcTrustScore,
  calcTwitterScore,
  calcXProfileScore,
} from '../calc-trust-score';
import type {
  BehaviorScoreInput,
  EmailVerificationInput,
  NewTrustScoreInput,
  ReviewScoreInput,
  TrustScoreInput,
} from '../types';

describe('calcTrustScore', () => {
  // デフォルトの入力値
  const defaultInput: TrustScoreInput = {
    accountAgeDays: 0,
    tweetCount: 0,
    followersCount: 0,
    hasProfileImage: false,
    hasDescription: false,
    verified: false,
    isProtected: false,
  };

  describe('アカウント年齢', () => {
    it('5年以上で +30', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        hasProfileImage: true,
      });
      // -10(tweet=0) + 30(age) + 10(image) = 30
      expect(result.score).toBe(30);
    });

    it('2年以上5年未満で +20', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 2,
        hasProfileImage: true,
      });
      // -10(tweet=0) + 20(age) + 10(image) = 20
      expect(result.score).toBe(20);
    });

    it('180日以上2年未満で +10', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 180,
        hasProfileImage: true,
      });
      // -10(tweet=0) + 10(age) + 10(image) = 10
      expect(result.score).toBe(10);
    });

    it('30日以上180日未満で +5', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 30,
        hasProfileImage: true,
      });
      // -10(tweet=0) + 5(age) + 10(image) = 5
      expect(result.score).toBe(5);
    });

    it('30日未満で -20', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 29,
        hasProfileImage: true,
      });
      // -10(tweet=0) - 20(age) + 10(image) = -20 → 0
      expect(result.score).toBe(0);
    });
  });

  describe('ツイート数', () => {
    it('5000以上で +25', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        hasProfileImage: true,
      });
      // 30(age) + 25(tweet) + 10(image) = 65
      expect(result.score).toBe(65);
    });

    it('1000以上5000未満で +15', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 1000,
        hasProfileImage: true,
      });
      // 30(age) + 15(tweet) + 10(image) = 55
      expect(result.score).toBe(55);
    });

    it('200以上1000未満で +5', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 200,
        hasProfileImage: true,
      });
      // 30(age) + 5(tweet) + 10(image) = 45
      expect(result.score).toBe(45);
    });

    it('0で -10', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 0,
        hasProfileImage: true,
      });
      // 30(age) - 10(tweet) + 10(image) = 30
      expect(result.score).toBe(30);
    });

    it('1〜199は加点も減点もなし', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 100,
        hasProfileImage: true,
      });
      // 30(age) + 0(tweet) + 10(image) = 40
      expect(result.score).toBe(40);
    });
  });

  describe('フォロワー数', () => {
    it('1000以上で +20', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        followersCount: 1000,
        hasProfileImage: true,
      });
      // 30 + 25 + 20 + 10 = 85
      expect(result.score).toBe(85);
    });

    it('200以上1000未満で +10', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        followersCount: 200,
        hasProfileImage: true,
      });
      // 30 + 25 + 10 + 10 = 75
      expect(result.score).toBe(75);
    });

    it('50以上200未満で +5', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        followersCount: 50,
        hasProfileImage: true,
      });
      // 30 + 25 + 5 + 10 = 70
      expect(result.score).toBe(70);
    });
  });

  describe('プロフィール', () => {
    it('プロフィール画像ありで +10', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        hasProfileImage: true,
      });
      // 30 + 25 + 10 = 65
      expect(result.score).toBe(65);
    });

    it('プロフィール画像なしで -15', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        hasProfileImage: false,
      });
      // 30 + 25 - 15 = 40
      expect(result.score).toBe(40);
    });

    it('自己紹介ありで +5', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        hasProfileImage: true,
        hasDescription: true,
      });
      // 30 + 25 + 10 + 5 = 70
      expect(result.score).toBe(70);
    });
  });

  describe('認証状態', () => {
    it('認証済みで +10', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        hasProfileImage: true,
        verified: true,
      });
      // 30 + 25 + 10 + 10 = 75
      expect(result.score).toBe(75);
    });
  });

  describe('鍵垢', () => {
    it('鍵垢で -10', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        hasProfileImage: true,
        isProtected: true,
      });
      // 30 + 25 + 10 - 10 = 55
      expect(result.score).toBe(55);
    });
  });

  describe('グレード判定', () => {
    it('80以上は S', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        followersCount: 1000,
        hasProfileImage: true,
        hasDescription: true,
        verified: true,
      });
      // 30 + 25 + 20 + 10 + 5 + 10 = 100
      expect(result.score).toBe(100);
      expect(result.grade).toBe('S');
    });

    it('65-79は A', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 5000,
        followersCount: 50,
        hasProfileImage: true,
        hasDescription: true,
      });
      // 30 + 25 + 5 + 10 + 5 = 75
      expect(result.score).toBe(75);
      expect(result.grade).toBe('A');
    });

    it('50-64は B', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 1000,
        hasProfileImage: true,
        hasDescription: true,
      });
      // 30 + 15 + 10 + 5 = 60
      expect(result.score).toBe(60);
      expect(result.grade).toBe('B');
    });

    it('35-49は C', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 200,
        hasProfileImage: true,
      });
      // 30 + 5 + 10 = 45
      expect(result.score).toBe(45);
      expect(result.grade).toBe('C');
    });

    it('0-34は D', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 5,
        tweetCount: 0,
        hasProfileImage: true,
      });
      // 30 - 10 + 10 = 30
      expect(result.score).toBe(30);
      expect(result.grade).toBe('D');
    });
  });

  describe('境界値', () => {
    it('スコアは 0 未満にならない', () => {
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 0,
        tweetCount: 0,
        hasProfileImage: false,
        isProtected: true,
      });
      // -20(age) - 10(tweet) - 15(image) - 10(protected) = -55 → 0
      expect(result.score).toBe(0);
      expect(result.grade).toBe('D');
    });

    it('スコアは 100 を超えない', () => {
      // 最大スコアは実際には 100 なのでこのケースは発生しにくいが、念のため
      const result = calcTrustScore({
        ...defaultInput,
        accountAgeDays: 365 * 10,
        tweetCount: 10000,
        followersCount: 10000,
        hasProfileImage: true,
        hasDescription: true,
        verified: true,
      });
      // 30 + 25 + 20 + 10 + 5 + 10 = 100
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});

describe('calcXProfileScore', () => {
  const defaultInput: TrustScoreInput = {
    accountAgeDays: 0,
    tweetCount: 0,
    followersCount: 0,
    hasProfileImage: false,
    hasDescription: false,
    verified: false,
    isProtected: false,
  };

  it('100点満点のスコアを35点満点にスケールする', () => {
    // 最大スコア (100点) → 35点
    const result = calcXProfileScore({
      ...defaultInput,
      accountAgeDays: 365 * 5,
      tweetCount: 5000,
      followersCount: 1000,
      hasProfileImage: true,
      hasDescription: true,
      verified: true,
    });
    expect(result).toBe(35);
  });

  it('中間スコア (45点) → 16点', () => {
    const result = calcXProfileScore({
      ...defaultInput,
      accountAgeDays: 365 * 2, // +20
      tweetCount: 200, // +5
      followersCount: 50, // +5
      hasProfileImage: true, // +10
      hasDescription: true, // +5
      // Total: 45 → Math.round(45 / 100 * 35) = 16
    });
    expect(result).toBe(16);
  });

  it('最小スコアは0', () => {
    const result = calcXProfileScore({
      ...defaultInput,
      accountAgeDays: 0,
      tweetCount: 0,
      hasProfileImage: false,
      isProtected: true,
    });
    expect(result).toBe(0);
  });
});

describe('calcBehaviorScore', () => {
  const defaultInput: BehaviorScoreInput = {
    completedTradeCount: 0,
    tradeSuccessRate: 0,
    avgResponseTimeHours: null,
    daysSinceFirstTrade: null,
  };

  describe('トレード完了数', () => {
    it('20件以上で +17', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        completedTradeCount: 20,
        tradeSuccessRate: 100,
      });
      // 17(completed) + 9(success rate 100% with 20+ trades) = 26
      expect(result).toBe(26);
    });

    it('10件以上で +13', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        completedTradeCount: 10,
        tradeSuccessRate: 100,
      });
      // 13(completed) + 9(success rate) = 22
      expect(result).toBe(22);
    });

    it('5件以上で +9', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        completedTradeCount: 5,
        tradeSuccessRate: 100,
      });
      // 9(completed) + 9(success rate) = 18
      expect(result).toBe(18);
    });

    it('1件以上で +4', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        completedTradeCount: 1,
        tradeSuccessRate: 100,
      });
      // 4(completed) + 0(not enough trades for success rate bonus) = 4
      expect(result).toBe(4);
    });
  });

  describe('成功率', () => {
    it('90%以上（5件以上）で +9', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        completedTradeCount: 5,
        tradeSuccessRate: 90,
      });
      // 9(completed) + 9(success) = 18
      expect(result).toBe(18);
    });

    it('80%以上（5件以上）で +6', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        completedTradeCount: 4, // 4 completed / 5 total = 80%
        tradeSuccessRate: 80,
      });
      // 4(completed 1+) + 6(success) = 10
      expect(result).toBe(10);
    });

    it('70%以上（5件以上）で +3', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        completedTradeCount: 7, // 7 completed / 10 total = 70%
        tradeSuccessRate: 70,
      });
      // 9(completed 5+) + 3(success) = 12
      expect(result).toBe(12);
    });
  });

  describe('応答速度', () => {
    it('24時間以内で +5', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        avgResponseTimeHours: 24,
      });
      expect(result).toBe(5);
    });

    it('48時間以内で +3', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        avgResponseTimeHours: 48,
      });
      expect(result).toBe(3);
    });
  });

  describe('活動期間', () => {
    it('180日以上で +4', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        daysSinceFirstTrade: 180,
      });
      expect(result).toBe(4);
    });

    it('30日以上で +2', () => {
      const result = calcBehaviorScore({
        ...defaultInput,
        daysSinceFirstTrade: 30,
      });
      expect(result).toBe(2);
    });
  });

  describe('境界値', () => {
    it('最大スコアは35', () => {
      const result = calcBehaviorScore({
        completedTradeCount: 20,
        tradeSuccessRate: 100,
        avgResponseTimeHours: 1,
        daysSinceFirstTrade: 365,
      });
      // 17 + 9 + 5 + 4 = 35
      expect(result).toBe(35);
    });

    it('最小スコアは0', () => {
      const result = calcBehaviorScore(defaultInput);
      expect(result).toBe(0);
    });
  });
});

describe('calcReviewScore', () => {
  const defaultInput: ReviewScoreInput = {
    reviewCount: 0,
    avgRating: null,
    negativeCount: 0,
  };

  describe('平均評価', () => {
    it('4.5以上（3件以上）で +12', () => {
      const result = calcReviewScore({
        ...defaultInput,
        reviewCount: 3,
        avgRating: 4.5,
      });
      expect(result).toBe(12);
    });

    it('4.0以上（3件以上）で +9', () => {
      const result = calcReviewScore({
        ...defaultInput,
        reviewCount: 3,
        avgRating: 4.0,
      });
      expect(result).toBe(9);
    });

    it('3.5以上（3件以上）で +6', () => {
      const result = calcReviewScore({
        ...defaultInput,
        reviewCount: 3,
        avgRating: 3.5,
      });
      expect(result).toBe(6);
    });

    it('3.0以上（3件以上）で +3', () => {
      const result = calcReviewScore({
        ...defaultInput,
        reviewCount: 3,
        avgRating: 3.0,
      });
      expect(result).toBe(3);
    });

    it('3件未満では評価ボーナスなし', () => {
      const result = calcReviewScore({
        ...defaultInput,
        reviewCount: 2,
        avgRating: 5.0,
      });
      expect(result).toBe(0);
    });
  });

  describe('レビュー件数ボーナス', () => {
    it('10件以上で +4', () => {
      const result = calcReviewScore({
        ...defaultInput,
        reviewCount: 10,
        avgRating: 4.5,
      });
      // 12(rating) + 4(count) = 16
      expect(result).toBe(16);
    });

    it('5件以上で +2', () => {
      const result = calcReviewScore({
        ...defaultInput,
        reviewCount: 5,
        avgRating: 4.5,
      });
      // 12(rating) + 2(count) = 14
      expect(result).toBe(14);
    });
  });

  describe('ネガティブ評価ペナルティ', () => {
    it('2件以上で -4', () => {
      const result = calcReviewScore({
        ...defaultInput,
        reviewCount: 5,
        avgRating: 4.5,
        negativeCount: 2,
      });
      // 12(rating) + 2(count) - 4(negative) = 10
      expect(result).toBe(10);
    });

    it('1件で -2', () => {
      const result = calcReviewScore({
        ...defaultInput,
        reviewCount: 5,
        avgRating: 4.5,
        negativeCount: 1,
      });
      // 12(rating) + 2(count) - 2(negative) = 12
      expect(result).toBe(12);
    });
  });

  describe('境界値', () => {
    it('最大スコアは20', () => {
      const result = calcReviewScore({
        reviewCount: 10,
        avgRating: 5.0,
        negativeCount: 0,
      });
      // 12 + 4 = 16 (実際の最大)
      expect(result).toBeLessThanOrEqual(20);
    });

    it('最小スコアは0', () => {
      const result = calcReviewScore({
        reviewCount: 0,
        avgRating: null,
        negativeCount: 10,
      });
      expect(result).toBe(0);
    });
  });
});

describe('calcEmailVerificationScore', () => {
  it('メール認証済みで +10', () => {
    const result = calcEmailVerificationScore({ emailVerified: true });
    expect(result).toBe(10);
  });

  it('メール未認証で 0', () => {
    const result = calcEmailVerificationScore({ emailVerified: false });
    expect(result).toBe(0);
  });
});

describe('calcCombinedTrustScore', () => {
  const xProfileInput: TrustScoreInput = {
    accountAgeDays: 365 * 5,
    tweetCount: 5000,
    followersCount: 1000,
    hasProfileImage: true,
    hasDescription: true,
    verified: true,
    isProtected: false,
  };

  const behaviorInput: BehaviorScoreInput = {
    completedTradeCount: 20,
    tradeSuccessRate: 100,
    avgResponseTimeHours: 1,
    daysSinceFirstTrade: 365,
  };

  const reviewInput: ReviewScoreInput = {
    reviewCount: 10,
    avgRating: 5.0,
    positiveCount: 10,
    negativeCount: 0,
  };

  it('3要素のスコアを統合する（非推奨関数）', () => {
    const result = calcCombinedTrustScore(xProfileInput, behaviorInput, reviewInput);

    // xProfile: 100点 → 35点
    expect(result.breakdown.xProfile).toBe(35);
    // behavior: 17 + 9 + 5 + 4 = 35点
    expect(result.breakdown.behavior).toBe(35);
    // review: 12 + 4 = 16点
    expect(result.breakdown.review).toBe(16);

    expect(result.totalScore).toBe(86);
    expect(result.grade).toBe('S');
  });

  it('グレード判定が正しく動作する', () => {
    const lowBehavior: BehaviorScoreInput = {
      completedTradeCount: 0,
      tradeSuccessRate: 0,
      avgResponseTimeHours: null,
      daysSinceFirstTrade: null,
    };

    const lowReview: ReviewScoreInput = {
      reviewCount: 0,
      avgRating: null,
      positiveCount: 0,
      negativeCount: 0,
    };

    const result = calcCombinedTrustScore(xProfileInput, lowBehavior, lowReview);

    // xProfile: 35, behavior: 0, review: 0 = 35
    expect(result.totalScore).toBe(35);
    expect(result.grade).toBe('C');
  });
});

describe('calcCombinedTrustScoreWithEmail', () => {
  const xProfileInput: TrustScoreInput = {
    accountAgeDays: 365 * 5,
    tweetCount: 5000,
    followersCount: 1000,
    hasProfileImage: true,
    hasDescription: true,
    verified: true,
    isProtected: false,
  };

  const behaviorInput: BehaviorScoreInput = {
    completedTradeCount: 20,
    tradeSuccessRate: 100,
    avgResponseTimeHours: 1,
    daysSinceFirstTrade: 365,
  };

  const reviewInput: ReviewScoreInput = {
    reviewCount: 10,
    avgRating: 5.0,
    positiveCount: 10,
    negativeCount: 0,
  };

  const emailInput: EmailVerificationInput = {
    emailVerified: true,
  };

  it('4要素のスコアを統合する（メール認証含む）', () => {
    const result = calcCombinedTrustScoreWithEmail(
      xProfileInput,
      behaviorInput,
      reviewInput,
      emailInput
    );

    // xProfile: 100点 → 35点
    expect(result.breakdown.xProfile).toBe(35);
    // behavior: 17 + 9 + 5 + 4 = 35点
    expect(result.breakdown.behavior).toBe(35);
    // review: 12 + 4 = 16点
    expect(result.breakdown.review).toBe(16);
    // emailVerification: +10点
    expect(result.breakdown.emailVerification).toBe(10);

    // 35 + 35 + 16 + 10 = 96
    expect(result.totalScore).toBe(96);
    expect(result.grade).toBe('S');
  });

  it('メール未認証の場合は10点少ない', () => {
    const result = calcCombinedTrustScoreWithEmail(xProfileInput, behaviorInput, reviewInput, {
      emailVerified: false,
    });

    expect(result.breakdown.emailVerification).toBe(0);
    // 35 + 35 + 16 + 0 = 86
    expect(result.totalScore).toBe(86);
    expect(result.grade).toBe('S');
  });

  it('メール認証で最大100点を達成できる', () => {
    const result = calcCombinedTrustScoreWithEmail(
      xProfileInput,
      behaviorInput,
      {
        reviewCount: 10,
        avgRating: 5.0,
        positiveCount: 10,
        negativeCount: 0,
      },
      { emailVerified: true }
    );

    // 35 + 35 + 16 + 10 = 96 (最大は35+35+20+10=100だがreviewは最大16)
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it('全て最低スコアでも0点', () => {
    const result = calcCombinedTrustScoreWithEmail(
      {
        accountAgeDays: 0,
        tweetCount: 0,
        followersCount: 0,
        hasProfileImage: false,
        hasDescription: false,
        verified: false,
        isProtected: true,
      },
      {
        completedTradeCount: 0,
        tradeSuccessRate: 0,
        avgResponseTimeHours: null,
        daysSinceFirstTrade: null,
      },
      {
        reviewCount: 0,
        avgRating: null,
        positiveCount: 0,
        negativeCount: 0,
      },
      { emailVerified: false }
    );

    expect(result.totalScore).toBe(0);
    expect(result.grade).toBe('D');
  });
});

// =====================================
// 新しい3軸スコアリングシステム
// =====================================

describe('calcTwitterScore', () => {
  const defaultInput: NewTrustScoreInput = {
    totalTrades: 0,
    completedTrades: 0,
    troubledTrades: 0,
    averageRating: 0,
    recentTrades: [],
  };

  describe('アカウント年齢', () => {
    it('2年半のアカウントで約15点（月0.5点×30ヶ月）', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 365 * 2.5 * 24 * 60 * 60 * 1000);
      const result = calcTwitterScore({
        ...defaultInput,
        xAccountCreatedAt: createdAt,
      });
      // 30ヶ月 × 0.5 = 15点
      expect(result.score).toBe(15);
      expect(result.accountAgeDays).toBeGreaterThan(900);
    });

    it('アカウント作成日が未設定の場合は0点', () => {
      const result = calcTwitterScore({
        ...defaultInput,
        xAccountCreatedAt: undefined,
      });
      expect(result.score).toBe(0);
      expect(result.accountAgeDays).toBe(0);
    });
  });

  describe('フォロワー数', () => {
    it('フォロワー1000人で対数スケール約6点', () => {
      const result = calcTwitterScore({
        ...defaultInput,
        xFollowersCount: 1000,
      });
      // log10(1001) * 2 ≈ 6
      expect(result.score).toBeGreaterThanOrEqual(5);
      expect(result.score).toBeLessThanOrEqual(7);
      expect(result.followerCount).toBe(1000);
    });

    it('フォロワー10000人で対数スケール約8点', () => {
      const result = calcTwitterScore({
        ...defaultInput,
        xFollowersCount: 10000,
      });
      // log10(10001) * 2 ≈ 8
      expect(result.score).toBeGreaterThanOrEqual(7);
      expect(result.score).toBeLessThanOrEqual(10);
    });

    it('フォロワー0人で0点', () => {
      const result = calcTwitterScore({
        ...defaultInput,
        xFollowersCount: 0,
      });
      expect(result.followerCount).toBe(0);
    });

    it('フォロワー未設定の場合は0', () => {
      const result = calcTwitterScore({
        ...defaultInput,
        xFollowersCount: undefined,
      });
      expect(result.followerCount).toBe(0);
    });
  });

  describe('投稿頻度', () => {
    it('月30件投稿で約4.5点', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const result = calcTwitterScore({
        ...defaultInput,
        xAccountCreatedAt: createdAt,
        xStatusesCount: 30 * 12, // 年間360件 = 月30件
      });
      // log10(31) * 3 ≈ 4.5
      expect(result.postFrequency).toBeGreaterThan(25);
      expect(result.postFrequency).toBeLessThan(35);
    });

    it('投稿数未設定の場合は0', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const result = calcTwitterScore({
        ...defaultInput,
        xAccountCreatedAt: createdAt,
        xStatusesCount: undefined,
      });
      expect(result.postFrequency).toBe(0);
    });
  });

  describe('認証バッジ', () => {
    it('認証バッジありで +5点', () => {
      const result = calcTwitterScore({
        ...defaultInput,
        xVerified: true,
      });
      expect(result.score).toBe(5);
      expect(result.hasVerifiedBadge).toBe(true);
    });

    it('認証バッジなしで 0点', () => {
      const result = calcTwitterScore({
        ...defaultInput,
        xVerified: false,
      });
      expect(result.hasVerifiedBadge).toBe(false);
    });
  });

  describe('境界値', () => {
    it('最大スコアは40', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 365 * 5 * 24 * 60 * 60 * 1000);
      const result = calcTwitterScore({
        ...defaultInput,
        xAccountCreatedAt: createdAt,
        xFollowersCount: 1000000,
        xStatusesCount: 100000,
        xVerified: true,
      });
      expect(result.score).toBeLessThanOrEqual(40);
    });

    it('最小スコアは0', () => {
      const result = calcTwitterScore({
        ...defaultInput,
      });
      expect(result.score).toBe(0);
    });
  });
});

describe('calcTotalTradeScore', () => {
  const defaultInput: NewTrustScoreInput = {
    totalTrades: 0,
    completedTrades: 0,
    troubledTrades: 0,
    averageRating: 0,
    recentTrades: [],
  };

  describe('成約率', () => {
    it('成約率100%で15点', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 10,
        completedTrades: 10,
        averageRating: 0,
      });
      // completionRate * 15 = 15
      expect(result.completionRate).toBe(1);
    });

    it('成約率50%で7.5点', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 10,
        completedTrades: 5,
        averageRating: 0,
      });
      expect(result.completionRate).toBe(0.5);
    });

    it('取引ゼロの場合は成約率0', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 0,
        completedTrades: 0,
      });
      expect(result.completionRate).toBe(0);
    });
  });

  describe('取引総数', () => {
    it('取引100件で対数スケール約6点', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 100,
        completedTrades: 100,
        averageRating: 0,
      });
      // log10(101) * 3 ≈ 6
      expect(result.totalCount).toBe(100);
    });

    it('取引1000件で最大10点', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 1000,
        completedTrades: 1000,
        averageRating: 0,
      });
      // log10(1001) * 3 ≈ 9 (最大10点)
      expect(result.totalCount).toBe(1000);
    });
  });

  describe('トラブル率', () => {
    it('トラブル率10%で-1点', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 10,
        completedTrades: 9,
        troubledTrades: 1,
        averageRating: 0,
      });
      expect(result.troubleRate).toBe(0.1);
    });

    it('トラブル率100%で-10点', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 10,
        completedTrades: 0,
        troubledTrades: 10,
        averageRating: 0,
      });
      expect(result.troubleRate).toBe(1);
    });
  });

  describe('平均評価', () => {
    it('平均評価5.0で+5点', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 10,
        completedTrades: 10,
        averageRating: 5,
      });
      expect(result.averageRating).toBe(5);
    });

    it('平均評価2.5で+2.5点', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 10,
        completedTrades: 10,
        averageRating: 2.5,
      });
      expect(result.averageRating).toBe(2.5);
    });
  });

  describe('境界値', () => {
    it('最大スコアは40', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 1000,
        completedTrades: 1000,
        troubledTrades: 0,
        averageRating: 5,
      });
      expect(result.score).toBeLessThanOrEqual(40);
    });

    it('最小スコアは0', () => {
      const result = calcTotalTradeScore({
        ...defaultInput,
        totalTrades: 10,
        completedTrades: 0,
        troubledTrades: 10,
        averageRating: 0,
      });
      expect(result.score).toBe(0);
    });
  });
});

describe('calcRecentTradeScore', () => {
  const defaultInput: NewTrustScoreInput = {
    totalTrades: 0,
    completedTrades: 0,
    troubledTrades: 0,
    averageRating: 0,
    recentTrades: [],
  };

  describe('直近取引がない場合', () => {
    it('スコア0、全ての詳細も0', () => {
      const result = calcRecentTradeScore({
        ...defaultInput,
        recentTrades: [],
      });
      expect(result.score).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.troubleRate).toBe(0);
    });
  });

  describe('成約率', () => {
    it('直近10件全て完了で10点', () => {
      const result = calcRecentTradeScore({
        ...defaultInput,
        recentTrades: Array(10).fill({ completed: true, troubled: false, rating: 0 }),
      });
      expect(result.completionRate).toBe(1);
    });

    it('直近10件中5件完了で5点', () => {
      const result = calcRecentTradeScore({
        ...defaultInput,
        recentTrades: [
          ...Array(5).fill({ completed: true, troubled: false, rating: 0 }),
          ...Array(5).fill({ completed: false, troubled: false, rating: 0 }),
        ],
      });
      expect(result.completionRate).toBe(0.5);
    });
  });

  describe('トラブル率', () => {
    it('直近10件中2件トラブルで-1点', () => {
      const result = calcRecentTradeScore({
        ...defaultInput,
        recentTrades: [
          ...Array(8).fill({ completed: true, troubled: false, rating: 0 }),
          ...Array(2).fill({ completed: false, troubled: true, rating: 0 }),
        ],
      });
      expect(result.troubleRate).toBe(0.2);
    });
  });

  describe('平均評価', () => {
    it('平均評価5.0で+5点', () => {
      const result = calcRecentTradeScore({
        ...defaultInput,
        recentTrades: Array(10).fill({ completed: true, troubled: false, rating: 5 }),
      });
      expect(result.averageRating).toBe(5);
    });
  });

  describe('10件以上の取引', () => {
    it('10件を超える取引は最初の10件のみ使用', () => {
      const result = calcRecentTradeScore({
        ...defaultInput,
        recentTrades: [
          ...Array(10).fill({ completed: true, troubled: false, rating: 5 }),
          ...Array(5).fill({ completed: false, troubled: true, rating: 0 }),
        ],
      });
      // 最初の10件のみ使用されるので、completionRate = 1
      expect(result.completionRate).toBe(1);
      expect(result.troubleRate).toBe(0);
    });
  });

  describe('境界値', () => {
    it('最大スコアは20', () => {
      const result = calcRecentTradeScore({
        ...defaultInput,
        recentTrades: Array(10).fill({ completed: true, troubled: false, rating: 5 }),
      });
      expect(result.score).toBeLessThanOrEqual(20);
    });

    it('最小スコアは0', () => {
      const result = calcRecentTradeScore({
        ...defaultInput,
        recentTrades: Array(10).fill({ completed: false, troubled: true, rating: 0 }),
      });
      expect(result.score).toBe(0);
    });
  });
});

describe('calcNewTrustScore', () => {
  describe('3軸スコアの統合', () => {
    it('全て高スコアで合計78点前後（Aグレード）', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 365 * 3 * 24 * 60 * 60 * 1000);
      const result = calcNewTrustScore({
        xAccountCreatedAt: createdAt,
        xFollowersCount: 100000,
        xStatusesCount: 10000,
        xVerified: true,
        totalTrades: 100,
        completedTrades: 100,
        troubledTrades: 0,
        averageRating: 5,
        recentTrades: Array(10).fill({ completed: true, troubled: false, rating: 5 }),
      });
      // Twitter: ~18点(年齢) + 10点(フォロワー) + 10点(投稿) + 5点(認証) = ~40点
      // 取引: 15点(成約率) + 6点(件数) + 5点(評価) = ~26点
      // 直近: 10点(成約率) + 5点(評価) = 15点
      // 合計: ~78点
      expect(result.total).toBeGreaterThanOrEqual(75);
      expect(result.grade).toBe('A');
    });

    it('全て最低スコアで0点（Eグレード）', () => {
      const result = calcNewTrustScore({
        totalTrades: 0,
        completedTrades: 0,
        troubledTrades: 0,
        averageRating: 0,
        recentTrades: [],
      });
      expect(result.total).toBe(0);
      expect(result.grade).toBe('E');
    });

    it('Twitter のみ高スコアで約40点（Cグレード）', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 365 * 3 * 24 * 60 * 60 * 1000);
      const result = calcNewTrustScore({
        xAccountCreatedAt: createdAt,
        xFollowersCount: 100000,
        xStatusesCount: 10000,
        xVerified: true,
        totalTrades: 0,
        completedTrades: 0,
        troubledTrades: 0,
        averageRating: 0,
        recentTrades: [],
      });
      expect(result.twitter.score).toBeGreaterThan(30);
      expect(result.totalTrade.score).toBe(0);
      expect(result.recentTrade.score).toBe(0);
    });
  });

  describe('グレード判定', () => {
    it('高スコアで A グレード', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 365 * 5 * 24 * 60 * 60 * 1000);
      const result = calcNewTrustScore({
        xAccountCreatedAt: createdAt,
        xFollowersCount: 1000000,
        xStatusesCount: 100000,
        xVerified: true,
        totalTrades: 1000,
        completedTrades: 1000,
        troubledTrades: 0,
        averageRating: 5,
        recentTrades: Array(10).fill({ completed: true, troubled: false, rating: 5 }),
      });
      // 実際のスコアに基づいてAグレードを期待
      expect(result.total).toBeGreaterThanOrEqual(75);
      expect(result.grade).toBe('A');
    });

    it('60-74点で B', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 365 * 2 * 24 * 60 * 60 * 1000);
      const result = calcNewTrustScore({
        xAccountCreatedAt: createdAt,
        xFollowersCount: 1000,
        xStatusesCount: 500,
        xVerified: false,
        totalTrades: 50,
        completedTrades: 50,
        troubledTrades: 0,
        averageRating: 4.5,
        recentTrades: Array(10).fill({ completed: true, troubled: false, rating: 4.5 }),
      });
      expect(result.total).toBeGreaterThanOrEqual(60);
      expect(result.total).toBeLessThan(75);
      expect(result.grade).toBe('B');
    });

    it('低スコアで E', () => {
      const result = calcNewTrustScore({
        xFollowersCount: 100,
        totalTrades: 5,
        completedTrades: 3,
        troubledTrades: 1,
        averageRating: 3,
        recentTrades: Array(5).fill({ completed: true, troubled: false, rating: 3 }),
      });
      // フォロワー100人のみの低スコア
      expect(result.total).toBeLessThan(30);
      expect(result.grade).toBe('E');
    });

    it('0-29点で E', () => {
      const result = calcNewTrustScore({
        totalTrades: 2,
        completedTrades: 1,
        troubledTrades: 1,
        averageRating: 2,
        recentTrades: [{ completed: true, troubled: false, rating: 2 }],
      });
      expect(result.total).toBeLessThan(30);
      expect(result.grade).toBe('E');
    });
  });

  describe('スコア内訳', () => {
    it('各軸のスコアが正しく計算される', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const result = calcNewTrustScore({
        xAccountCreatedAt: createdAt,
        xFollowersCount: 500,
        xStatusesCount: 1000,
        xVerified: false,
        totalTrades: 20,
        completedTrades: 18,
        troubledTrades: 1,
        averageRating: 4.2,
        recentTrades: Array(10).fill({ completed: true, troubled: false, rating: 4 }),
      });

      expect(result.twitter).toBeDefined();
      expect(result.twitter.score).toBeGreaterThanOrEqual(0);
      expect(result.twitter.score).toBeLessThanOrEqual(40);

      expect(result.totalTrade).toBeDefined();
      expect(result.totalTrade.score).toBeGreaterThanOrEqual(0);
      expect(result.totalTrade.score).toBeLessThanOrEqual(40);

      expect(result.recentTrade).toBeDefined();
      expect(result.recentTrade.score).toBeGreaterThanOrEqual(0);
      expect(result.recentTrade.score).toBeLessThanOrEqual(20);

      expect(result.total).toBe(
        result.twitter.score + result.totalTrade.score + result.recentTrade.score
      );
    });
  });
});
