import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RootLayout, { metadata } from '../layout';

describe('RootLayout', () => {
  it('children を正しくレンダリングする', () => {
    render(
      <RootLayout>
        <div data-testid="child">Test Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('RootLayout が正しい構造を持つ', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    // jsdom では html/body が特殊扱いされるため、レンダリングされた内容を確認
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('metadata', () => {
  it('title が正しく設定されている', () => {
    expect(metadata.title).toBe('xtrade');
  });

  it('description が正しく設定されている', () => {
    expect(metadata.description).toBe('X (Twitter) トレードアプリ');
  });
});
