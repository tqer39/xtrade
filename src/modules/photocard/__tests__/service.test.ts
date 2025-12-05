import { beforeEach, describe, expect, it, vi } from 'vitest';

// DB モジュールをモック
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockSelectDistinctOrderBy = vi.fn();
const mockSelectDistinctFrom = vi.fn(() => ({
  orderBy: mockSelectDistinctOrderBy,
}));

vi.mock('@/db/drizzle', () => ({
  db: {
    select: () => ({
      from: mockFrom,
    }),
    selectDistinct: () => ({
      from: mockSelectDistinctFrom,
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  photocardMaster: {
    id: 'photocardMaster.id',
    name: 'photocardMaster.name',
    normalizedName: 'photocardMaster.normalizedName',
    groupName: 'photocardMaster.groupName',
    memberName: 'photocardMaster.memberName',
    memberNameReading: 'photocardMaster.memberNameReading',
    series: 'photocardMaster.series',
    releaseType: 'photocardMaster.releaseType',
    releaseDate: 'photocardMaster.releaseDate',
    rarity: 'photocardMaster.rarity',
    imageUrl: 'photocardMaster.imageUrl',
    source: 'photocardMaster.source',
    sourceUrl: 'photocardMaster.sourceUrl',
    verified: 'photocardMaster.verified',
    createdAt: 'photocardMaster.createdAt',
    updatedAt: 'photocardMaster.updatedAt',
  },
  memberMaster: {
    id: 'memberMaster.id',
    groupName: 'memberMaster.groupName',
    name: 'memberMaster.name',
    nameReading: 'memberMaster.nameReading',
    nameRomaji: 'memberMaster.nameRomaji',
    debutRank: 'memberMaster.debutRank',
    imageUrl: 'memberMaster.imageUrl',
    createdAt: 'memberMaster.createdAt',
    updatedAt: 'memberMaster.updatedAt',
  },
  seriesMaster: {
    id: 'seriesMaster.id',
    groupName: 'seriesMaster.groupName',
    name: 'seriesMaster.name',
    releaseType: 'seriesMaster.releaseType',
    releaseDate: 'seriesMaster.releaseDate',
    cardCount: 'seriesMaster.cardCount',
    sourceUrl: 'seriesMaster.sourceUrl',
    createdAt: 'seriesMaster.createdAt',
    updatedAt: 'seriesMaster.updatedAt',
  },
}));

// drizzle-orm のモック
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  and: vi.fn((...args) => ({ type: 'and', conditions: args })),
  or: vi.fn((...args) => ({ type: 'or', conditions: args })),
  like: vi.fn((a, b) => ({ type: 'like', a, b })),
  sql: vi.fn((strings, ...values) => ({ type: 'sql', strings, values })),
}));

// モック後にインポート
const {
  searchPhotocardMaster,
  getPhotocardMasterById,
  getMemberMasters,
  getSeriesMasters,
  getGroups,
} = await import('../service');

