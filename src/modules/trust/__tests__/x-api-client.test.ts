import { describe, expect, it, vi } from 'vitest';
import type { XUserProfile } from '../types';

// DB モジュールをモック
vi.mock('@/db/drizzle', () => ({
  db: {},
}));

vi.mock('@/db/schema', () => ({}));

// モック後にインポート
const { RateLimitError, profileToTrustScoreInput, isRateLimitError } = await import(
  '../x-api-client'
);

describe('RateLimitError', () => {
  it('デフォルトメッセージでインスタンス化できる', () => {
    const error = new RateLimitError();
    expect(error.message).toBe('X API rate limit exceeded');
    expect(error.name).toBe('RateLimitError');
  });

  it('カスタムメッセージでインスタンス化できる', () => {
    const error = new RateLimitError('Custom message');
    expect(error.message).toBe('Custom message');
    expect(error.name).toBe('RateLimitError');
  });

  it('Error を継承している', () => {
    const error = new RateLimitError();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RateLimitError);
  });
});

describe('profileToTrustScoreInput', () => {
  const baseProfile: XUserProfile = {
    id: '123456789',
    name: 'Test User',
    username: 'testuser',
    created_at: '2020-01-01T00:00:00.000Z',
    description: 'This is a test user',
    profile_image_url: 'https://pbs.twimg.com/profile_images/123/test.jpg',
    protected: false,
    verified: true,
    public_metrics: {
      followers_count: 1000,
      following_count: 500,
      tweet_count: 5000,
      listed_count: 10,
    },
  };

  it('正常なプロフィールを変換できる', () => {
    const result = profileToTrustScoreInput(baseProfile);

    expect(result.tweetCount).toBe(5000);
    expect(result.followersCount).toBe(1000);
    expect(result.hasProfileImage).toBe(true);
    expect(result.hasDescription).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.isProtected).toBe(false);
    expect(result.accountAgeDays).toBeGreaterThan(0);
  });

  it('アカウント年齢を正しく計算する', () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const profile: XUserProfile = {
      ...baseProfile,
      created_at: oneYearAgo.toISOString(),
    };

    const result = profileToTrustScoreInput(profile);
    // 1年 = 約365日（±1日の誤差を許容）
    expect(result.accountAgeDays).toBeGreaterThanOrEqual(364);
    expect(result.accountAgeDays).toBeLessThanOrEqual(366);
  });

  it('デフォルトプロフィール画像の場合は hasProfileImage が false', () => {
    const profile: XUserProfile = {
      ...baseProfile,
      profile_image_url: 'https://abs.twimg.com/sticky/default_profile_images/default_profile.png',
    };

    const result = profileToTrustScoreInput(profile);
    expect(result.hasProfileImage).toBe(false);
  });

  it('プロフィール画像がない場合は hasProfileImage が false', () => {
    const profile: XUserProfile = {
      ...baseProfile,
      profile_image_url: undefined,
    };

    const result = profileToTrustScoreInput(profile);
    expect(result.hasProfileImage).toBe(false);
  });

  it('空の自己紹介の場合は hasDescription が false', () => {
    const profile: XUserProfile = {
      ...baseProfile,
      description: '',
    };

    const result = profileToTrustScoreInput(profile);
    expect(result.hasDescription).toBe(false);
  });

  it('自己紹介がない場合は hasDescription が false', () => {
    const profile: XUserProfile = {
      ...baseProfile,
      description: undefined,
    };

    const result = profileToTrustScoreInput(profile);
    expect(result.hasDescription).toBe(false);
  });

  it('鍵垢の場合は isProtected が true', () => {
    const profile: XUserProfile = {
      ...baseProfile,
      protected: true,
    };

    const result = profileToTrustScoreInput(profile);
    expect(result.isProtected).toBe(true);
  });

  it('未認証の場合は verified が false', () => {
    const profile: XUserProfile = {
      ...baseProfile,
      verified: false,
    };

    const result = profileToTrustScoreInput(profile);
    expect(result.verified).toBe(false);
  });

  it('public_metrics がない場合はデフォルト値を使用', () => {
    const profile: XUserProfile = {
      ...baseProfile,
      public_metrics: undefined,
    };

    const result = profileToTrustScoreInput(profile);
    expect(result.tweetCount).toBe(0);
    expect(result.followersCount).toBe(0);
  });

  it('verified が undefined の場合は false', () => {
    const profile: XUserProfile = {
      ...baseProfile,
      verified: undefined,
    };

    const result = profileToTrustScoreInput(profile);
    expect(result.verified).toBe(false);
  });

  it('protected が undefined の場合は false', () => {
    const profile: XUserProfile = {
      ...baseProfile,
      protected: undefined,
    };

    const result = profileToTrustScoreInput(profile);
    expect(result.isProtected).toBe(false);
  });
});

describe('isRateLimitError', () => {
  it('RateLimitError の場合は true', () => {
    const error = new RateLimitError();
    expect(isRateLimitError(error)).toBe(true);
  });

  it('通常の Error の場合は false', () => {
    const error = new Error('Some error');
    expect(isRateLimitError(error)).toBe(false);
  });

  it('null の場合は false', () => {
    expect(isRateLimitError(null)).toBe(false);
  });

  it('undefined の場合は false', () => {
    expect(isRateLimitError(undefined)).toBe(false);
  });

  it('文字列の場合は false', () => {
    expect(isRateLimitError('error')).toBe(false);
  });

  it('オブジェクトの場合は false', () => {
    expect(isRateLimitError({ message: 'error' })).toBe(false);
  });
});
