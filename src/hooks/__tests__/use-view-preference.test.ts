import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockPush = vi.fn();
const mockGet = vi.fn();
const mockToString = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
    toString: mockToString,
  }),
}));

// localStorage モック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// モック後にインポート
const { useViewPreference } = await import('../use-view-preference');

describe('useViewPreference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
    mockToString.mockReturnValue('');
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('初期化', () => {
    it('デフォルトで grid モードを返す', () => {
      const { result } = renderHook(() => useViewPreference());

      expect(result.current.viewMode).toBe('grid');
    });

    it('isHydrated が false で開始し、useEffect 後に true になる', async () => {
      const { result } = renderHook(() => useViewPreference());

      // useEffect が実行された後
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isHydrated).toBe(true);
    });

    it('URL パラメータから view モードを読み込む（list）', async () => {
      mockGet.mockReturnValue('list');

      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.viewMode).toBe('list');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('card-view-mode', 'list');
    });

    it('URL パラメータから view モードを読み込む（grid）', async () => {
      mockGet.mockReturnValue('grid');

      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.viewMode).toBe('grid');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('card-view-mode', 'grid');
    });

    it('URL パラメータがない場合は localStorage から読み込む', async () => {
      mockGet.mockReturnValue(null);
      localStorageMock.getItem.mockReturnValue('list');

      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.viewMode).toBe('list');
    });

    it('URL パラメータも localStorage も無い場合はデフォルト（grid）', async () => {
      mockGet.mockReturnValue(null);
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.viewMode).toBe('grid');
    });

    it('無効な URL パラメータは無視される', async () => {
      mockGet.mockReturnValue('invalid');
      localStorageMock.getItem.mockReturnValue('list');

      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      // localStorage の値が使われる
      expect(result.current.viewMode).toBe('list');
    });

    it('無効な localStorage 値は無視される', async () => {
      mockGet.mockReturnValue(null);
      localStorageMock.getItem.mockReturnValue('invalid');

      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      // デフォルト値が使われる
      expect(result.current.viewMode).toBe('grid');
    });
  });

  describe('setViewMode', () => {
    it('viewMode を更新する', async () => {
      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        result.current.setViewMode('list');
      });

      expect(result.current.viewMode).toBe('list');
    });

    it('localStorage に保存する', async () => {
      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        result.current.setViewMode('list');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('card-view-mode', 'list');
    });

    it('URL パラメータを更新する', async () => {
      mockToString.mockReturnValue('');

      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        result.current.setViewMode('list');
      });

      expect(mockPush).toHaveBeenCalledWith('?view=list', { scroll: false });
    });

    it('既存の URL パラメータを保持する', async () => {
      mockToString.mockReturnValue('page=2&sort=name');

      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        result.current.setViewMode('list');
      });

      expect(mockPush).toHaveBeenCalledWith('?page=2&sort=name&view=list', { scroll: false });
    });
  });

  describe('toggleViewMode', () => {
    it('grid のとき toggleViewMode を呼ぶと list に変更リクエストを送る', async () => {
      mockGet.mockReturnValue('grid');
      mockToString.mockReturnValue('');

      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.viewMode).toBe('grid');

      await act(async () => {
        result.current.toggleViewMode();
      });

      // setViewMode('list') が呼ばれたことを確認
      expect(localStorageMock.setItem).toHaveBeenCalledWith('card-view-mode', 'list');
      expect(mockPush).toHaveBeenCalledWith('?view=list', { scroll: false });
    });

    it('list のとき toggleViewMode を呼ぶと grid に変更リクエストを送る', async () => {
      mockGet.mockReturnValue('list');
      mockToString.mockReturnValue('');

      const { result } = renderHook(() => useViewPreference());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.viewMode).toBe('list');

      await act(async () => {
        result.current.toggleViewMode();
      });

      // setViewMode('grid') が呼ばれたことを確認
      expect(localStorageMock.setItem).toHaveBeenCalledWith('card-view-mode', 'grid');
      expect(mockPush).toHaveBeenCalledWith('?view=grid', { scroll: false });
    });
  });
});
