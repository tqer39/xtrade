'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrustScoreHistoryEntry } from '@/modules/trust/types';

interface TrustHistoryChartProps {
  history: TrustScoreHistoryEntry[];
  className?: string;
}

/**
 * 信頼性スコアの推移を表示する折れ線グラフ
 */
export function TrustHistoryChart({ history, className }: TrustHistoryChartProps) {
  // 古い順に並び替えてグラフ用データを作成
  const data = [...history]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((entry) => ({
      date: format(new Date(entry.createdAt), 'M/d', { locale: ja }),
      総合: entry.trustScore,
      Twitter: entry.twitterScore,
      取引実績: entry.totalTradeScore,
      直近取引: entry.recentTradeScore,
    }));

  if (data.length === 0) {
    return (
      <div className={className}>
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          スコア履歴がありません
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="総合"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Twitter"
            stroke="hsl(207 90% 54%)"
            strokeWidth={1.5}
            dot={{ r: 3 }}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="取引実績"
            stroke="hsl(142 71% 45%)"
            strokeWidth={1.5}
            dot={{ r: 3 }}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="直近取引"
            stroke="hsl(38 92% 50%)"
            strokeWidth={1.5}
            dot={{ r: 3 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