describe('photocard/service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのチェーンモック設定
    mockFrom.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
    });
    mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
      limit: mockLimit,
    });
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
    });
    mockLimit.mockResolvedValue([]);
    mockSelectDistinctOrderBy.mockResolvedValue([]);
  });

  describe('searchPhotocardMaster', () => {
    it('クエリなしで全件検索', async () => {
      const mockPhotocards = [
        { id: '1', name: 'Card A', groupName: 'INI' },
        { id: '2', name: 'Card B', groupName: 'INI' },
      ];
      mockLimit.mockResolvedValueOnce(mockPhotocards);

      const result = await searchPhotocardMaster();

      expect(result).toEqual(mockPhotocards);
      expect(mockFrom).toHaveBeenCalled();
    });

    it('クエリありで検索', async () => {
      const mockPhotocards = [{ id: '1', name: '木村柾哉 A', groupName: 'INI' }];
      mockLimit.mockResolvedValueOnce(mockPhotocards);

      const result = await searchPhotocardMaster('木村');

      expect(result).toEqual(mockPhotocards);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('グループ名でフィルタ', async () => {
      const mockPhotocards = [{ id: '1', name: 'Card', groupName: 'INI' }];
      mockLimit.mockResolvedValueOnce(mockPhotocards);

      const result = await searchPhotocardMaster(undefined, 'INI');

      expect(result).toEqual(mockPhotocards);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('メンバー名でフィルタ', async () => {
      const mockPhotocards = [{ id: '1', name: 'Card', memberName: '木村柾哉' }];
      mockLimit.mockResolvedValueOnce(mockPhotocards);

      const result = await searchPhotocardMaster(undefined, undefined, '木村柾哉');

      expect(result).toEqual(mockPhotocards);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('シリーズでフィルタ', async () => {
      const mockPhotocards = [{ id: '1', name: 'Card', series: 'A' }];
      mockLimit.mockResolvedValueOnce(mockPhotocards);

      const result = await searchPhotocardMaster(undefined, undefined, undefined, 'A');

      expect(result).toEqual(mockPhotocards);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('件数制限を適用', async () => {
      mockLimit.mockResolvedValueOnce([]);

      await searchPhotocardMaster(undefined, undefined, undefined, undefined, 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('デフォルト件数制限は50', async () => {
      mockLimit.mockResolvedValueOnce([]);

      await searchPhotocardMaster();

      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('複数条件で検索', async () => {
      const mockPhotocards = [{ id: '1', name: '木村柾哉 A', groupName: 'INI', series: 'A' }];
      mockLimit.mockResolvedValueOnce(mockPhotocards);

      const result = await searchPhotocardMaster('木村', 'INI', '木村柾哉', 'A');

      expect(result).toEqual(mockPhotocards);
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('getPhotocardMasterById', () => {
    it('存在するIDで取得', async () => {
      const mockPhotocard = { id: '1', name: 'Test Card' };
      mockLimit.mockResolvedValueOnce([mockPhotocard]);

      const result = await getPhotocardMasterById('1');

      expect(result).toEqual(mockPhotocard);
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('存在しないIDでnullを返す', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await getPhotocardMasterById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getMemberMasters', () => {
    it('全メンバーを取得', async () => {
      const mockMembers = [
        { id: '1', name: '木村柾哉', groupName: 'INI', debutRank: 1 },
        { id: '2', name: '髙塚大夢', groupName: 'INI', debutRank: 2 },
      ];
      mockOrderBy.mockResolvedValueOnce(mockMembers);

      const result = await getMemberMasters();

      expect(result).toEqual(mockMembers);
      expect(mockFrom).toHaveBeenCalled();
    });

    it('グループ名でフィルタ', async () => {
      const mockMembers = [{ id: '1', name: '木村柾哉', groupName: 'INI' }];
      mockWhere.mockReturnValueOnce({
        orderBy: vi.fn().mockResolvedValueOnce(mockMembers),
      });

      const result = await getMemberMasters('INI');

      expect(result).toEqual(mockMembers);
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('getSeriesMasters', () => {
    it('全シリーズを取得', async () => {
      const mockSeries = [
        { id: '1', name: 'A', groupName: 'INI' },
        { id: '2', name: 'I', groupName: 'INI' },
      ];
      mockOrderBy.mockResolvedValueOnce(mockSeries);

      const result = await getSeriesMasters();

      expect(result).toEqual(mockSeries);
      expect(mockFrom).toHaveBeenCalled();
    });

    it('グループ名でフィルタ', async () => {
      const mockSeries = [{ id: '1', name: 'A', groupName: 'INI' }];
      mockWhere.mockReturnValueOnce({
        orderBy: vi.fn().mockResolvedValueOnce(mockSeries),
      });

      const result = await getSeriesMasters('INI');

      expect(result).toEqual(mockSeries);
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('getGroups', () => {
    it('ユニークなグループ名一覧を取得', async () => {
      const mockGroups = [{ groupName: 'INI' }, { groupName: 'JO1' }];
      mockSelectDistinctOrderBy.mockResolvedValueOnce(mockGroups);

      const result = await getGroups();

      expect(result).toEqual(['INI', 'JO1']);
      expect(mockSelectDistinctFrom).toHaveBeenCalled();
    });

    it('グループがない場合は空配列を返す', async () => {
      mockSelectDistinctOrderBy.mockResolvedValueOnce([]);

      const result = await getGroups();

      expect(result).toEqual([]);
    });
  });
});
