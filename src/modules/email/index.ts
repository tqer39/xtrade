/**
 * メール送信モジュール
 *
 * Resend を使用してトランザクショナルメールを送信する
 */

export { sendVerificationEmail } from './service';
export type {
  EmailValidationResult,
  SendEmailResult,
  SendVerificationEmailParams,
} from './types';
export { isDisposableEmail, verifyRecaptcha } from './validators';
