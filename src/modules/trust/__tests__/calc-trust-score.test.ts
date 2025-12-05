import { describe, expect, it } from 'vitest';
import { calcTrustScore } from '../calc-trust-score';
import type { TrustScoreInput } from '../types';

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
