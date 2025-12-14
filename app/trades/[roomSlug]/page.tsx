'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ImageIcon,
  Loader2,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';

import { LoginButton } from '@/components/auth/login-button';
import { TrustBadge } from '@/components/trust';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useMyCards } from '@/hooks/use-my-cards';
import { useSession } from '@/lib/auth-client';
import type { TradeDetail, TradeStatus } from '@/modules/trades/types';

interface Props {
  params: Promise<{ roomSlug: string }>;
}

const statusConfig: Record<
  TradeStatus,
  { label: string; color: string; icon: React.ReactNode; description: string }
> = {
  draft: {
    label: '下書き',
    color: 'bg-gray-500',
    icon: <Clock className="h-4 w-4" />,
    description: 'アイテムを選択してください',
  },
  proposed: {
    label: '提案中',
    color: 'bg-blue-500',
    icon: <Send className="h-4 w-4" />,
    description: '相手の承認を待っています',
  },
  agreed: {
    label: '合意済み',
    color: 'bg-amber-500',
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: '取引を完了してください',
  },
  completed: {
    label: '完了',
    color: 'bg-green-500',
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: '取引が完了しました',
  },
  canceled: {
    label: 'キャンセル',
    color: 'bg-gray-500',
    icon: <XCircle className="h-4 w-4" />,
    description: '取引がキャンセルされました',
  },
  disputed: {
    label: '問題発生',
    color: 'bg-red-500',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: '問題が報告されています',
  },
  expired: {
    label: '期限切れ',
    color: 'bg-gray-500',
    icon: <Clock className="h-4 w-4" />,
    description: '取引の期限が切れました',
  },
};

