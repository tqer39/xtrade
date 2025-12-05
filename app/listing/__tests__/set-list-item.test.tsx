import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SetListItem } from '../_components/set-list-item'
import type { CardSetWithCount } from '@/modules/cards/types'

describe('SetListItem', () => {
  const mockSet: CardSetWithCount = {
    id: 'set-1',
    userId: 'user-1',
    name: 'Test Set',
    description: 'Test Description',
    isPublic: true,
    itemCount: 3,
    thumbnails: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockOnSelect = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnDelete.mockResolvedValue(undefined)
  })

  it('セット名を表示', () => {
    render(<SetListItem set={mockSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />)

    expect(screen.getByText('Test Set')).toBeInTheDocument()
  })

  it('説明を表示', () => {
    render(<SetListItem set={mockSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />)

    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('説明がない場合は表示しない', () => {
    const setWithoutDescription = { ...mockSet, description: null }
    render(
      <SetListItem set={setWithoutDescription} onSelect={mockOnSelect} onDelete={mockOnDelete} />
    )

    expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
  })

  it('カード数を表示', () => {
    render(<SetListItem set={mockSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />)

    expect(screen.getByText('3 枚')).toBeInTheDocument()
  })

  it('公開セットのバッジを表示', () => {
    render(<SetListItem set={mockSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />)

    expect(screen.getByText('公開')).toBeInTheDocument()
  })

  it('非公開セットのバッジを表示', () => {
    const privateSet = { ...mockSet, isPublic: false }
    render(<SetListItem set={privateSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />)

    expect(screen.getByText('非公開')).toBeInTheDocument()
  })

  it('サムネイルを表示', () => {
    const { container } = render(
      <SetListItem set={mockSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />
    )

    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(2)
  })

  it('サムネイルがない場合はアイコンを表示', () => {
    const setWithoutThumbnails = { ...mockSet, thumbnails: [] }
    const { container } = render(
      <SetListItem set={setWithoutThumbnails} onSelect={mockOnSelect} onDelete={mockOnDelete} />
    )

    // サムネイル画像がないことを確認
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })

  it('クリックで onSelect が呼ばれる', () => {
    render(<SetListItem set={mockSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />)

    fireEvent.click(screen.getByText('Test Set'))

    expect(mockOnSelect).toHaveBeenCalledWith('set-1')
  })

  it('詳細ボタンクリックで onSelect が呼ばれる', () => {
    render(<SetListItem set={mockSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />)

    const detailButton = screen.getByRole('button', { name: '詳細を見る' })
    fireEvent.click(detailButton)

    expect(mockOnSelect).toHaveBeenCalledWith('set-1')
  })

  it('削除ボタンクリックで確認ダイアログを表示', () => {
    render(<SetListItem set={mockSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />)

    const deleteButton = screen.getByRole('button', { name: '削除' })
    fireEvent.click(deleteButton)

    expect(screen.getByText('セットを削除しますか？')).toBeInTheDocument()
    expect(screen.getByText('「Test Set」を削除します。この操作は取り消せません。')).toBeInTheDocument()
  })

  it('削除確認で onDelete が呼ばれる', async () => {
    render(<SetListItem set={mockSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />)

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: '削除' })
    fireEvent.click(deleteButton)

    // 確認ダイアログの削除ボタンをクリック
    const confirmButton = screen.getByRole('button', { name: '削除' })
    // AlertDialogAction は2つの削除ボタンがあるので、ダイアログ内のものを選択
    const dialogButtons = screen.getAllByRole('button', { name: '削除' })
    fireEvent.click(dialogButtons[dialogButtons.length - 1])

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('set-1')
    })
  })

  it('削除キャンセルで onDelete が呼ばれない', () => {
    render(<SetListItem set={mockSet} onSelect={mockOnSelect} onDelete={mockOnDelete} />)

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: '削除' })
    fireEvent.click(deleteButton)

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    fireEvent.click(cancelButton)

    expect(mockOnDelete).not.toHaveBeenCalled()
  })
})
