import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期値を即座に返す', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('指定した遅延後に値を更新する', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    expect(result.current).toBe('initial');

    // 値を変更
    rerender({ value: 'updated', delay: 500 });

    // まだ更新されていない
    expect(result.current).toBe('initial');

    // 遅延時間経過
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // 更新された
    expect(result.current).toBe('updated');
  });

  it('遅延時間内に再度値が変更された場合、タイマーがリセットされる', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    // 値を変更
    rerender({ value: 'first', delay: 500 });

    // 300ms 経過
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // まだ更新されていない
    expect(result.current).toBe('initial');

    // 再度値を変更（タイマーリセット）
    rerender({ value: 'second', delay: 500 });

    // さらに 300ms 経過（最初の変更から 600ms、2回目の変更から 300ms）
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // まだ更新されていない（2回目の変更から 500ms 経っていない）
    expect(result.current).toBe('initial');

    // さらに 200ms 経過（2回目の変更から 500ms）
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // 2回目の値に更新された
    expect(result.current).toBe('second');
  });

  it('数値型でも動作する', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 0, delay: 300 },
    });

    expect(result.current).toBe(0);

    rerender({ value: 100, delay: 300 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(100);
  });

  it('オブジェクト型でも動作する', () => {
    const initialObj = { foo: 'bar' };
    const updatedObj = { foo: 'baz' };

    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: initialObj, delay: 200 },
    });

    expect(result.current).toEqual(initialObj);

    rerender({ value: updatedObj, delay: 200 });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toEqual(updatedObj);
  });

  it('遅延時間が変更されても正しく動作する', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    // 遅延時間を変更
    rerender({ value: 'updated', delay: 1000 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // まだ更新されていない（新しい遅延時間は 1000ms）
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // 更新された
    expect(result.current).toBe('updated');
  });
});
