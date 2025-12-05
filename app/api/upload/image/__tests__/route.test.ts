import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockUploadToR2 = vi.fn();

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: () => mockGetSession(),
    },
  },
}));

vi.mock('@/lib/r2', () => ({
  uploadToR2: (...args: unknown[]) => mockUploadToR2(...args),
}));

// ファイルモックの型
interface MockFile {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

// FormDataとFileのモック
function createMockFile(name: string, type: string, size: number): MockFile {
  const content = new Uint8Array(size);
  return {
    name,
    type,
    size,
    arrayBuffer: () => Promise.resolve(content.buffer),
  };
}

function createMockFormData(file: MockFile | null) {
  return {
    get: (key: string) => {
      if (key === 'file' && file) {
        return file;
      }
      return null;
    },
  };
}

function createMockRequest(formData: ReturnType<typeof createMockFormData>): Request {
  return {
    formData: () => Promise.resolve(formData as unknown as FormData),
  } as unknown as Request;
}

describe('POST /api/upload/image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue(null);

    const { POST } = await import('../route');
    const file = createMockFile('test.png', 'image/png', 1024);
    const formData = createMockFormData(file);
    const request = createMockRequest(formData);

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('ファイルがない場合は 400 を返す', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    const { POST } = await import('../route');
    const formData = createMockFormData(null);
    const request = createMockRequest(formData);

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('No file provided');
  });

  it('不正なファイルタイプの場合は 400 を返す', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    const { POST } = await import('../route');
    const file = createMockFile('test.txt', 'text/plain', 1024);
    const formData = createMockFormData(file);
    const request = createMockRequest(formData);

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid file type. Allowed: PNG, JPEG, WebP');
  });

  it('ファイルサイズが大きすぎる場合は 400 を返す', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    const { POST } = await import('../route');
    // 3MB のファイル（上限は 2MB）
    const file = createMockFile('test.png', 'image/png', 3 * 1024 * 1024);
    const formData = createMockFormData(file);
    const request = createMockRequest(formData);

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('File too large. Maximum size: 2MB');
  });

  it('PNG画像を正常にアップロードできる', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mockUploadToR2.mockResolvedValue('https://example.com/cards/user-1/image.png');

    const { POST } = await import('../route');
    const file = createMockFile('test.png', 'image/png', 1024);
    const formData = createMockFormData(file);
    const request = createMockRequest(formData);

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.url).toBe('https://example.com/cards/user-1/image.png');
    expect(mockUploadToR2).toHaveBeenCalledTimes(1);
  });

  it('JPEG画像を正常にアップロードできる', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mockUploadToR2.mockResolvedValue('https://example.com/cards/user-1/image.jpg');

    const { POST } = await import('../route');
    const file = createMockFile('test.jpg', 'image/jpeg', 1024);
    const formData = createMockFormData(file);
    const request = createMockRequest(formData);

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.url).toBeDefined();
  });

  it('WebP画像を正常にアップロードできる', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mockUploadToR2.mockResolvedValue('https://example.com/cards/user-1/image.webp');

    const { POST } = await import('../route');
    const file = createMockFile('test.webp', 'image/webp', 1024);
    const formData = createMockFormData(file);
    const request = createMockRequest(formData);

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.url).toBeDefined();
  });

  it('R2へのアップロードが失敗した場合は 500 を返す', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mockUploadToR2.mockRejectedValue(new Error('R2 upload failed'));

    const { POST } = await import('../route');
    const file = createMockFile('test.png', 'image/png', 1024);
    const formData = createMockFormData(file);
    const request = createMockRequest(formData);

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to upload image');
  });
});
