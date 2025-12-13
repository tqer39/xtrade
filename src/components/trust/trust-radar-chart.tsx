'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { TrustScoreBreakdown } from '@/modules/trust/types';

interface TrustRadarChartProps {
  breakdown: TrustScoreBreakdown;
  className?: string;
}

/**
 * 信頼性スコアのレーダーチャート
 * 3軸（Twitter、トータル取引、直近取引）を可視化
 */
export function TrustRadarChart({ breakdown, className }: TrustRadarChartProps) {
  // 各スコアを 0-100 に正規化してレーダーチャート用データを作成
  const data = [
    {
      axis: 'Twitter',
      value: (breakdown.twitter.score / 40) * 100,
      fullMark: 100,
      rawScore: breakdown.twitter.score,
      maxScore: 40,
    },
    {
      axis: '取引実績',
      value: (breakdown.totalTrade.score / 40) * 100,
      fullMark: 100,
      rawScore: breakdown.totalTrade.score,
      maxScore: 40,
    },
    {
      axis: '直近取引',
      value: (breakdown.recentTrade.score / 20) * 100,
      fullMark: 100,
      rawScore: breakdown.recentTrade.score,
      maxScore: 20,
    },
  ];

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="信頼性スコア"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.4}
            strokeWidth={2}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const item = payload[0].payload as (typeof data)[0];
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <p className="text-sm font-medium">{item.axis}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.rawScore} / {item.maxScore} 点
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
