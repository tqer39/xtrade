'use client';

import { Filter, Grid, List, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CardGridFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalCount: number;
  filteredCount: number;
}

export function CardGridFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
}: CardGridFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilters = searchQuery || selectedCategory !== 'all';

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
  };

  return (
    <div className="space-y-3">
      {/* 検索バーと表示切替 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="アイテム名で検索..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={hasActiveFilters ? 'border-primary' : ''}
        >
          <Filter className="h-4 w-4" />
        </Button>
        <div className="hidden sm:flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* フィルターパネル */}
      {isFilterOpen && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">フィルター</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                クリア
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">カテゴリ</span>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* 結果カウント */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredCount}件表示 {filteredCount !== totalCount && `/ ${totalCount}件中`}
        </span>
        {hasActiveFilters && (
          <div className="flex gap-1 flex-wrap">
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                検索: {searchQuery}
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {selectedCategory}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
