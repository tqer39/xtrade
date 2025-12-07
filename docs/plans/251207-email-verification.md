# メールアドレス認証機能 実装計画

- **作成日**: 2024-12-07
- **ステータス**: 実装完了
- **担当 Agent**: ArchAgent（起点）→ APIAgent, UIAgent, TestAgent

## 概要

X Auth 認証済みユーザーがメールアドレスを追加認証できる機能を実装し、信頼性スコアに組み込む。

## 前提条件

- [x] X OAuth 認証設定済み（BetterAuth）
- [x] 信頼スコアシステム実装済み（3要素: Xプロフィール + 行動 + レビュー）
- [x] ユーザーテーブルに `email`, `emailVerified` フィールドあり

## 要件

1. **登録方式**: X Auth 必須、メールアドレスは追加認証のみ
2. **スコア設計**: 100点満点を維持し既存配分を調整
3. **メール送信**: Resend を採用
4. **セキュリティ**: レート制限、使い捨てメール拒否、reCAPTCHA

---

## 信頼スコア配分変更

| 要素 | 変更前 | 変更後 |
| --- | --- | --- |
| Xプロフィール | 40点 | 35点 |
| 行動スコア | 40点 | 35点 |
| レビュースコア | 20点 | 20点 |
| メール認証 | - | 10点 |
| **合計** | 100点 | 100点 |

---

## 実装順序

### Phase 1: 基盤整備

**担当**: ArchAgent

#### パッケージ追加

```bash
npm install resend @react-email/components disposable-email-domains
```

#### 環境変数追加

```bash
# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@xtrade-dev.tqer39.dev

# reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
```

**成果物**:

- `.env.example` - 環境変数追加

---

### Phase 2: メール送信モジュール

**担当**: APIAgent

#### ディレクトリ構成

```text
src/modules/email/
├── types.ts              # 型定義
├── resend-client.ts      # Resend クライアント
├── service.ts            # メール送信サービス
├── templates/
│   ├── base-layout.tsx   # 共通レイアウト (React Email)
│   └── verification.tsx  # 認証メールテンプレート
├── validators/
│   ├── disposable-check.ts  # 使い捨てメールチェック
│   ├── recaptcha.ts         # reCAPTCHA v3 検証
│   └── index.ts
└── index.ts
```

**成果物**:

- `src/modules/email/` - メールモジュール全体

---

### Phase 3: BetterAuth 設定更新

**担当**: APIAgent

#### 変更内容

```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  // 既存設定...

  emailVerification: {
    sendOnSignUp: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        verificationUrl: url,
        userName: user.name,
      });
    },
    expiresIn: 60 * 60, // 1時間
    callbackURL: '/settings?email_verified=true',
  },
});
```

**成果物**:

- `src/lib/auth.ts` - emailVerification 設定追加
- `src/lib/auth-client.ts` - メール認証メソッドエクスポート

---

### Phase 4: API エンドポイント

**担当**: APIAgent

#### POST `/api/me/email/send-verification`

認証メール送信 API。

- 認証: 必須（セッション）
- レート制限: 1時間に3回まで
- バリデーション: メールアドレス形式、使い捨てメール拒否、reCAPTCHA

```typescript
// リクエスト
{
  email: string;
  recaptchaToken: string;
}

// レスポンス
{
  success: true;
  message: string;
}
```

**成果物**:

- `app/api/me/email/send-verification/route.ts`

---

### Phase 5: UI 実装

**担当**: UIAgent

#### メールアドレス追加フォーム

- コンポーネント: `src/components/auth/add-email-form.tsx`
- 機能: メールアドレス入力、認証ステータス表示、送信ボタン

#### 認証完了ページ

- ページ: `app/auth/verify-email/page.tsx`
- 機能: 成功/失敗メッセージ表示

**成果物**:

- `src/components/auth/add-email-form.tsx`
- `app/auth/verify-email/page.tsx`

---

### Phase 6: 信頼スコア統合

**担当**: APIAgent

#### 型定義追加

```typescript
// src/modules/trust/types.ts
export interface EmailVerificationInput {
  emailVerified: boolean;
}

export interface CombinedTrustScoreWithEmailResult {
  totalScore: number;
  grade: TrustGrade;
  breakdown: {
    xProfile: number;      // 0〜35
    behavior: number;      // 0〜35
    review: number;        // 0〜20
    emailVerification: number; // 0〜10
  };
}
```

