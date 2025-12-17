import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';

let transporter: Transporter | null = null;

/**
 * Mailpit 用の SMTP トランスポーターを取得
 */
export function getMailpitTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAILPIT_HOST || 'localhost',
      port: Number(process.env.MAILPIT_PORT) || 1025,
      secure: false,
    });
  }
  return transporter;
}

/**
 * 現在のメールプロバイダーが Mailpit かどうか
 */
export function isMailpitEnabled(): boolean {
  return process.env.MAIL_PROVIDER === 'mailpit';
}

/**
 * Mailpit 経由でメールを送信
 */
export async function sendViaMailpit(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transport = getMailpitTransporter();
    const result = await transport.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    console.log('[Email/Mailpit] Email sent:', result.messageId);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('[Email/Mailpit] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
