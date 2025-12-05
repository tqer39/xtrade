/**
 * 名前正規化処理
 * 検索用に名前を正規化する
 */

/**
 * 名前を検索用に正規化する
 * - 全角→半角変換
 * - 空白を削除
 * - 小文字化
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFKC') // 全角→半角変換
    .toLowerCase()
    .replace(/\s+/g, '') // 空白削除
    .trim();
}

/**
 * メンバー名からひらがな読みを取得
 * メンバーマスターのデータを参照して読みを返す
 */
export function getMemberReading(
  memberName: string,
  memberMap: Map<string, string>
): string | null {
  return memberMap.get(memberName) ?? null;
}

/**
 * フォトカード名から正規化名を生成
 * 例: "木村柾哉 A ver." → "木村柾哉aver" + "きむらまさやaver"
 */
export function generateNormalizedName(cardName: string, memberReading: string | null): string {
  const normalizedCardName = normalizeName(cardName);

  if (memberReading) {
    // メンバー名の読みを含む正規化名も生成
    const memberPart = normalizeName(memberReading);
    const versionPart = normalizedCardName.replace(/^[^\s]+/, memberPart);
    return `${normalizedCardName} ${versionPart}`;
  }

  return normalizedCardName;
}
