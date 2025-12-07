import { describe, expect, it } from 'vitest';

import { isDisposableEmail } from '../validators/disposable-check';

describe('isDisposableEmail', () => {
  describe('有効なメールアドレス', () => {
    it('通常のメールアドレスは有効と判定する', () => {
      const result = isDisposableEmail('user@gmail.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('企業ドメインのメールアドレスは有効と判定する', () => {
      const result = isDisposableEmail('contact@example.co.jp');
      expect(result.valid).toBe(true);
    });

    it('大文字を含むメールアドレスも正しく処理する', () => {
      const result = isDisposableEmail('User@Gmail.COM');
      expect(result.valid).toBe(true);
    });
  });

  describe('使い捨てメールアドレス', () => {
    it('mailinator.com は無効と判定する', () => {
      const result = isDisposableEmail('test@mailinator.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        '一時的なメールアドレスは使用できません。通常のメールアドレスを使用してください。'
      );
    });

    it('guerrillamail.com は無効と判定する', () => {
      const result = isDisposableEmail('test@guerrillamail.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('一時的なメールアドレス');
    });

    it('10minutemail.com は無効と判定する', () => {
      const result = isDisposableEmail('test@10minutemail.com');
      expect(result.valid).toBe(false);
    });
  });

  describe('無効なメールアドレス形式', () => {
    it('@ がないメールアドレスは無効と判定する', () => {
      const result = isDisposableEmail('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('無効なメールアドレス形式です');
    });

    it('複数の @ があるメールアドレスは無効と判定する', () => {
      const result = isDisposableEmail('user@@example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('無効なメールアドレス形式です');
    });

    it('空文字は無効と判定する', () => {
      const result = isDisposableEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('無効なメールアドレス形式です');
    });
  });
});
