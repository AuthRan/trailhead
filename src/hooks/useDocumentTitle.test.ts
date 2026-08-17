import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_TITLE, useDocumentTitle } from './useDocumentTitle'

afterEach(() => {
  document.title = ''
})

describe('useDocumentTitle', () => {
  it('names the view alongside the app', () => {
    renderHook(() => useDocumentTitle('Board'))

    expect(document.title).toBe(`Board · ${BASE_TITLE}`)
  })

  it('falls back to the app name when no view is given', () => {
    renderHook(() => useDocumentTitle())

    expect(document.title).toBe(BASE_TITLE)
  })

  it('follows the title as it changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'Board' },
    })

    rerender({ title: 'Stats' })

    expect(document.title).toBe(`Stats · ${BASE_TITLE}`)
  })

  it('restores the previous title on unmount', () => {
    document.title = 'Something else'

    const { unmount } = renderHook(() => useDocumentTitle('Board'))
    expect(document.title).toBe(`Board · ${BASE_TITLE}`)

    unmount()

    expect(document.title).toBe('Something else')
  })
})
