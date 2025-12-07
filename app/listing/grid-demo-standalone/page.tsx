'use client';

import { Heart, ImageIcon, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// モックデータ
const mockCards = [
  {
    id: '1',
    name: 'ピカチュウ',
    category: 'ポケモン',
    rarity: 'SSR',
    imageUrl: 'https://images.unsplash.com/photo-1542779283-429940ce8336?w=400&h=400&fit=crop',
    quantity: 3,
  },
  {
    id: '2',
    name: 'リザードン',
    category: 'ポケモン',
    rarity: 'UR',
    imageUrl: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=400&h=400&fit=crop',
    quantity: 1,
  },
  {
    id: '3',
    name: 'フシギバナ',
    category: 'ポケモン',
    rarity: 'SR',
    imageUrl: 'https://images.unsplash.com/photo-1606663889134-b1dedb5ed8b7?w=400&h=400&fit=crop',
    quantity: 2,
  },
  {
    id: '4',
    name: 'カメックス',
    category: 'ポケモン',
    rarity: 'SR',
    imageUrl: 'https://images.unsplash.com/photo-1574681626783-4c0e3b8a2f5c?w=400&h=400&fit=crop',
    quantity: 1,
  },
  {
    id: '5',
    name: 'ミュウツー',
    category: 'ポケモン',
    rarity: 'UR',
    imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=400&fit=crop',
    quantity: 1,
  },
  {
    id: '6',
    name: 'イーブイ',
    category: 'ポケモン',
    rarity: 'R',
    imageUrl: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=400&h=400&fit=crop',
    quantity: 5,
  },
  {
    id: '7',
    name: 'ゲンガー',
    category: 'ポケモン',
    rarity: 'SSR',
    imageUrl: 'https://images.unsplash.com/photo-1598111456570-b6e1b6f95e0a?w=400&h=400&fit=crop',
    quantity: 2,
  },
  {
    id: '8',
    name: 'カビゴン',
    category: 'ポケモン',
    rarity: 'R',
    imageUrl: 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?w=400&h=400&fit=crop',
    quantity: 4,
  },
  {
    id: '9',
    name: 'ルカリオ',
    category: 'ポケモン',
    rarity: 'SSR',
    imageUrl: 'https://images.unsplash.com/photo-1605979399824-5d2d0d6de5c8?w=400&h=400&fit=crop',
    quantity: 1,
  },
  {
    id: '10',
    name: 'ガブリアス',
    category: 'ポケモン',
    rarity: 'SR',
    imageUrl: 'https://images.unsplash.com/photo-1610208135641-c1e8b5e7e8b7?w=400&h=400&fit=crop',
    quantity: 2,
  },
  {
    id: '11',
    name: 'レックウザ',
    category: 'ポケモン',
    rarity: 'UR',
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop',
    quantity: 1,
  },
  {
    id: '12',
    name: 'グラードン',
    category: 'ポケモン',
    rarity: 'UR',
    imageUrl: 'https://images.unsplash.com/photo-1587559070757-f72a388eebe5?w=400&h=400&fit=crop',
    quantity: 1,
  },
];

function CardGridItem({ card, isFavorite, onFavoriteToggle }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* カード画像 */}
      <div className="absolute inset-0">
        <img
          src={card.imageUrl}
          alt={card.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 数量バッジ（右上） */}
      <div className="absolute top-2 right-2 z-10">
        <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-sm">
          ×{card.quantity}
        </Badge>
      </div>

      {/* お気に入りボタン */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-12 right-2 z-10 h-8 w-8 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle(card.id);
        }}
      >
        <Heart
          className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
        />
      </Button>

      {/* ホバー時のオーバーレイ情報 */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0'
        } flex flex-col justify-end p-3`}
      >
        <div className="space-y-2">
          <h3 className="font-semibold text-white text-sm line-clamp-2">{card.name}</h3>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs bg-white/90 text-black">
              {card.category}
            </Badge>
            <Badge variant="outline" className="text-xs bg-white/90 text-black border-white/50">
              {card.rarity}
            </Badge>
          </div>
        </div>
      </div>

      {/* モバイル用: 常に表示される下部情報バー */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="font-semibold text-white text-xs truncate">{card.name}</p>
      </div>
    </div>
  );
}

export default function GridDemoStandalonePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const filteredCards = mockCards.filter((card) => {
    const matchesSearch = !searchQuery || card.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || card.category === selectedCategory;
    const matchesRarity = selectedRarity === 'all' || card.rarity === selectedRarity;
    return matchesSearch && matchesCategory && matchesRarity;
  });

  const handleFavoriteToggle = (cardId: string) => {
    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Instagramライク グリッドUI デモ</h1>
        <Badge variant="outline">スタンドアロン版</Badge>
      </div>

      {/* 検索バー */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="カード名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* フィルター */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          variant={selectedRarity === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRarity('all')}
        >
          すべて
        </Button>
        <Button
          variant={selectedRarity === 'UR' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRarity('UR')}
        >
          UR
        </Button>
        <Button
          variant={selectedRarity === 'SSR' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRarity('SSR')}
        >
          SSR
        </Button>
        <Button
          variant={selectedRarity === 'SR' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRarity('SR')}
        >
          SR
        </Button>
        <Button
          variant={selectedRarity === 'R' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRarity('R')}
        >
          R
        </Button>
      </div>

      {/* 結果カウント */}
      <div className="mb-4 text-sm text-muted-foreground">
        {filteredCards.length}件表示 / {mockCards.length}件中
      </div>

      {/* グリッド */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {filteredCards.map((card) => (
          <CardGridItem
            key={card.id}
            card={card}
            isFavorite={favoriteIds.has(card.id)}
            onFavoriteToggle={handleFavoriteToggle}
          />
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">該当するカードがありません</p>
        </div>
      )}
    </div>
  );
}
