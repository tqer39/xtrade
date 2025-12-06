import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useImageUpload } from '../use-image-upload';

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態が正しいこと', () => {
    const { result } = renderHook(() => useImageUpload());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.upload).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('アップロード成功時にURLを返すこと', async () => {
    const mockUrl = 'https://example.com/image.png';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: mockUrl }),
    });

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    let uploadResult: { url: string } | undefined;
    await act(async () => {
      uploadResult = await result.current.upload(file);
    });

    expect(uploadResult?.url).toBe(mockUrl);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/upload/image', {
      method: 'POST',
      body: expect.any(FormData),
    });
  });

  it('アップロード中はisUploadingがtrueになること', async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    act(() => {
      result.current.upload(file);
    });

    await waitFor(() => {
      expect(result.current.isUploading).toBe(true);
    });

    // クリーンアップ
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ url: 'https://example.com/image.png' }),
      });
    });
  });

  it('APIエラー時にエラーメッセージを設定すること', async () => {
    const errorMessage = 'Invalid file type';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: errorMessage }),
    });

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isUploading).toBe(false);
  });

  it('ネットワークエラー時にデフォルトエラーメッセージを設定すること', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow('Network error');
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isUploading).toBe(false);
  });

  it('resetでエラーをクリアできること', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Error' }),
    });

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    await act(async () => {
      try {
        await result.current.upload(file);
      } catch {
        // エラーを無視
      }
    });

    expect(result.current.error).toBe('Error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
  });

  it('エラーレスポンスにerrorがない場合デフォルトメッセージを使用すること', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow('アップロードに失敗しました');
    });

    expect(result.current.error).toBe('アップロードに失敗しました');
  });
});
