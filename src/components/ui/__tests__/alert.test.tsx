import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert, AlertDescription, AlertTitle } from '../alert';

describe('Alert', () => {
  describe('Alert コンポーネント', () => {
    it('デフォルトのアラートをレンダリングする', () => {
      render(<Alert>テストメッセージ</Alert>);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('テストメッセージ');
      expect(alert).toHaveAttribute('data-slot', 'alert');
    });

    it('destructive バリアントをレンダリングする', () => {
      render(<Alert variant="destructive">エラーメッセージ</Alert>);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('text-destructive');
    });

    it('カスタムクラス名を適用する', () => {
      render(<Alert className="custom-class">テスト</Alert>);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-class');
    });
  });

  describe('AlertTitle コンポーネント', () => {
    it('タイトルをレンダリングする', () => {
      render(<AlertTitle>タイトル</AlertTitle>);

      const title = screen.getByText('タイトル');
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-slot', 'alert-title');
    });

    it('カスタムクラス名を適用する', () => {
      render(<AlertTitle className="custom-title">タイトル</AlertTitle>);

      const title = screen.getByText('タイトル');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('AlertDescription コンポーネント', () => {
    it('説明文をレンダリングする', () => {
      render(<AlertDescription>説明文</AlertDescription>);

      const description = screen.getByText('説明文');
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute('data-slot', 'alert-description');
    });

    it('カスタムクラス名を適用する', () => {
      render(<AlertDescription className="custom-desc">説明文</AlertDescription>);

      const description = screen.getByText('説明文');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('組み合わせ', () => {
    it('Alert, AlertTitle, AlertDescription を組み合わせてレンダリングする', () => {
      render(
        <Alert>
          <AlertTitle>警告</AlertTitle>
          <AlertDescription>詳細な説明文です。</AlertDescription>
        </Alert>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('警告')).toBeInTheDocument();
      expect(screen.getByText('詳細な説明文です。')).toBeInTheDocument();
    });
  });
});
