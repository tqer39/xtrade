import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CardGridSkeleton } from '../_components/card-grid-skeleton';

describe('CardGridSkeleton', () => {
  it('12個のスケルトンアイテムをレンダリングすること', () => {
    const { container } = render(<CardGridSkeleton />);

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons).toHaveLength(12);
  });

  it('グリッドレイアウトでレンダリングされること', () => {
    const { container } = render(<CardGridSkeleton />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('正しいグリッドクラスを持つこと', () => {
    const { container } = render(<CardGridSkeleton />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('gap-3');
  });

  it('各スケルトンがaspect-squareクラスを持つこと', () => {
    const { container } = render(<CardGridSkeleton />);

    const skeletons = container.querySelectorAll('.aspect-square');
    expect(skeletons).toHaveLength(12);
  });
});
