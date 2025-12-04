import { describe, it, expect } from 'vitest'
import {
  canTransition,
  validateTransition,
  isFinalStatus,
  canParticipate,
} from '../state-machine'
import type { Trade, TradeStatus } from '../types'
import { TradeTransitionError } from '../types'

// テスト用のトレードデータを生成するヘルパー
function createTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: 'trade-1',
    roomSlug: 'abc123',
    initiatorUserId: 'user-initiator',
    responderUserId: 'user-responder',
    status: 'draft',
    proposedExpiredAt: null,
    agreedExpiredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('canTransition', () => {
  describe('draft 状態からの遷移', () => {
    it('proposed への遷移は可能', () => {
      expect(canTransition('draft', 'proposed')).toBe(true)
    })

    it('canceled への遷移は可能', () => {
      expect(canTransition('draft', 'canceled')).toBe(true)
    })

    it('agreed への遷移は不可', () => {
      expect(canTransition('draft', 'agreed')).toBe(false)
    })

    it('completed への遷移は不可', () => {
      expect(canTransition('draft', 'completed')).toBe(false)
    })
  })

  describe('proposed 状態からの遷移', () => {
    it('agreed への遷移は可能', () => {
      expect(canTransition('proposed', 'agreed')).toBe(true)
    })

    it('canceled への遷移は可能', () => {
      expect(canTransition('proposed', 'canceled')).toBe(true)
    })

    it('expired への遷移は可能', () => {
      expect(canTransition('proposed', 'expired')).toBe(true)
    })

    it('draft への遷移は不可', () => {
      expect(canTransition('proposed', 'draft')).toBe(false)
    })

    it('completed への遷移は不可', () => {
      expect(canTransition('proposed', 'completed')).toBe(false)
    })
  })

  describe('agreed 状態からの遷移', () => {
    it('completed への遷移は可能', () => {
      expect(canTransition('agreed', 'completed')).toBe(true)
    })

    it('disputed への遷移は可能', () => {
      expect(canTransition('agreed', 'disputed')).toBe(true)
    })

    it('canceled への遷移は可能', () => {
      expect(canTransition('agreed', 'canceled')).toBe(true)
    })

    it('draft への遷移は不可', () => {
      expect(canTransition('agreed', 'draft')).toBe(false)
    })

    it('proposed への遷移は不可', () => {
      expect(canTransition('agreed', 'proposed')).toBe(false)
    })
  })

  describe('終了状態からの遷移', () => {
    const finalStatuses: TradeStatus[] = [
      'completed',
      'disputed',
      'canceled',
      'expired',
    ]
    const allStatuses: TradeStatus[] = [
      'draft',
      'proposed',
      'agreed',
      'completed',
      'disputed',
      'canceled',
      'expired',
    ]

    finalStatuses.forEach((fromStatus) => {
      allStatuses.forEach((toStatus) => {
        it(`${fromStatus} から ${toStatus} への遷移は不可`, () => {
          expect(canTransition(fromStatus, toStatus)).toBe(false)
        })
      })
    })
  })
})

