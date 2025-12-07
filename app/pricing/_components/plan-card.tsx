'use client';

import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  name: string;
  price: number;
  description: string;
  features: string[];
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PlanCard({
  name,
  price,
  description,
  features,
  isCurrentPlan,
  isPopular,
  onSelect,
  isLoading,
  disabled,
}: PlanCardProps) {
  return (
    <Card className={cn('relative flex flex-col', isPopular && 'border-primary shadow-lg')}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            おすすめ
          </span>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-6">
          <span className="text-4xl font-bold">¥{price.toLocaleString()}</span>
          <span className="text-muted-foreground">/月</span>
        </div>

        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button className="w-full" variant="outline" disabled>
            現在のプラン
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isPopular ? 'default' : 'outline'}
            onClick={onSelect}
            disabled={disabled || isLoading}
          >
            {isLoading ? '処理中...' : price === 0 ? '無料で始める' : 'このプランを選択'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