#### 計算ロジック更新

```typescript
// src/modules/trust/calc-trust-score.ts
export function calcEmailVerificationScore(p: EmailVerificationInput): number {
  return p.emailVerified ? 10 : 0;
}

export function calcCombinedTrustScoreWithEmail(
  xProfileInput: TrustScoreInput,
  behaviorInput: BehaviorScoreInput,
  reviewInput: ReviewScoreInput,
  emailInput: EmailVerificationInput
): CombinedTrustScoreWithEmailResult {
  // 4要素を統合
}
```

**成果物**:

- `src/modules/trust/types.ts` - 型追加
- `src/modules/trust/calc-trust-score.ts` - スコア配分調整、新関数追加
- `src/modules/trust/index.ts` - エクスポート更新

---

### Phase 7: テスト更新

**担当**: TestAgent

#### テスト更新内容

- `calcXProfileScore`: 40点 → 35点
- `calcBehaviorScore`: 40点 → 35点
- `calcEmailVerificationScore`: 新規テスト追加
- `calcCombinedTrustScoreWithEmail`: 新規テスト追加

**成果物**:

- `src/modules/trust/__tests__/calc-trust-score.test.ts`

---

## セキュリティ対策

| 項目 | 対策 | 実装方法 |
| --- | --- | --- |
| レート制限 | 1時間に3回まで | verification テーブルでカウント |
| トークン有効期限 | 1時間で失効 | BetterAuth 設定 |
| CSRF対策 | BetterAuth 組み込み | 設定済み |
| 使い捨てメール拒否 | ブロックリスト | `disposable-email-domains` |
| reCAPTCHA v3 | ボット対策 | Google reCAPTCHA API |

---

## 変更ファイル一覧

### 新規作成

| ファイル | 説明 |
| --- | --- |
| `src/modules/email/types.ts` | メール送信の型定義 |
| `src/modules/email/resend-client.ts` | Resend クライアント |
| `src/modules/email/service.ts` | メール送信サービス |
| `src/modules/email/templates/base-layout.tsx` | メールテンプレート共通レイアウト |
| `src/modules/email/templates/verification.tsx` | 認証メールテンプレート |
| `src/modules/email/validators/disposable-check.ts` | 使い捨てメールチェック |
| `src/modules/email/validators/recaptcha.ts` | reCAPTCHA v3 検証 |
| `src/modules/email/validators/index.ts` | バリデーターエクスポート |
| `src/modules/email/index.ts` | モジュールエクスポート |
| `src/components/auth/add-email-form.tsx` | メールアドレス追加フォーム |
| `app/api/me/email/send-verification/route.ts` | 認証メール送信 API |
| `app/auth/verify-email/page.tsx` | 認証完了ページ |

### 変更

| ファイル | 変更内容 |
| --- | --- |
| `.env.example` | Resend, reCAPTCHA 環境変数追加 |
| `src/lib/auth.ts` | emailVerification 設定追加 |
| `src/lib/auth-client.ts` | メール認証メソッドエクスポート |
| `src/modules/trust/types.ts` | EmailVerificationInput 型追加 |
| `src/modules/trust/calc-trust-score.ts` | スコア配分調整（35+35+20+10=100） |
| `src/modules/trust/index.ts` | 新関数・型エクスポート |
| `src/modules/trust/__tests__/calc-trust-score.test.ts` | テスト更新 |

---

## Resend を選定した理由

| 観点 | Resend | SendGrid | Amazon SES |
| --- | --- | --- | --- |
| 無料枠 | 3,000通/月 | 100通/日 | 従量課金 |
| Next.js 統合 | 公式 SDK | 良好 | 設定複雑 |
| React Email | 対応 | 非対応 | 非対応 |
| DX | 優秀 | 良好 | 低 |

**結論**: Next.js + React との相性が最も良く、MVP フェーズに最適。

---

## 次のステップ（運用開始前）

1. **Resend アカウント設定**
   - Resend でアカウント作成
   - API キー取得
   - ドメイン認証（`xtrade.tqer39.dev` または サブドメイン）

2. **reCAPTCHA 設定**
   - Google reCAPTCHA 管理画面でサイトキー取得
   - `.env.local` に環境変数設定

3. **UI 統合**
   - 設定ページに `AddEmailForm` コンポーネントを配置
