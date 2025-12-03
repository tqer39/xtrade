import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginButton } from '../login-button'

// モック設定
const mockSignIn = {
  social: vi.fn(),
}

vi.mock('@/lib/auth-client', () => ({
  signIn: {
    social: vi.fn(),
  },
}))

describe('LoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('「X でログイン」ボタンをレンダリングする', () => {
    render(<LoginButton />)

    const button = screen.getByRole('button', { name: /X でログイン/i })
    expect(button).toBeInTheDocument()
  })

  it('X ロゴ（SVG）を含む', () => {
    render(<LoginButton />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('ボタンのスタイルクラスが正しく適用されている', () => {
    render(<LoginButton />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('rounded-full')
    expect(button).toHaveClass('gap-2')
  })

  it('クリックで signIn.social が呼ばれる', async () => {
    const { signIn } = await import('@/lib/auth-client')

    render(<LoginButton />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(signIn.social).toHaveBeenCalledWith({
      provider: 'twitter',
      callbackURL: '/',
    })
  })
})
