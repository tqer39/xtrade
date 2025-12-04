'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UserHaveCard, UserWantCard } from '@/modules/cards/types'

interface UseMyCardsReturn {
  haveCards: UserHaveCard[]
  wantCards: UserWantCard[]
  isLoading: boolean
  error: Error | null
  addHaveCard: (cardId: string, quantity?: number) => Promise<void>
  addWantCard: (cardId: string, priority?: number) => Promise<void>
  refetch: () => Promise<void>
}

export function useMyCards(): UseMyCardsReturn {
  const [haveCards, setHaveCards] = useState<UserHaveCard[]>([])
  const [wantCards, setWantCards] = useState<UserWantCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCards = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/me/cards')
      if (!res.ok) {
        throw new Error('Failed to fetch cards')
      }
      const data = await res.json()
      setHaveCards(data.haveCards || [])
      setWantCards(data.wantCards || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const addHaveCard = useCallback(
    async (cardId: string, quantity: number = 1) => {
      const res = await fetch('/api/me/cards/have', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, quantity }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add card')
      }
      await fetchCards()
    },
    [fetchCards]
  )

  const addWantCard = useCallback(
    async (cardId: string, priority?: number) => {
      const res = await fetch('/api/me/cards/want', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, priority }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add card')
      }
      await fetchCards()
    },
    [fetchCards]
  )

  return {
    haveCards,
    wantCards,
    isLoading,
    error,
    addHaveCard,
    addWantCard,
    refetch: fetchCards,
  }
}
