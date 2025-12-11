import { describe, expect, it, vi } from 'vitest';
import {
  ANTHROPIC_API_RETRY_OPTIONS,
  EXTERNAL_SITE_RETRY_OPTIONS,
  extractRetryAfter,
  isRateLimitError,
  isTransientError,
  RateLimiter,
  sleep,
  withRetry,
} from '../retry';

describe('retry', () => {
  describe('isRateLimitError', () => {
    it('should detect rate limit error from message', () => {
      expect(isRateLimitError(new Error('rate_limit_exceeded'))).toBe(true);
      expect(isRateLimitError(new Error('Rate limit reached'))).toBe(true);
      expect(isRateLimitError(new Error('429 Too Many Requests'))).toBe(true);
      expect(isRateLimitError(new Error('too many requests'))).toBe(true);
    });

    it('should detect rate limit from status code', () => {
      expect(isRateLimitError({ status: 429 })).toBe(true);
      expect(isRateLimitError({ status: 200 })).toBe(false);
    });

    it('should return false for other errors', () => {
      expect(isRateLimitError(new Error('Network error'))).toBe(false);
      expect(isRateLimitError(new Error('404 Not Found'))).toBe(false);
    });
  });

  describe('isTransientError', () => {
    it('should detect transient errors', () => {
      expect(isTransientError(new Error('network error'))).toBe(true);
      expect(isTransientError(new Error('timeout'))).toBe(true);
      expect(isTransientError(new Error('ECONNRESET'))).toBe(true);
      expect(isTransientError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isTransientError(new Error('socket hang up'))).toBe(true);
    });

    it('should detect server errors', () => {
      expect(isTransientError(new Error('500 Internal Server Error'))).toBe(true);
      expect(isTransientError(new Error('502 Bad Gateway'))).toBe(true);
      expect(isTransientError(new Error('503 Service Unavailable'))).toBe(true);
      expect(isTransientError(new Error('504 Gateway Timeout'))).toBe(true);
    });

    it('should detect server errors from status code', () => {
      expect(isTransientError({ status: 500 })).toBe(true);
      expect(isTransientError({ status: 502 })).toBe(true);
      expect(isTransientError({ status: 429 })).toBe(true);
    });

    it('should return false for non-transient errors', () => {
      expect(isTransientError(new Error('404 Not Found'))).toBe(false);
      expect(isTransientError(new Error('Invalid input'))).toBe(false);
      expect(isTransientError({ status: 404 })).toBe(false);
    });
  });

  describe('extractRetryAfter', () => {
    it('should extract retry-after from headers', () => {
      const error = { headers: { 'retry-after': '30' } };
      expect(extractRetryAfter(error)).toBe(30000);
    });

    it('should extract retry time from error message', () => {
      const error = new Error('Rate limit exceeded. Try again in 60 seconds.');
      expect(extractRetryAfter(error)).toBe(60000);
    });

    it('should handle decimal seconds', () => {
      const error = new Error('Try again in 1.5 seconds');
      expect(extractRetryAfter(error)).toBe(1500); // 1.5 * 1000

      // Math.ceil の動作確認: 1.1秒 → 1100ms（切り上げ不要）
      const error2 = new Error('Try again in 1.1 seconds');
      expect(extractRetryAfter(error2)).toBe(1100);
    });

    it('should return null for unknown format', () => {
      expect(extractRetryAfter(new Error('Unknown error'))).toBeNull();
      expect(extractRetryAfter(null)).toBeNull();
    });
  });

  describe('sleep', () => {
    it('should wait for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe('withRetry', () => {
    it('should return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(fn, { maxRetries: 3 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 10,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('network error'));

      await expect(
        withRetry(fn, {
          maxRetries: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow('network error');

      expect(fn).toHaveBeenCalledTimes(3); // 1 + 2 retries
    });

    it('should not retry on non-transient error', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Invalid input'));

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          initialDelay: 10,
        })
      ).rejects.toThrow('Invalid input');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Number), expect.any(Error));
    });
  });

  describe('RateLimiter', () => {
    it('should enforce minimum interval', async () => {
      const limiter = new RateLimiter(50);
      const fn = vi.fn().mockResolvedValue('result');

      const start = Date.now();
      await limiter.execute(fn);
      await limiter.execute(fn);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not delay if interval has passed', async () => {
      const limiter = new RateLimiter(10);
      const fn = vi.fn().mockResolvedValue('result');

      await limiter.execute(fn);
      await sleep(20);

      const start = Date.now();
      await limiter.execute(fn);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(15);
    });
  });

  describe('default options', () => {
    it('EXTERNAL_SITE_RETRY_OPTIONS should have correct values', () => {
      expect(EXTERNAL_SITE_RETRY_OPTIONS.maxRetries).toBe(3);
      expect(EXTERNAL_SITE_RETRY_OPTIONS.initialDelay).toBe(2000);
      expect(EXTERNAL_SITE_RETRY_OPTIONS.maxDelay).toBe(30000);
    });

    it('ANTHROPIC_API_RETRY_OPTIONS should have correct values', () => {
      expect(ANTHROPIC_API_RETRY_OPTIONS.maxRetries).toBe(5);
      expect(ANTHROPIC_API_RETRY_OPTIONS.initialDelay).toBe(5000);
      expect(ANTHROPIC_API_RETRY_OPTIONS.maxDelay).toBe(120000);
    });
  });
});
