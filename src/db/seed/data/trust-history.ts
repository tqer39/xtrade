/**
 * 信頼性スコア履歴のフィクスチャデータ
 * test-user-31 (コレクター太郎) の過去20週間分の履歴
 */

// 週ごとの履歴データを生成（過去20週間）
function generateTrustHistory() {
  const history: Array<{
    id: string;
    userId: string;
    trustScore: number;
    twitterScore: number;
    totalTradeScore: number;
    recentTradeScore: number;
    reason: string;
    createdAt: Date;
  }> = [];

  const now = new Date();
  const reasons = [
    '取引完了',
    'Twitter連携',
    '定期更新',
    '取引完了',
    '評価反映',
    '定期更新',
    '取引完了',
    '定期更新',
    '取引完了',
    'Twitter連携',
    '定期更新',
    '取引完了',
    '評価反映',
    '定期更新',
    '取引完了',
    '定期更新',
    '取引完了',
    'Twitter連携',
    '定期更新',
    '初期登録',
  ];

  // 20週間分の履歴を生成（古い順から）
  // スコアは60点から92点まで徐々に上昇
  for (let i = 19; i >= 0; i--) {
    const weeksAgo = i;
    const date = new Date(now);
    date.setDate(date.getDate() - weeksAgo * 7);

    // スコアの計算（60 → 92に上昇）
    const progress = (19 - i) / 19;
    const trustScore = Math.round(60 + progress * 32);

    // 各スコアの計算（配分: Twitter 0-40, TotalTrade 0-40, RecentTrade 0-20）
    // Twitter: 20 → 37
    const twitterScore = Math.round(20 + progress * 17);
    // TotalTrade: 28 → 36
    const totalTradeScore = Math.round(28 + progress * 8);
    // RecentTrade: 12 → 19
    const recentTradeScore = Math.round(12 + progress * 7);

    history.push({
      id: `trust-history-${String(20 - i).padStart(3, '0')}`,
      userId: 'test-user-31',
      trustScore,
      twitterScore,
      totalTradeScore,
      recentTradeScore,
      reason: reasons[i],
      createdAt: date,
    });
  }

  return history;
}

export const seedTrustHistory = generateTrustHistory();
