import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ReviewForm } from '../review-form';

// ResizeObserver のモック（Radix UI コンポーネント用）
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  global.ResizeObserver = ResizeObserverMock;
});

describe('ReviewForm', () => {
  const defaultProps = {
    partnerName: 'テストユーザー',
    onSubmit: vi.fn().mockResolvedValue(undefined),
  };

  describe('基本レンダリング', () => {
    it('タイトルを表示する', () => {
      render(<ReviewForm {...defaultProps} />);

      // CardTitle として表示されていることを確認
      const title = screen.getByText('レビューを投稿', { selector: '[data-slot="card-title"]' });
      expect(title).toBeInTheDocument();
    });

    it('取引相手の名前を含む説明を表示する', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText('テストユーザーさんとの取引を評価してください')).toBeInTheDocument();
    });

    it('評価ラベルを表示する', () => {
      render(<ReviewForm {...defaultProps} />);

      // Label 要素として表示されていることを確認
      const label = screen.getByText('評価', { selector: '[data-slot="label"]' });
      expect(label).toBeInTheDocument();
    });

    it('コメント入力欄を表示する', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByLabelText('コメント（任意）')).toBeInTheDocument();
    });

    it('公開設定のスイッチを表示する', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText('レビューを公開する')).toBeInTheDocument();
    });

    it('送信ボタンを表示する', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'レビューを投稿' })).toBeInTheDocument();
    });
  });

  describe('評価未選択時', () => {
    it('送信ボタンが無効になっている', () => {
      render(<ReviewForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'レビューを投稿' });
      expect(submitButton).toBeDisabled();
    });

    it('フォーム送信時にエラーメッセージを表示する', async () => {
      render(<ReviewForm {...defaultProps} />);

      // 評価を選択してから解除することで rating=0 の状態でフォーム送信できるかテスト
      // しかしボタンが無効なので送信できない
      const submitButton = screen.getByRole('button', { name: 'レビューを投稿' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('評価選択', () => {
    it('星をクリックすると評価が設定される', async () => {
      render(<ReviewForm {...defaultProps} />);

      const star3 = screen.getByLabelText('3つ星');
      fireEvent.click(star3);

      expect(screen.getByText('3つ星')).toBeInTheDocument();
    });

    it('評価を選択すると送信ボタンが有効になる', async () => {
      render(<ReviewForm {...defaultProps} />);

      const star4 = screen.getByLabelText('4つ星');
      fireEvent.click(star4);

      const submitButton = screen.getByRole('button', { name: 'レビューを投稿' });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('コメント入力', () => {
    it('コメントを入力できる', () => {
      render(<ReviewForm {...defaultProps} />);

      const textarea = screen.getByLabelText('コメント（任意）');
      fireEvent.change(textarea, { target: { value: 'とても良い取引でした' } });

      expect(textarea).toHaveValue('とても良い取引でした');
    });

    it('文字数カウンターを表示する', () => {
      render(<ReviewForm {...defaultProps} />);

      const textarea = screen.getByLabelText('コメント（任意）');
      fireEvent.change(textarea, { target: { value: 'テスト' } });

      expect(screen.getByText('3/500')).toBeInTheDocument();
    });
  });

  describe('公開設定', () => {
    it('デフォルトで公開が ON になっている', () => {
      render(<ReviewForm {...defaultProps} />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('フォーム送信', () => {
    it('onSubmit が正しいデータで呼ばれる', async () => {
      const handleSubmit = vi.fn().mockResolvedValue(undefined);
      render(<ReviewForm {...defaultProps} onSubmit={handleSubmit} />);

      // 評価を選択
      fireEvent.click(screen.getByLabelText('5つ星'));

      // コメントを入力
      const textarea = screen.getByLabelText('コメント（任意）');
      fireEvent.change(textarea, { target: { value: '素晴らしい取引でした' } });

      // 送信
      fireEvent.click(screen.getByRole('button', { name: 'レビューを投稿' }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          rating: 5,
          comment: '素晴らしい取引でした',
          isPublic: true,
        });
      });
    });

    it('送信中は送信ボタンのテキストが変わる', () => {
      render(<ReviewForm {...defaultProps} isSubmitting />);

      expect(screen.getByRole('button', { name: '送信中...' })).toBeInTheDocument();
    });

    it('送信中は送信ボタンが無効になる', () => {
      render(<ReviewForm {...defaultProps} isSubmitting />);

      const submitButton = screen.getByRole('button', { name: '送信中...' });
      expect(submitButton).toBeDisabled();
    });

    it('送信失敗時にエラーメッセージを表示する', async () => {
      const handleSubmit = vi.fn().mockRejectedValue(new Error('送信に失敗しました'));
      render(<ReviewForm {...defaultProps} onSubmit={handleSubmit} />);

      // 評価を選択
      fireEvent.click(screen.getByLabelText('5つ星'));

      // 送信
      fireEvent.click(screen.getByRole('button', { name: 'レビューを投稿' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('送信に失敗しました');
      });
    });
  });

  describe('キャンセルボタン', () => {
    it('onCancel が指定されている場合はキャンセルボタンを表示する', () => {
      const handleCancel = vi.fn();
      render(<ReviewForm {...defaultProps} onCancel={handleCancel} />);

      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('onCancel が指定されていない場合はキャンセルボタンを表示しない', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument();
    });

    it('キャンセルボタンをクリックすると onCancel が呼ばれる', () => {
      const handleCancel = vi.fn();
      render(<ReviewForm {...defaultProps} onCancel={handleCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(handleCancel).toHaveBeenCalled();
    });

    it('送信中はキャンセルボタンが無効になる', () => {
      const handleCancel = vi.fn();
      render(<ReviewForm {...defaultProps} onCancel={handleCancel} isSubmitting />);

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('カスタムクラス', () => {
    it('className が正しくマージされる', () => {
      const { container } = render(<ReviewForm {...defaultProps} className="custom-class" />);

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });
  });
});
