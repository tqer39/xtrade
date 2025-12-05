import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { account, allowedUser, session, user, verification } from '../schema';

describe('Database Schema', () => {
  describe('user table', () => {
    it('正しいテーブル名を持つ', () => {
      expect(getTableName(user)).toBe('user');
    });

    it('必要なカラムが定義されている', () => {
      const columns = Object.keys(getTableColumns(user));
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('email');
      expect(columns).toContain('emailVerified');
      expect(columns).toContain('image');
      expect(columns).toContain('twitterUsername');
      expect(columns).toContain('role');
      expect(columns).toContain('banned');
      expect(columns).toContain('banReason');
      expect(columns).toContain('banExpires');
      expect(columns).toContain('createdAt');
      expect(columns).toContain('updatedAt');
    });

    it('id が主キーとして定義されている', () => {
      expect(user.id.primary).toBe(true);
    });

    it('email がユニーク制約を持つ', () => {
      expect(user.email.isUnique).toBe(true);
    });
  });

  describe('session table', () => {
    it('正しいテーブル名を持つ', () => {
      expect(getTableName(session)).toBe('session');
    });

    it('必要なカラムが定義されている', () => {
      const columns = Object.keys(getTableColumns(session));
      expect(columns).toContain('id');
      expect(columns).toContain('expiresAt');
      expect(columns).toContain('token');
      expect(columns).toContain('userId');
      expect(columns).toContain('ipAddress');
      expect(columns).toContain('userAgent');
    });

    it('token がユニーク制約を持つ', () => {
      expect(session.token.isUnique).toBe(true);
    });
  });

  describe('account table', () => {
    it('正しいテーブル名を持つ', () => {
      expect(getTableName(account)).toBe('account');
    });

    it('必要なカラムが定義されている', () => {
      const columns = Object.keys(getTableColumns(account));
      expect(columns).toContain('id');
      expect(columns).toContain('accountId');
      expect(columns).toContain('providerId');
      expect(columns).toContain('userId');
      expect(columns).toContain('accessToken');
      expect(columns).toContain('refreshToken');
    });
  });

  describe('verification table', () => {
    it('正しいテーブル名を持つ', () => {
      expect(getTableName(verification)).toBe('verification');
    });

    it('必要なカラムが定義されている', () => {
      const columns = Object.keys(getTableColumns(verification));
      expect(columns).toContain('id');
      expect(columns).toContain('identifier');
      expect(columns).toContain('value');
      expect(columns).toContain('expiresAt');
    });
  });

  describe('allowedUser table', () => {
    it('正しいテーブル名を持つ', () => {
      expect(getTableName(allowedUser)).toBe('allowed_user');
    });

    it('必要なカラムが定義されている', () => {
      const columns = Object.keys(getTableColumns(allowedUser));
      expect(columns).toContain('id');
      expect(columns).toContain('twitterUsername');
      expect(columns).toContain('addedBy');
      expect(columns).toContain('createdAt');
    });

    it('twitterUsername がユニーク制約を持つ', () => {
      expect(allowedUser.twitterUsername.isUnique).toBe(true);
    });
  });
});
