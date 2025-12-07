/**
 * 使い捨てメールアドレスのチェック
 *
 * disposable-email-domains パッケージを使用して、
 * 一時的なメールサービス（mailinator.com など）をブロック
 */

import domains from 'disposable-email-domains';

import type { EmailValidationResult } from '../types';

// 使い捨てメールドメインのセット（高速検索用）
const disposableDomains = new Set<string>(domains as string[]);

/**
 * メールアドレスのドメインを抽出
 */
function extractDomain(email: string): string | null {
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) {
    return null;
  }
  return parts[1];
}

/**
 * 使い捨てメールアドレスかどうかをチェック
 *
 * @param email - チェック対象のメールアドレス
 * @returns バリデーション結果
 *
 * @example
 * ```ts
 * const result = isDisposableEmail('user@mailinator.com');
 * // { valid: false, error: '一時的なメールアドレスは使用できません' }
 * ```
 */
export function isDisposableEmail(email: string): EmailValidationResult {
  const domain = extractDomain(email);

  if (!domain) {
    return {
      valid: false,
      error: '無効なメールアドレス形式です',
    };
  }

  if (disposableDomains.has(domain)) {
    return {
      valid: false,
      error: '一時的なメールアドレスは使用できません。通常のメールアドレスを使用してください。',
    };
  }

  return { valid: true };
}
