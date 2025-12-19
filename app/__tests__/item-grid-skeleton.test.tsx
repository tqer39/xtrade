import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ItemGridSkeleton } from '../_components/item-grid-skeleton';

describe('ItemGridSkeleton', () => {
  it('12個のスケルトンアイテムをレンダリングすること', () => {
    const { container } = render(<ItemGridSkeleton />);

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons).toHaveLength(12);
  });

  it('columnsレイアウトでレンダリングされること', () => {
    const { container } = render(<ItemGridSkeleton />);

    const columnsContainer = container.querySelector('.columns-2');
    expect(columnsContainer).toBeInTheDocument();
  });

  it('正しいカラムクラスを持つこと', () => {
    const { container } = render(<ItemGridSkeleton />);

    const columnsContainer = container.querySelector('.columns-2');
    expect(columnsContainer).toHaveClass('sm:columns-3');
    expect(columnsContainer).toHaveClass('gap-0.5');
  });

  it('各スケルトンがアスペクト比クラスを持つこと', () => {
    const { container } = render(<ItemGridSkeleton />);

    // aspect-[3/4], aspect-[4/5], aspect-[5/6], aspect-[5/7] のいずれかを持つ要素を検索
    const skeletons = container.querySelectorAll('[class*="aspect-"]');
    expect(skeletons).toHaveLength(12);
  });
});
