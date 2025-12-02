import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../page'

// モック設定
vi.mock('@/components/auth', () => ({
  UserMenu: () => <div data-testid="user-menu">UserMenu Component</div>,
}))

describe('Home Page', () => {
  it('タイトル「xtrade」を表示する', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { name: 'xtrade' })).toBeInTheDocument()
  })

  it('サブタイトルを表示する', () => {
    render(<Home />)

    expect(screen.getByText('X (Twitter) トレードアプリ')).toBeInTheDocument()
  })

  it('UserMenu コンポーネントをレンダリングする', () => {
    render(<Home />)

    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
  })

  it('main 要素が中央揃えスタイルを持つ', () => {
    render(<Home />)

    const main = screen.getByRole('main')
    expect(main).toHaveStyle({
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    })
  })
})
