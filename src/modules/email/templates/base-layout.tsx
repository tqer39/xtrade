import { Body, Container, Head, Html, Img, Preview, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

interface BaseLayoutProps {
  preview: string;
  children: ReactNode;
}

/**
 * メールテンプレートの共通レイアウト
 */
export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* ヘッダー */}
          <Section style={header}>
            <Img
              src="https://xtrade.tqer39.dev/logo.png"
              width="120"
              height="40"
              alt="xtrade"
              style={logo}
            />
          </Section>

          {/* メインコンテンツ */}
          <Section style={content}>{children}</Section>

          {/* フッター */}
          <Section style={footer}>
            <Text style={footerText}>
              このメールは xtrade からの自動送信です。
              <br />
              心当たりがない場合は、このメールを無視してください。
            </Text>
            <Text style={footerCopyright}>&copy; {new Date().getFullYear()} xtrade</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// スタイル定義
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '24px 48px',
  borderBottom: '1px solid #e6ebf1',
};

const logo = {
  display: 'block',
  margin: '0 auto',
};

const content = {
  padding: '32px 48px',
};

const footer = {
  padding: '24px 48px',
  borderTop: '1px solid #e6ebf1',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '0 0 8px',
};

const footerCopyright = {
  color: '#8898aa',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
};
