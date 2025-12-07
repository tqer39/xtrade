import { Button, Heading, Text } from '@react-email/components';

import { BaseLayout } from './base-layout';

interface VerificationEmailProps {
  verificationUrl: string;
  userName?: string;
}

/**
 * メールアドレス認証メールテンプレート
 */
export function VerificationEmail({ verificationUrl, userName }: VerificationEmailProps) {
  const greeting = userName ? `${userName} さん` : 'ユーザー';

  return (
    <BaseLayout preview="メールアドレスを認証してください - xtrade">
      <Heading style={heading}>メールアドレスの認証</Heading>

      <Text style={paragraph}>{greeting}、</Text>

      <Text style={paragraph}>
        xtrade へのメールアドレス登録をありがとうございます。
        <br />
        以下のボタンをクリックして、メールアドレスの認証を完了してください。
      </Text>

      <Button style={button} href={verificationUrl}>
        メールアドレスを認証する
      </Button>

      <Text style={paragraph}>
        ボタンがクリックできない場合は、以下のリンクをブラウザに貼り付けてください：
      </Text>

      <Text style={link}>{verificationUrl}</Text>

      <Text style={notice}>
        このリンクは <strong>1時間</strong> で有効期限が切れます。
        <br />
        このメールに心当たりがない場合は、無視していただいて問題ありません。
      </Text>
    </BaseLayout>
  );
}

// スタイル定義
const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 24px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  margin: '24px 0',
};

const link = {
  color: '#3182ce',
  fontSize: '14px',
  lineHeight: '24px',
  wordBreak: 'break-all' as const,
  margin: '0 0 16px',
};

const notice = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0 0',
  padding: '16px',
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
};

export default VerificationEmail;
