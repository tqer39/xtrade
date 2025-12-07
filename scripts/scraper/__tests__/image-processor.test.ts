import { describe, expect, it, vi } from 'vitest';
import { detectImageFormat, optimizeImage } from '../image-processor';

// sharp のモック
vi.mock('sharp', () => {
  const mockSharp = vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({
      format: 'png',
      width: 1000,
      height: 800,
    }),
    resize: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-image')),
  }));
  return { default: mockSharp };
});

describe('image-processor', () => {
  describe('detectImageFormat', () => {
    it('should detect image format from buffer', async () => {
      const buffer = Buffer.from('test-image-data');
      const format = await detectImageFormat(buffer);

      expect(format).toBe('png');
    });
  });

  describe('optimizeImage', () => {
    it('should optimize image with default options', async () => {
      const buffer = Buffer.from('test-image-data');
      const result = await optimizeImage(buffer);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should optimize image with custom format', async () => {
      const buffer = Buffer.from('test-image-data');
      const result = await optimizeImage(buffer, { format: 'jpeg' });

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should optimize image with custom quality', async () => {
      const buffer = Buffer.from('test-image-data');
      const result = await optimizeImage(buffer, { quality: 90 });

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should resize image when exceeding maxWidth', async () => {
      const buffer = Buffer.from('test-image-data');
      const result = await optimizeImage(buffer, { maxWidth: 500 });

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
