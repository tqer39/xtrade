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
