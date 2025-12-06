import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class MockS3Client {
      send = mockSend;
    },
    PutObjectCommand: class MockPutObjectCommand {
      constructor(public params: unknown) {}
    },
  };
});

describe('r2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 環境変数をモック
    vi.stubEnv('R2_ENDPOINT', 'https://test.r2.cloudflarestorage.com');
    vi.stubEnv('R2_ACCESS_KEY_ID', 'test-access-key');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret-key');
    vi.stubEnv('R2_BUCKET_NAME', 'test-bucket');
    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com');
  });

  describe('uploadToR2', () => {
    it('ファイルをR2にアップロードしてURLを返すこと', async () => {
      mockSend.mockResolvedValueOnce({});

      // モジュールを動的にインポート（環境変数が設定された後）
      const { uploadToR2 } = await import('../r2');

      const key = 'cards/user-1/image.png';
      const body = Buffer.from('test image data');
      const contentType = 'image/png';

      const result = await uploadToR2(key, body, contentType);

      expect(result).toBe('https://cdn.example.com/cards/user-1/image.png');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('S3Clientに正しいパラメータが渡されること', async () => {
      mockSend.mockResolvedValueOnce({});

      const { uploadToR2 } = await import('../r2');

      const key = 'cards/user-1/test.jpg';
      const body = Buffer.from('jpeg data');
      const contentType = 'image/jpeg';

      await uploadToR2(key, body, contentType);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const calledWith = mockSend.mock.calls[0][0];
      expect(calledWith.params).toEqual(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: key,
          ContentType: contentType,
        })
      );
    });

    it('アップロード失敗時にエラーをスローすること', async () => {
      mockSend.mockRejectedValueOnce(new Error('Upload failed'));

      const { uploadToR2 } = await import('../r2');

      const key = 'cards/user-1/image.png';
      const body = Buffer.from('test');
      const contentType = 'image/png';

      await expect(uploadToR2(key, body, contentType)).rejects.toThrow('Upload failed');
    });
  });

  describe('uploadImageFromUrl', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      vi.stubGlobal('fetch', mockFetch);
    });

    it('外部URLから画像をダウンロードしてR2にアップロードすること', async () => {
      const imageBuffer = Buffer.from('fake image data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
        arrayBuffer: async () => imageBuffer,
      });
      mockSend.mockResolvedValueOnce({});

      const { uploadImageFromUrl } = await import('../r2');

      const result = await uploadImageFromUrl(
        'https://example.com/image.jpg',
        'photocards/official/123'
      );

      expect(result.url).toBe('https://cdn.example.com/photocards/official/123.jpg');
      expect(result.contentType).toBe('image/jpeg');
      expect(result.size).toBe(imageBuffer.length);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/image.jpg');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('PNG画像の場合は.png拡張子が付くこと', async () => {
      const imageBuffer = Buffer.from('fake png data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'image/png']]),
        arrayBuffer: async () => imageBuffer,
      });
      mockSend.mockResolvedValueOnce({});

      const { uploadImageFromUrl } = await import('../r2');

      const result = await uploadImageFromUrl(
        'https://example.com/image.png',
        'photocards/official/456'
      );

      expect(result.url).toBe('https://cdn.example.com/photocards/official/456.png');
      expect(result.contentType).toBe('image/png');
    });

    it('既に拡張子がある場合はそのまま使用すること', async () => {
      const imageBuffer = Buffer.from('fake webp data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'image/webp']]),
        arrayBuffer: async () => imageBuffer,
      });
      mockSend.mockResolvedValueOnce({});

      const { uploadImageFromUrl } = await import('../r2');

      const result = await uploadImageFromUrl(
        'https://example.com/image.webp',
        'photocards/official/789.webp'
      );

      expect(result.url).toBe('https://cdn.example.com/photocards/official/789.webp');
    });

    it('フェッチ失敗時にエラーをスローすること', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const { uploadImageFromUrl } = await import('../r2');

      await expect(
        uploadImageFromUrl('https://example.com/notfound.jpg', 'test/key')
      ).rejects.toThrow('Failed to fetch image: 404 Not Found');
    });

    it('許可されていないファイルタイプでエラーをスローすること', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'image/gif']]),
        arrayBuffer: async () => Buffer.from('gif data'),
      });

      const { uploadImageFromUrl } = await import('../r2');

      await expect(uploadImageFromUrl('https://example.com/image.gif', 'test/key')).rejects.toThrow(
        'Invalid image type: image/gif'
      );
    });

    it('ファイルサイズが2MBを超える場合にエラーをスローすること', async () => {
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
        arrayBuffer: async () => largeBuffer,
      });

      const { uploadImageFromUrl } = await import('../r2');

      await expect(uploadImageFromUrl('https://example.com/large.jpg', 'test/key')).rejects.toThrow(
        /Image too large/
      );
    });
  });

  describe('exports', () => {
    it('R2_BUCKET_NAMEが正しくエクスポートされること', async () => {
      const { R2_BUCKET_NAME } = await import('../r2');
      expect(R2_BUCKET_NAME).toBe('test-bucket');
    });

    it('R2_PUBLIC_URLが正しくエクスポートされること', async () => {
      const { R2_PUBLIC_URL } = await import('../r2');
      expect(R2_PUBLIC_URL).toBe('https://cdn.example.com');
    });
  });
});
