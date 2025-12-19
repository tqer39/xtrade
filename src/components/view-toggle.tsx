'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '@/hooks/use-view-preference';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ viewMode, onViewModeChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="icon-sm"
        onClick={() => onViewModeChange('grid')}
        disabled={viewMode === 'grid'}
        aria-label="グリッド表示"
        aria-pressed={viewMode === 'grid'}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="icon-sm"
        onClick={() => onViewModeChange('list')}
        disabled={viewMode === 'list'}
        aria-label="リスト表示"
        aria-pressed={viewMode === 'list'}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
