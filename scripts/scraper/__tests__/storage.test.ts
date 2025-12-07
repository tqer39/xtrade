import { describe, expect, it } from 'vitest';
import { generateImageKey } from '../storage';

describe('storage', () => {
  describe('generateImageKey', () => {
    it('should generate key with default prefix and extension', () => {
      const buffer = Buffer.from('test-image-data');
      const key = generateImageKey(buffer);

      expect(key).toMatch(/^cards\/[a-f0-9]{16}\.png$/);
    });

    it('should generate key with custom prefix', () => {
      const buffer = Buffer.from('test-image-data');
      const key = generateImageKey(buffer, { prefix: 'photocards' });

      expect(key).toMatch(/^photocards\/[a-f0-9]{16}\.png$/);
    });

    it('should generate key with custom extension', () => {
      const buffer = Buffer.from('test-image-data');
      const key = generateImageKey(buffer, { extension: 'jpeg' });

      expect(key).toMatch(/^cards\/[a-f0-9]{16}\.jpeg$/);
    });

    it('should generate consistent key for same buffer', () => {
      const buffer = Buffer.from('test-image-data');
      const key1 = generateImageKey(buffer);
      const key2 = generateImageKey(buffer);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different buffers', () => {
      const buffer1 = Buffer.from('test-image-data-1');
      const buffer2 = Buffer.from('test-image-data-2');
      const key1 = generateImageKey(buffer1);
      const key2 = generateImageKey(buffer2);

      expect(key1).not.toBe(key2);
    });

    it('should use SHA-256 hash truncated to 16 characters', () => {
      const buffer = Buffer.from('test-image-data');
      const key = generateImageKey(buffer);

      // キーの形式: prefix/hash.extension
      const hash = key.split('/')[1].split('.')[0];
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });
});
