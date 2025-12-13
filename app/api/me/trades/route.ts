import type { SQL } from 'drizzle-orm';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { auth } from '@/lib/auth';
import type { TradeStatus } from '@/modules/trades/types';
import type { TrustGrade } from '@/modules/trust';

/**
 * GET: 自分が参加している取引一覧を取得
 * クエリパラメータ:
 *   - status: 'active' | 'completed' | 'all' (デフォルト: 'all')
 *     - active: draft, proposed, agreed
 *     - completed: completed, canceled, disputed, expired
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const searchParams = request.nextUrl.searchParams;
  const statusFilter = searchParams.get('status') || 'all';

  // ステータスフィルタの定義
  const activeStatuses: TradeStatus[] = ['draft', 'proposed', 'agreed'];
  const completedStatuses: TradeStatus[] = ['completed', 'canceled', 'disputed', 'expired'];

  let statusCondition: SQL | undefined;
  if (statusFilter === 'active') {
    statusCondition = inArray(schema.trade.status, activeStatuses);
  } else if (statusFilter === 'completed') {
    statusCondition = inArray(schema.trade.status, completedStatuses);
  }

  // 自分が参加している取引を取得
  const trades = await db
    .select({
      id: schema.trade.id,
      roomSlug: schema.trade.roomSlug,
      status: schema.trade.status,
      initiatorUserId: schema.trade.initiatorUserId,
      responderUserId: schema.trade.responderUserId,
      createdAt: schema.trade.createdAt,
      updatedAt: schema.trade.updatedAt,
    })
    .from(schema.trade)
    .where(
      and(
        or(eq(schema.trade.initiatorUserId, userId), eq(schema.trade.responderUserId, userId)),
        statusCondition
      )
    )
    .orderBy(desc(schema.trade.updatedAt))
    .limit(50);

  // 参加者情報を取得するためのユーザーIDを収集
  const userIds = new Set<string>();
  for (const trade of trades) {
    userIds.add(trade.initiatorUserId);
    if (trade.responderUserId) {
      userIds.add(trade.responderUserId);
    }
  }

  // ユーザー情報を一括取得
  const users =
    userIds.size > 0
      ? await db
          .select({
            id: schema.user.id,
            name: schema.user.name,
            image: schema.user.image,
            trustGrade: schema.user.trustGrade,
          })
          .from(schema.user)
          .where(inArray(schema.user.id, Array.from(userIds)))
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  // 取引アイテム数を取得
  const tradeIds = trades.map((t) => t.id);
  const itemCounts =
    tradeIds.length > 0
      ? await db
          .select({
            tradeId: schema.tradeItem.tradeId,
            offeredByUserId: schema.tradeItem.offeredByUserId,
          })
          .from(schema.tradeItem)
          .where(inArray(schema.tradeItem.tradeId, tradeIds))
      : [];

  // 取引ごとのアイテム数をカウント
  const itemCountMap = new Map<string, { initiatorCount: number; responderCount: number }>();
  for (const item of itemCounts) {
    const trade = trades.find((t) => t.id === item.tradeId);
    if (!trade) continue;

    const current = itemCountMap.get(item.tradeId) || { initiatorCount: 0, responderCount: 0 };
    if (item.offeredByUserId === trade.initiatorUserId) {
      current.initiatorCount++;
    } else {
      current.responderCount++;
    }
    itemCountMap.set(item.tradeId, current);
  }

  // レスポンスを構築
  const result = trades.map((trade) => {
    const initiator = userMap.get(trade.initiatorUserId);
    const responder = trade.responderUserId ? userMap.get(trade.responderUserId) : null;
    const itemCount = itemCountMap.get(trade.id) || { initiatorCount: 0, responderCount: 0 };

    // 自分が開始者かどうか
    const isInitiator = trade.initiatorUserId === userId;
    const partner = isInitiator ? responder : initiator;

    return {
      id: trade.id,
      roomSlug: trade.roomSlug,
      status: trade.status as TradeStatus,
      partner: partner
        ? {
            id: partner.id,
            name: partner.name,
            image: partner.image,
            trustGrade: partner.trustGrade as TrustGrade | null,
          }
        : null,
      myItemCount: isInitiator ? itemCount.initiatorCount : itemCount.responderCount,
      theirItemCount: isInitiator ? itemCount.responderCount : itemCount.initiatorCount,
      isInitiator,
      createdAt: trade.createdAt.toISOString(),
      updatedAt: trade.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({ trades: result });
}
