'use client';

import { Clock, RefreshCw, Twitter } from 'lucide-react';
import type { ReactNode } from 'react';
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

// 軸の定義（アイコンと説明）
const axisConfig: Record<string, { icon: ReactNode; label: string; color: string }> = {
  twitter: {
    icon: <Twitter className="h-3.5 w-3.5" />,
    label: 'Twitter',
    color: 'text-sky-500',
  },
  totalTrade: {
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    label: '取引実績',
    color: 'text-emerald-500',
  },
  recentTrade: {
    icon: <Clock className="h-3.5 w-3.5" />,
    label: '直近取引',
    color: 'text-amber-500',
  },
};

/**
 * 信頼性スコアのレーダーチャート
 * 3軸（Twitter、トータル取引、直近取引）を可視化
 * i18n対応のためラベルはアイコンで表示し、凡例を別途表示
 */
export function TrustRadarChart({ breakdown, className }: TrustRadarChartProps) {
  // 各スコアを 0-100 に正規化してレーダーチャート用データを作成
  const data = [
    {
      axis: 'twitter',
      axisLabel: '①',
      value: (breakdown.twitter.score / 40) * 100,
      fullMark: 100,
      rawScore: breakdown.twitter.score,
      maxScore: 40,
    },
    {
      axis: 'totalTrade',
      axisLabel: '②',
      value: (breakdown.totalTrade.score / 40) * 100,
      fullMark: 100,
      rawScore: breakdown.totalTrade.score,
      maxScore: 40,
    },
    {
      axis: 'recentTrade',
      axisLabel: '③',
      value: (breakdown.recentTrade.score / 20) * 100,
      fullMark: 100,
      rawScore: breakdown.recentTrade.score,
      maxScore: 20,
    },
  ];

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="axisLabel"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
            tickCount={3}
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
                const config = axisConfig[item.axis];
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="flex items-center gap-1.5">
                      <span className={config.color}>{config.icon}</span>
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
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

      {/* 凡例 */}
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="font-medium">①</span>
          <Twitter className={`h-3 w-3 ${axisConfig.twitter.color}`} />
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">②</span>
          <RefreshCw className={`h-3 w-3 ${axisConfig.totalTrade.color}`} />
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">③</span>
          <Clock className={`h-3 w-3 ${axisConfig.recentTrade.color}`} />
        </div>
      </div>
    </div>
  );
}
