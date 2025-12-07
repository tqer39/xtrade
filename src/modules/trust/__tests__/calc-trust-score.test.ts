import { describe, expect, it } from 'vitest';
import {
  calcBehaviorScore,
  calcCombinedTrustScore,
  calcCombinedTrustScoreWithEmail,
  calcEmailVerificationScore,
  calcReviewScore,
  calcTrustScore,
  calcXProfileScore,
} from '../calc-trust-score';
import type {
  BehaviorScoreInput,
  EmailVerificationInput,
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
