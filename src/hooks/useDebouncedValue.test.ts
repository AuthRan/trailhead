import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebouncedValue', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('react', 200))
    expect(result.current).toBe('react')
  })

  it('waits for the delay before publishing a new value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 200),
      { initialProps: { value: 'r' } },
    )

    rerender({ value: 'rea' })
    expect(result.current).toBe('r')

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('rea')
  })

  it('only publishes the final value in a burst of changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 200),
      { initialProps: { value: 'r' } },
    )

    for (const value of ['re', 'rea', 'reac', 'react']) {
      rerender({ value })
      act(() => {
        vi.advanceTimersByTime(50)
      })
    }

    expect(result.current).toBe('r')

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('react')
  })

  it('publishes synchronously when the delay is zero', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 0),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    expect(result.current).toBe('b')
  })
})