export default function TradeRoomPage({ params }: Props) {
  const { roomSlug } = use(params);
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const { haveCards, isLoading: isCardsLoading } = useMyCards();
  const [trade, setTrade] = useState<TradeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [isUpdatingOffer, setIsUpdatingOffer] = useState(false);

  const fetchTrade = useCallback(async () => {
    if (!session?.user) return;

    try {
      const res = await fetch(`/api/trades/${roomSlug}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('取引が見つかりません');
        } else if (res.status === 401) {
          setError('この取引にアクセスする権限がありません');
        } else {
          throw new Error('データの取得に失敗しました');
        }
        return;
      }
      const data = await res.json();
      setTrade(data.trade);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [roomSlug, session?.user]);

  useEffect(() => {
    fetchTrade();
  }, [fetchTrade]);

  const handleOpenAddItemModal = () => {
    if (!trade) return;
    // 現在のオファーアイテムを選択状態に設定
    const isInitiator = session?.user?.id === trade.initiator.id;
    const myItems = isInitiator ? trade.initiatorItems : trade.responderItems;
    setSelectedCardIds(new Set(myItems.map((item) => item.cardId)));
    setIsAddItemModalOpen(true);
  };

  const handleToggleCard = (cardId: string) => {
    setSelectedCardIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleUpdateOffer = async () => {
    if (!trade || isUpdatingOffer) return;

    setIsUpdatingOffer(true);
    try {
      const items = Array.from(selectedCardIds).map((cardId) => ({
        cardId,
        quantity: 1,
      }));

      const res = await fetch(`/api/trades/${roomSlug}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'オファーの更新に失敗しました');
      }

      await fetchTrade();
      setIsAddItemModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsUpdatingOffer(false);
    }
  };

  const handleRemoveItem = async (cardId: string) => {
    if (!trade || isUpdatingOffer) return;

    setIsUpdatingOffer(true);
    try {
      const isInitiator = session?.user?.id === trade.initiator.id;
      const myItems = isInitiator ? trade.initiatorItems : trade.responderItems;
      const newItems = myItems
        .filter((item) => item.cardId !== cardId)
        .map((item) => ({ cardId: item.cardId, quantity: item.quantity }));

      const res = await fetch(`/api/trades/${roomSlug}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'アイテムの削除に失敗しました');
      }

      await fetchTrade();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsUpdatingOffer(false);
    }
  };

  const handleAction = async (
    action: 'propose' | 'agree' | 'complete' | 'cancel' | 'dispute' | 'uncancel'
  ) => {
    if (!trade || isActionLoading) return;

    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/trades/${roomSlug}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: comment || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'アクションに失敗しました');
      }

      await fetchTrade();
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isSessionPending) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">取引ルームを表示するにはログインが必要です</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>
            戻る
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !trade) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const currentUserId = session.user.id;
  const isInitiator = trade.initiator.id === currentUserId;
  const isResponder = trade.responder?.id === currentUserId;
  const isParticipant = isInitiator || isResponder;
  const myItems = isInitiator ? trade.initiatorItems : trade.responderItems;
  const theirItems = isInitiator ? trade.responderItems : trade.initiatorItems;
  const myProfile = isInitiator ? trade.initiator : trade.responder;
  const theirProfile = isInitiator ? trade.responder : trade.initiator;
  const statusInfo = statusConfig[trade.status];

  // アクションボタンの表示条件
  const canPropose = trade.status === 'draft' && isInitiator && myItems.length > 0;
  const canAgree = trade.status === 'proposed' && isResponder;
  const canComplete = trade.status === 'agreed' && isParticipant;
  const canCancel = ['draft', 'proposed', 'agreed'].includes(trade.status) && isParticipant;
  const canDispute = trade.status === 'agreed' && isParticipant;
  const canUncancel = trade.status === 'canceled' && isParticipant;
  const isTerminal = ['completed', 'canceled', 'disputed', 'expired'].includes(trade.status);
  // オファー編集は draft 状態のみ可能
  const canEditOffer = trade.status === 'draft';
  // 提案ボタンを表示するが無効化する場合のヒント
  const showProposeHint = trade.status === 'draft' && isInitiator && myItems.length === 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
            xtrade
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">取引ルーム</h1>
          <Badge className={`${statusInfo.color} text-white gap-1`}>
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{statusInfo.description}</p>
      </div>

      {/* 取引参加者 */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* 相手側 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">相手のオファー</CardTitle>
          </CardHeader>
          <CardContent>
            {theirProfile ? (
              <div className="flex items-center gap-3 mb-4">
                {theirProfile.image ? (
                  <img
                    src={theirProfile.image}
                    alt={theirProfile.name ?? ''}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{theirProfile.name ?? '名前未設定'}</p>
                  <TrustBadge grade={theirProfile.trustGrade} size="sm" />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm mb-4">相手が参加していません</p>
            )}

            {theirItems.length > 0 ? (
              <div className="space-y-2">
                {theirItems.map((item) => (
                  <div
                    key={item.cardId}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                  >
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{item.cardName}</span>
                    <Badge variant="secondary" className="text-xs">
                      ×{item.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                オファーされたアイテムはありません
              </p>
            )}
          </CardContent>
        </Card>

        {/* 自分側 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">あなたのオファー</CardTitle>
          </CardHeader>
          <CardContent>
            {myProfile && (
              <div className="flex items-center gap-3 mb-4">
                {myProfile.image ? (
                  <img
                    src={myProfile.image}
                    alt={myProfile.name ?? ''}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{myProfile.name ?? '名前未設定'}</p>
                  <TrustBadge grade={myProfile.trustGrade} size="sm" />
                </div>
              </div>
            )}

            {myItems.length > 0 ? (
              <div className="space-y-2">
                {myItems.map((item) => (
                  <div
                    key={item.cardId}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                  >
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{item.cardName}</span>
                    <Badge variant="secondary" className="text-xs">
                      ×{item.quantity}
                    </Badge>
                    {canEditOffer && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveItem(item.cardId)}
                        disabled={isUpdatingOffer}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                オファーするアイテムを選択してください
              </p>
            )}

            {canEditOffer && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 gap-1"
                onClick={handleOpenAddItemModal}
              >
                <Plus className="h-4 w-4" />
                アイテムを追加
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* コメント欄 */}
      {!isTerminal && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              コメント
            </CardTitle>
            <CardDescription>
              アクション実行時にメッセージを添付できます（提案、承認、キャンセル等）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="コメントを入力..."
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>
      )}

      {/* アクションボタン */}
      {!isTerminal && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {canPropose && (
              <Button onClick={() => handleAction('propose')} disabled={isActionLoading}>
                <Send className="h-4 w-4 mr-2" />
                取引を提案
              </Button>
            )}
            {showProposeHint && (
              <Button disabled>
                <Send className="h-4 w-4 mr-2" />
                取引を提案
              </Button>
            )}
            {canAgree && (
              <Button
                onClick={() => handleAction('agree')}
                disabled={isActionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                承認する
              </Button>
            )}
            {canComplete && (
              <Button
                onClick={() => handleAction('complete')}
                disabled={isActionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                取引完了
              </Button>
            )}
            {canDispute && (
              <Button
                variant="destructive"
                onClick={() => handleAction('dispute')}
                disabled={isActionLoading}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                問題を報告
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => handleAction('cancel')}
                disabled={isActionLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                キャンセル
              </Button>
            )}
            {canUncancel && (
              <Button
                variant="outline"
                onClick={() => handleAction('uncancel')}
                disabled={isActionLoading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                キャンセルを取り消す
              </Button>
            )}
          </div>
          {showProposeHint && (
            <p className="text-sm text-muted-foreground">
              取引を提案するには、先にオファーするアイテムを追加してください
            </p>
          )}
        </div>
      )}

      {/* 取引情報 */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">取引情報</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">ルームID:</span> {trade.roomSlug}
          </p>
          <p>
            <span className="text-muted-foreground">作成日:</span>{' '}
            {new Date(trade.createdAt).toLocaleDateString('ja-JP')}
          </p>
          {trade.proposedExpiredAt && (
            <p>
              <span className="text-muted-foreground">提案期限:</span>{' '}
              {new Date(trade.proposedExpiredAt).toLocaleDateString('ja-JP')}
            </p>
          )}
          {trade.agreedExpiredAt && (
            <p>
              <span className="text-muted-foreground">取引期限:</span>{' '}
              {new Date(trade.agreedExpiredAt).toLocaleDateString('ja-JP')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* アイテム追加モーダル */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>オファーするアイテムを選択</DialogTitle>
            <DialogDescription>取引でオファーするアイテムを選んでください</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {isCardsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : haveCards.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  持っているアイテムがありません。
                  <br />
                  先にアイテムを登録してください。
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {haveCards.map((haveCard) => {
                  const isSelected = selectedCardIds.has(haveCard.cardId);
                  return (
                    <button
                      key={haveCard.cardId}
                      type="button"
                      onClick={() => handleToggleCard(haveCard.cardId)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
                      }`}
                    >
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {haveCard.card?.imageUrl ? (
                          <img
                            src={haveCard.card.imageUrl}
                            alt={haveCard.card.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium truncate">{haveCard.card?.name ?? 'Unknown'}</p>
                        {haveCard.card?.category && (
                          <p className="text-sm text-muted-foreground truncate">
                            {haveCard.card.category}
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsAddItemModalOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpdateOffer}
              disabled={isUpdatingOffer || haveCards.length === 0}
            >
              {isUpdatingOffer ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedCardIds.size > 0 ? `${selectedCardIds.size}件を選択` : 'クリアする'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
