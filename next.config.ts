import type { NextConfig } from 'next';

const securityHeaders = [
  // XSS 対策: ブラウザの XSS フィルタを有効化
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // MIME スニッフィング対策
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // クリックジャッキング対策
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // リファラポリシー
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // 権限ポリシー（不要な機能を無効化）
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  // Biome に移行したため ESLint を無効化
  eslint: {
    ignoreDuringBuilds: true,
  },

  // セキュリティヘッダーの設定
  async headers() {
    return [
      {
        // すべてのルートに適用
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // 外部画像の許可設定（Twitter/X のプロフィール画像用）
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/profile_images/**',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
