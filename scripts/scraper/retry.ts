/**
 * リトライ・レートリミットユーティリティ
 * 外部サイトおよび Anthropic API のレートリミット対策
 */

/**
 * リトライオプション
 */
export interface RetryOptions {
  /** 最大リトライ回数（デフォルト: 3） */
  maxRetries?: number;
  /** 初期遅延（ミリ秒、デフォルト: 1000） */
  initialDelay?: number;
  /** 最大遅延（ミリ秒、デフォルト: 60000） */
  maxDelay?: number;
  /** バックオフ乗数（デフォルト: 2） */
  backoffMultiplier?: number;
  /** リトライ対象のエラー判定関数 */
  shouldRetry?: (error: unknown) => boolean;
  /** リトライ時のコールバック */
  onRetry?: (attempt: number, delay: number, error: unknown) => void;
}

/**
 * レートリミットエラーかどうかを判定
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Anthropic API の rate limit エラー
    if (message.includes('rate_limit') || message.includes('rate limit')) {
      return true;
    }
    // HTTP 429 Too Many Requests
    if (message.includes('429') || message.includes('too many requests')) {
      return true;
    }
  }

  // fetch Response の場合
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: number }).status;
    return status === 429;
  }

  return false;
}

/**
 * 一時的なエラー（リトライ可能）かどうかを判定
 */
export function isTransientError(error: unknown): boolean {
  if (isRateLimitError(error)) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // ネットワークエラー
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket hang up')
    ) {
      return true;
    }
    // サーバーエラー（5xx）
    if (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    ) {
      return true;
    }
  }

  // fetch Response の場合
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: number }).status;
    return status >= 500 || status === 429;
  }

  return false;
}

/**
 * Anthropic API エラーから推奨待機時間を抽出
 * rate limit ヘッダーがある場合はそれを使用
 */
export function extractRetryAfter(error: unknown): number | null {
  if (typeof error === 'object' && error !== null) {
    // Anthropic SDK のエラーオブジェクト
    if ('headers' in error) {
      const headers = (error as { headers: Record<string, string> }).headers;
      const retryAfter = headers?.['retry-after'];
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) {
          return seconds * 1000; // ミリ秒に変換
        }
      }
    }

    // エラーメッセージから抽出
    if ('message' in error) {
      const message = (error as { message: string }).message;
      const match = message.match(/try again in (\d+(?:\.\d+)?)\s*(?:seconds?|s)/i);
      if (match) {
        return Math.ceil(parseFloat(match[1]) * 1000);
      }
    }
  }

  return null;
}

/**
 * 指数バックオフ付きリトライを実行
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 60000,
    backoffMultiplier = 2,
    shouldRetry = isTransientError,
    onRetry,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 最後のリトライだった場合はエラーを投げる
      if (attempt >= maxRetries) {
        throw error;
      }

      // リトライ対象でない場合はエラーを投げる
      if (!shouldRetry(error)) {
        throw error;
      }

      // rate limit エラーの場合は推奨待機時間を使用
      const retryAfter = extractRetryAfter(error);
      const actualDelay = retryAfter ? Math.max(retryAfter, delay) : delay;

      // コールバック
      if (onRetry) {
        onRetry(attempt + 1, actualDelay, error);
      } else {
        console.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${actualDelay}ms`,
          error instanceof Error ? error.message : error
        );
      }

      // 待機
      await sleep(actualDelay);

      // 次回の遅延を計算（指数バックオフ）
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * 指定ミリ秒スリープ
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * レートリミット付きの実行
 * 連続したリクエスト間に最低限の遅延を入れる
 */
export class RateLimiter {
  private lastRequestTime = 0;
  private readonly minInterval: number;

  /**
   * @param minInterval リクエスト間の最小間隔（ミリ秒）
   */
  constructor(minInterval: number = 1000) {
    this.minInterval = minInterval;
  }

  /**
   * レートリミットを適用してから関数を実行
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
    return fn();
  }
}

/**
 * 外部サイトへのリクエスト用のデフォルトオプション
 * ブロックされにくいように長めの遅延を設定
 */
export const EXTERNAL_SITE_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 2000, // 2秒から開始
  maxDelay: 30000, // 最大30秒
  backoffMultiplier: 2,
  shouldRetry: isTransientError,
  onRetry: (attempt, delay, error) => {
    console.warn(
      `[External Site] Retry attempt ${attempt} after ${delay}ms:`,
      error instanceof Error ? error.message : error
    );
  },
};

/**
 * Anthropic API 用のデフォルトオプション
 * rate limit を考慮した設定
 */
export const ANTHROPIC_API_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5, // rate limit は回復に時間がかかるので多めにリトライ
  initialDelay: 5000, // 5秒から開始
  maxDelay: 120000, // 最大2分
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // rate limit エラーは必ずリトライ
    if (isRateLimitError(error)) {
      return true;
    }
    return isTransientError(error);
  },
  onRetry: (attempt, delay, error) => {
    const isRateLimit = isRateLimitError(error);
    console.warn(
      `[Anthropic API] ${isRateLimit ? 'Rate limit hit!' : 'Error'} Retry attempt ${attempt} after ${delay}ms:`,
      error instanceof Error ? error.message : error
    );
  },
};
