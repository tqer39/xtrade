import { describe, expect, it } from 'vitest';
import { seedCards } from '../data/cards';
import { seedTradeHistory, seedTradeItems, seedTrades } from '../data/trades';
import { seedUsers } from '../data/users';

describe('Seed Data', () => {
  describe('seedUsers', () => {
    it('32名のテストユーザーが定義されている', () => {
      expect(seedUsers).toHaveLength(32);
    });

    it('各ユーザーに必須フィールドが存在する', () => {
      for (const user of seedUsers) {
        expect(user.id).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.emailVerified).toBe(true);
        expect(user.twitterUsername).toBeDefined();
        expect(user.role).toMatch(/^(user|admin)$/);
        expect(user.trustScore).toBeGreaterThanOrEqual(0);
        expect(user.trustScore).toBeLessThanOrEqual(100);
        expect(user.trustGrade).toMatch(/^[SABCDU]$/);
      }
    });

    it('管理者ユーザーが1名含まれている', () => {
      const admins = seedUsers.filter((u) => u.role === 'admin');
      expect(admins).toHaveLength(1);
    });

    it('ユーザーIDが一意である', () => {
      const ids = seedUsers.map((u) => u.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('seedCards', () => {
    it('127件のサンプルアイテムが定義されている', () => {
      expect(seedCards).toHaveLength(127);
    });

    it('各アイテムに必須フィールドが存在する', () => {
      for (const card of seedCards) {
        expect(card.id).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.category).toBeDefined();
        expect(card.description).toBeDefined();
      }
    });

    it('複数のカテゴリが含まれている', () => {
      const categories = new Set(seedCards.map((c) => c.category));
      expect(categories.size).toBeGreaterThan(1);
    });

    it('アイテムIDが一意である', () => {
      const ids = seedCards.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('seedTrades', () => {
    it('3件のサンプルトレードが定義されている', () => {
      expect(seedTrades).toHaveLength(3);
    });

    it('各トレードに必須フィールドが存在する', () => {
      for (const trade of seedTrades) {
        expect(trade.id).toBeDefined();
        expect(trade.roomSlug).toBeDefined();
        expect(trade.initiatorUserId).toBeDefined();
        expect(trade.responderUserId).toBeDefined();
        expect(trade.status).toMatch(
          /^(draft|proposed|agreed|completed|disputed|canceled|expired)$/
        );
      }
    });

    it('異なるステータスのトレードが含まれている', () => {
      const statuses = new Set(seedTrades.map((t) => t.status));
      expect(statuses.size).toBeGreaterThan(1);
    });

    it('トレードIDが一意である', () => {
      const ids = seedTrades.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('seedTradeItems', () => {
    it('4件のトレードアイテムが定義されている', () => {
      expect(seedTradeItems).toHaveLength(4);
    });

    it('各アイテムに必須フィールドが存在する', () => {
      for (const item of seedTradeItems) {
        expect(item.id).toBeDefined();
        expect(item.tradeId).toBeDefined();
        expect(item.offeredByUserId).toBeDefined();
        expect(item.cardId).toBeDefined();
        expect(item.quantity).toBeGreaterThan(0);
      }
    });

    it('トレードアイテムIDが一意である', () => {
      const ids = seedTradeItems.map((i) => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('seedTradeHistory', () => {
    it('4件のトレード履歴が定義されている', () => {
      expect(seedTradeHistory).toHaveLength(4);
    });

    it('各履歴に必須フィールドが存在する', () => {
      for (const history of seedTradeHistory) {
        expect(history.id).toBeDefined();
        expect(history.tradeId).toBeDefined();
        expect(history.fromStatus).toBeDefined();
        expect(history.toStatus).toBeDefined();
        expect(history.changedByUserId).toBeDefined();
        expect(history.reason).toBeDefined();
      }
    });

    it('トレード履歴IDが一意である', () => {
      const ids = seedTradeHistory.map((h) => h.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
