import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';
import { seedCards } from './data/cards';
import { seedTradeHistory, seedTradeItems, seedTrades } from './data/trades';
import { seedUsers } from './data/users';
import { assertLocalEnvironment, generateId } from './utils';

// .env.local から環境変数を読み込む
config({ path: '.env.local' });

async function main() {
  console.log('🌱 シードスクリプトを開始します...');

  // 環境チェック（本番環境では実行不可）
  assertLocalEnvironment();
  console.log('✅ ローカル環境を確認しました');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // ビジネステーブルをTRUNCATE（外部キー制約を一時的に無効化）
    console.log('🗑️  テーブルをリセット中...');
    await db.execute(sql`
      TRUNCATE TABLE
        trade_history,
        trade_item,
        trade,
        user_want_card,
        user_have_card,
        card,
        allowed_user,
        user_trust_job
      CASCADE
    `);

    // テストユーザーを削除して再作成（セッションなども CASCADE で削除）
    await db.execute(sql`
      DELETE FROM "user" WHERE id IN ('test-user-1', 'test-user-2', 'test-admin')
    `);

    // テストユーザーの作成
    console.log('👤 テストユーザーを作成中...');
    for (const userData of seedUsers) {
      await db.insert(schema.user).values({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified,
        twitterUsername: userData.twitterUsername,
        role: userData.role,
        trustScore: userData.trustScore,
        trustGrade: userData.trustGrade,
      });
    }
    console.log(`  ✓ ${seedUsers.length} 件のユーザーを作成しました`);

    // カードマスタの投入
    console.log('🎴 カードマスタデータを投入中...');
    for (const cardData of seedCards) {
      await db.insert(schema.card).values({
        id: cardData.id,
        name: cardData.name,
        category: cardData.category,
        rarity: cardData.rarity,
        createdByUserId: 'test-admin',
      });
    }
    console.log(`  ✓ ${seedCards.length} 件のカードを作成しました`);

    // 許可ユーザー（ホワイトリスト）
    console.log('📋 許可ユーザーリストを作成中...');
    const allowedUsers = [
      { id: generateId(), twitterUsername: 'testuser1', addedBy: 'test-admin' },
      { id: generateId(), twitterUsername: 'testuser2', addedBy: 'test-admin' },
      {
        id: generateId(),
        twitterUsername: 'testadmin',
        addedBy: 'test-admin',
      },
    ];
    for (const data of allowedUsers) {
      await db.insert(schema.allowedUser).values(data);
    }
    console.log(`  ✓ ${allowedUsers.length} 件の許可ユーザーを作成しました`);

    // ユーザーが持っているカード
    console.log('📦 ユーザーカードデータを作成中...');
    const userHaveCards = [
      // test-user-1 の持っているカード
      {
        id: generateId(),
        userId: 'test-user-1',
        cardId: 'card-pokemon-001',
        quantity: 2,
      },
      {
        id: generateId(),
        userId: 'test-user-1',
        cardId: 'card-pokemon-002',
        quantity: 1,
      },
      {
        id: generateId(),
        userId: 'test-user-1',
        cardId: 'card-onepiece-001',
        quantity: 3,
      },
      // test-user-2 の持っているカード
      {
        id: generateId(),
        userId: 'test-user-2',
        cardId: 'card-yugioh-001',
        quantity: 1,
      },
      {
        id: generateId(),
        userId: 'test-user-2',
        cardId: 'card-yugioh-002',
        quantity: 2,
      },
      // test-admin の持っているカード
      {
        id: generateId(),
        userId: 'test-admin',
        cardId: 'card-mtg-001',
        quantity: 1,
      },
      {
        id: generateId(),
        userId: 'test-admin',
        cardId: 'card-mtg-002',
        quantity: 1,
      },
    ];
    for (const data of userHaveCards) {
      await db.insert(schema.userHaveCard).values(data);
    }
    console.log(`  ✓ ${userHaveCards.length} 件の所持カードを作成しました`);

    // ユーザーが欲しいカード
    const userWantCards = [
      // test-user-1 の欲しいカード
      {
        id: generateId(),
        userId: 'test-user-1',
        cardId: 'card-yugioh-001',
        priority: 0,
      },
      {
        id: generateId(),
        userId: 'test-user-1',
        cardId: 'card-mtg-001',
        priority: 1,
      },
      // test-user-2 の欲しいカード
      {
        id: generateId(),
        userId: 'test-user-2',
        cardId: 'card-pokemon-001',
        priority: 0,
      },
      {
        id: generateId(),
        userId: 'test-user-2',
        cardId: 'card-pokemon-002',
        priority: 2,
      },
    ];
    for (const data of userWantCards) {
      await db.insert(schema.userWantCard).values(data);
    }
    console.log(`  ✓ ${userWantCards.length} 件の欲しいカードを作成しました`);

    // トレードの作成
    console.log('🔄 サンプルトレードを作成中...');
    for (const tradeData of seedTrades) {
      await db.insert(schema.trade).values({
        id: tradeData.id,
        roomSlug: tradeData.roomSlug,
        initiatorUserId: tradeData.initiatorUserId,
        responderUserId: tradeData.responderUserId,
        status: tradeData.status,
      });
    }
    console.log(`  ✓ ${seedTrades.length} 件のトレードを作成しました`);

    // トレードアイテムの作成
    for (const itemData of seedTradeItems) {
      await db.insert(schema.tradeItem).values({
        id: itemData.id,
        tradeId: itemData.tradeId,
        offeredByUserId: itemData.offeredByUserId,
        cardId: itemData.cardId,
        quantity: itemData.quantity,
      });
    }
    console.log(`  ✓ ${seedTradeItems.length} 件のトレードアイテムを作成しました`);

    // トレード履歴の作成
    for (const historyData of seedTradeHistory) {
      await db.insert(schema.tradeHistory).values({
        id: historyData.id,
        tradeId: historyData.tradeId,
        fromStatus: historyData.fromStatus,
        toStatus: historyData.toStatus,
        changedByUserId: historyData.changedByUserId,
        reason: historyData.reason,
      });
    }
    console.log(`  ✓ ${seedTradeHistory.length} 件のトレード履歴を作成しました`);

    console.log('');
    console.log('✅ シードが完了しました！');
    console.log('');
    console.log('作成されたデータ:');
    console.log(`  - ユーザー: ${seedUsers.length} 件`);
    console.log(`  - カード: ${seedCards.length} 件`);
    console.log(`  - 許可ユーザー: ${allowedUsers.length} 件`);
    console.log(`  - 所持カード: ${userHaveCards.length} 件`);
    console.log(`  - 欲しいカード: ${userWantCards.length} 件`);
    console.log(`  - トレード: ${seedTrades.length} 件`);
    console.log(`  - トレードアイテム: ${seedTradeItems.length} 件`);
    console.log(`  - トレード履歴: ${seedTradeHistory.length} 件`);
  } catch (error) {
    console.error('❌ シードに失敗しました:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
