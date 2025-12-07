import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyRecaptcha } from '../validators/recaptcha';

describe('verifyRecaptcha', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('シークレットキーが設定されていない場合', () => {
    it('検証をスキップして成功を返す', async () => {
      delete process.env.RECAPTCHA_SECRET_KEY;

      const result = await verifyRecaptcha('some-token', 'test_action');
      expect(result.success).toBe(true);
    });
  });

  describe('トークンが空の場合', () => {
    it('エラーを返す', async () => {
      process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key';

      const result = await verifyRecaptcha('', 'test_action');
      expect(result.success).toBe(false);
      expect(result.error).toBe('reCAPTCHA token is required');
    });
  });

  describe('Google API との通信', () => {
    beforeEach(() => {
      process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key';
    });

    it('検証成功時は success: true を返す', async () => {
      const mockResponse = {
        success: true,
        score: 0.9,
        action: 'send_verification_email',
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await verifyRecaptcha('valid-token', 'send_verification_email');
      expect(result.success).toBe(true);
      expect(result.score).toBe(0.9);
    });

    it('検証失敗時は success: false を返す', async () => {
      const mockResponse = {
        success: false,
        'error-codes': ['invalid-input-response'],
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await verifyRecaptcha('invalid-token', 'test_action');
      expect(result.success).toBe(false);
      expect(result.error).toBe('reCAPTCHA verification failed');
    });

    it('アクション名が一致しない場合はエラーを返す', async () => {
      const mockResponse = {
        success: true,
        score: 0.9,
        action: 'wrong_action',
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await verifyRecaptcha('valid-token', 'expected_action');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid reCAPTCHA action');
    });

    it('スコアが低い場合はエラーを返す', async () => {
      const mockResponse = {
        success: true,
        score: 0.3,
        action: 'test_action',
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await verifyRecaptcha('valid-token', 'test_action');
      expect(result.success).toBe(false);
      expect(result.score).toBe(0.3);
      expect(result.error).toBe('reCAPTCHA score too low');
    });

    it('fetch エラー時はエラーを返す', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await verifyRecaptcha('valid-token', 'test_action');
      expect(result.success).toBe(false);
      expect(result.error).toBe('reCAPTCHA verification error');
    });

    it('スコアが省略された場合はデフォルト値 1 を使用する', async () => {
      const mockResponse = {
        success: true,
        action: 'test_action',
        // score is omitted
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await verifyRecaptcha('valid-token', 'test_action');
      expect(result.success).toBe(true);
    });
  });
});
