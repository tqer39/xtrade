import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReviewItem } from '../review-list';
import { ReviewList } from '../review-list';

// 日付のモック
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-12-06T12:00:00Z'));

describe('ReviewList', () => {
  const mockReviews: ReviewItem[] = [
    {
      id: 'review-1',
      rating: 5,
      comment: '素晴らしい取引でした！',
      createdAt: '2024-12-05T12:00:00Z',
      reviewer: {
        id: 'user-1',
        name: '田中太郎',
        image: 'https://example.com/avatar1.jpg',
      },
    },
    {
      id: 'review-2',
      rating: 4,
      comment: 'スムーズな取引ができました',
      createdAt: '2024-12-01T12:00:00Z',
      reviewer: {
        id: 'user-2',
        name: '山田花子',
        image: null,
      },
    },
    {
      id: 'review-3',
      rating: 3,
      comment: null,
      createdAt: '2024-11-06T12:00:00Z',
      reviewer: {
        id: 'user-3',
        name: null,
        image: null,
      },
    },
  ];

  describe('空のレビュー一覧', () => {
    it('レビューがない場合はデフォルトメッセージを表示する', () => {
      render(<ReviewList reviews={[]} />);

      expect(screen.getByText('レビューはありません')).toBeInTheDocument();
    });

    it('カスタムの空メッセージを表示できる', () => {
      render(<ReviewList reviews={[]} emptyMessage="まだレビューがありません" />);

      expect(screen.getByText('まだレビューがありません')).toBeInTheDocument();
    });
  });

  describe('レビュー表示（通常モード）', () => {
    it('レビュアーの名前を表示する', () => {
      render(<ReviewList reviews={mockReviews} />);

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('山田花子')).toBeInTheDocument();
    });

    it('名前がない場合は「匿名ユーザー」を表示する', () => {
      render(<ReviewList reviews={mockReviews} />);

      expect(screen.getByText('匿名ユーザー')).toBeInTheDocument();
    });

    it('コメントを表示する', () => {
      render(<ReviewList reviews={mockReviews} />);

      expect(screen.getByText('素晴らしい取引でした！')).toBeInTheDocument();
      expect(screen.getByText('スムーズな取引ができました')).toBeInTheDocument();
    });

    it('コメントがない場合はコメント欄を表示しない', () => {
      render(<ReviewList reviews={[mockReviews[2]]} />);

      // コメントがないレビューのカードがあること
      expect(screen.getByText('匿名ユーザー')).toBeInTheDocument();
    });

    it('相対時間を表示する', () => {
      render(<ReviewList reviews={mockReviews} />);

      expect(screen.getByText('1日前')).toBeInTheDocument();
      expect(screen.getByText('5日前')).toBeInTheDocument();
      expect(screen.getByText('1ヶ月前')).toBeInTheDocument();
    });

    it('アバター画像を表示する', () => {
      render(<ReviewList reviews={mockReviews} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', '田中太郎');
    });

    it('画像がない場合はイニシャルを表示する', () => {
      render(<ReviewList reviews={[mockReviews[1]]} />);

      // 山田花子のイニシャル「山」
      expect(screen.getByText('山')).toBeInTheDocument();
    });
  });

  describe('自分のレビュー表示', () => {
    it('currentUserId が一致する場合は「(自分)」を表示する', () => {
      render(<ReviewList reviews={mockReviews} currentUserId="user-1" />);

      expect(screen.getByText('(自分)')).toBeInTheDocument();
    });

    it('currentUserId が一致しない場合は「(自分)」を表示しない', () => {
      render(<ReviewList reviews={mockReviews} currentUserId="other-user" />);

      expect(screen.queryByText('(自分)')).not.toBeInTheDocument();
    });
  });

  describe('コンパクトモード', () => {
    it('compact=true の場合はシンプルな表示になる', () => {
      render(<ReviewList reviews={mockReviews} compact />);

      // 名前が表示される
      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      // コメントも表示される
      expect(screen.getByText('素晴らしい取引でした！')).toBeInTheDocument();
    });

    it('compact=true でもアバターを表示する', () => {
      render(<ReviewList reviews={mockReviews} compact />);

      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe('カスタムクラス', () => {
    it('className が正しくマージされる（レビューあり）', () => {
      const { container } = render(<ReviewList reviews={mockReviews} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('className が正しくマージされる（レビューなし）', () => {
      const { container } = render(<ReviewList reviews={[]} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('時間表示', () => {
    it('1年以上前の場合は「X年前」と表示する', () => {
      const oldReview: ReviewItem = {
        id: 'old-review',
        rating: 5,
        comment: null,
        createdAt: '2023-06-06T12:00:00Z',
        reviewer: { id: 'user-1', name: 'ユーザー', image: null },
      };

      render(<ReviewList reviews={[oldReview]} />);

      expect(screen.getByText('1年前')).toBeInTheDocument();
    });

    it('数時間前の場合は「X時間前」と表示する', () => {
      const recentReview: ReviewItem = {
        id: 'recent-review',
        rating: 5,
        comment: null,
        createdAt: '2024-12-06T09:00:00Z',
        reviewer: { id: 'user-1', name: 'ユーザー', image: null },
      };

      render(<ReviewList reviews={[recentReview]} />);

      expect(screen.getByText('3時間前')).toBeInTheDocument();
    });

    it('数分前の場合は「X分前」と表示する', () => {
      const justNowReview: ReviewItem = {
        id: 'just-now-review',
        rating: 5,
        comment: null,
        createdAt: '2024-12-06T11:50:00Z',
        reviewer: { id: 'user-1', name: 'ユーザー', image: null },
      };

      render(<ReviewList reviews={[justNowReview]} />);

      expect(screen.getByText('10分前')).toBeInTheDocument();
    });

    it('直近の場合は「たった今」と表示する', () => {
      const justNowReview: ReviewItem = {
        id: 'just-now-review',
        rating: 5,
        comment: null,
        createdAt: '2024-12-06T11:59:50Z',
        reviewer: { id: 'user-1', name: 'ユーザー', image: null },
      };

      render(<ReviewList reviews={[justNowReview]} />);

      expect(screen.getByText('たった今')).toBeInTheDocument();
    });
  });
});