describe('validateTransition', () => {
  describe('権限チェック', () => {
    it('開始者が draft → proposed を実行できる', () => {
      const trade = createTrade({ status: 'draft' })
      expect(() =>
        validateTransition(trade, 'proposed', 'user-initiator')
      ).not.toThrow()
    })

    it('応答者は draft → proposed を実行できない', () => {
      const trade = createTrade({ status: 'draft' })
      expect(() =>
        validateTransition(trade, 'proposed', 'user-responder')
      ).toThrow(TradeTransitionError)
    })

    it('応答者が proposed → agreed を実行できる', () => {
      const trade = createTrade({ status: 'proposed' })
      expect(() =>
        validateTransition(trade, 'agreed', 'user-responder')
      ).not.toThrow()
    })

    it('開始者は proposed → agreed を実行できない', () => {
      const trade = createTrade({ status: 'proposed' })
      expect(() =>
        validateTransition(trade, 'agreed', 'user-initiator')
      ).toThrow(TradeTransitionError)
    })

    it('両者とも proposed → canceled を実行できる', () => {
      const trade = createTrade({ status: 'proposed' })
      expect(() =>
        validateTransition(trade, 'canceled', 'user-initiator')
      ).not.toThrow()
      expect(() =>
        validateTransition(trade, 'canceled', 'user-responder')
      ).not.toThrow()
    })

    it('両者とも agreed → completed を実行できる', () => {
      const trade = createTrade({ status: 'agreed' })
      expect(() =>
        validateTransition(trade, 'completed', 'user-initiator')
      ).not.toThrow()
      expect(() =>
        validateTransition(trade, 'completed', 'user-responder')
      ).not.toThrow()
    })

    it('両者とも agreed → disputed を実行できる', () => {
      const trade = createTrade({ status: 'agreed' })
      expect(() =>
        validateTransition(trade, 'disputed', 'user-initiator')
      ).not.toThrow()
      expect(() =>
        validateTransition(trade, 'disputed', 'user-responder')
      ).not.toThrow()
    })

    it('参加者以外は遷移を実行できない', () => {
      const trade = createTrade({ status: 'proposed' })
      expect(() =>
        validateTransition(trade, 'canceled', 'user-other')
      ).toThrow(TradeTransitionError)
    })
  })

  describe('無効な遷移', () => {
    it('draft から agreed への遷移はエラー', () => {
      const trade = createTrade({ status: 'draft' })
      expect(() =>
        validateTransition(trade, 'agreed', 'user-initiator')
      ).toThrow(TradeTransitionError)
    })

    it('completed からの遷移はエラー', () => {
      const trade = createTrade({ status: 'completed' })
      expect(() =>
        validateTransition(trade, 'draft', 'user-initiator')
      ).toThrow(TradeTransitionError)
    })
  })

  describe('期限チェック', () => {
    it('proposed 状態で期限切れの場合はエラー', () => {
      const trade = createTrade({
        status: 'proposed',
        proposedExpiredAt: new Date('2020-01-01'),
      })
      expect(() =>
        validateTransition(trade, 'agreed', 'user-responder')
      ).toThrow(TradeTransitionError)
    })

    it('proposed 状態で期限内の場合は成功', () => {
      const trade = createTrade({
        status: 'proposed',
        proposedExpiredAt: new Date('2099-01-01'),
      })
      expect(() =>
        validateTransition(trade, 'agreed', 'user-responder')
      ).not.toThrow()
    })

    it('agreed 状態で期限切れの場合はエラー', () => {
      const trade = createTrade({
        status: 'agreed',
        agreedExpiredAt: new Date('2020-01-01'),
      })
      expect(() =>
        validateTransition(trade, 'completed', 'user-initiator')
      ).toThrow(TradeTransitionError)
    })

    it('agreed 状態で期限内の場合は成功', () => {
      const trade = createTrade({
        status: 'agreed',
        agreedExpiredAt: new Date('2099-01-01'),
      })
      expect(() =>
        validateTransition(trade, 'completed', 'user-initiator')
      ).not.toThrow()
    })

    it('期限が設定されていない場合は期限チェックをスキップ', () => {
      const trade = createTrade({
        status: 'proposed',
        proposedExpiredAt: null,
      })
      expect(() =>
        validateTransition(trade, 'agreed', 'user-responder')
      ).not.toThrow()
    })
  })

  describe('エラーコード', () => {
    it('無効な遷移は INVALID_TRANSITION', () => {
      const trade = createTrade({ status: 'draft' })
      try {
        validateTransition(trade, 'agreed', 'user-initiator')
      } catch (error) {
        expect(error).toBeInstanceOf(TradeTransitionError)
        expect((error as TradeTransitionError).code).toBe('INVALID_TRANSITION')
      }
    })

    it('権限エラーは UNAUTHORIZED', () => {
      const trade = createTrade({ status: 'proposed' })
      try {
        validateTransition(trade, 'agreed', 'user-initiator')
      } catch (error) {
        expect(error).toBeInstanceOf(TradeTransitionError)
        expect((error as TradeTransitionError).code).toBe('UNAUTHORIZED')
      }
    })

    it('期限切れは EXPIRED', () => {
      const trade = createTrade({
        status: 'proposed',
        proposedExpiredAt: new Date('2020-01-01'),
      })
      try {
        validateTransition(trade, 'agreed', 'user-responder')
      } catch (error) {
        expect(error).toBeInstanceOf(TradeTransitionError)
        expect((error as TradeTransitionError).code).toBe('EXPIRED')
      }
    })
  })
})

describe('isFinalStatus', () => {
  it('completed は終了状態', () => {
    expect(isFinalStatus('completed')).toBe(true)
  })

  it('disputed は終了状態', () => {
    expect(isFinalStatus('disputed')).toBe(true)
  })

  it('canceled は終了状態', () => {
    expect(isFinalStatus('canceled')).toBe(true)
  })

  it('expired は終了状態', () => {
    expect(isFinalStatus('expired')).toBe(true)
  })

  it('draft は終了状態ではない', () => {
    expect(isFinalStatus('draft')).toBe(false)
  })

  it('proposed は終了状態ではない', () => {
    expect(isFinalStatus('proposed')).toBe(false)
  })

  it('agreed は終了状態ではない', () => {
    expect(isFinalStatus('agreed')).toBe(false)
  })
})

describe('canParticipate', () => {
  it('開始者は参加可能', () => {
    const trade = createTrade()
    expect(canParticipate(trade, 'user-initiator')).toBe(true)
  })

  it('応答者は参加可能', () => {
    const trade = createTrade()
    expect(canParticipate(trade, 'user-responder')).toBe(true)
  })

  it('第三者は参加不可', () => {
    const trade = createTrade()
    expect(canParticipate(trade, 'user-other')).toBe(false)
  })

  it('応答者が未設定の場合、応答者IDでは参加不可', () => {
    const trade = createTrade({ responderUserId: null })
    expect(canParticipate(trade, 'user-responder')).toBe(false)
  })
})
