import { afterEach, describe, expect, it, vi } from 'vitest'
import { createId } from './id'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createId', () => {
  it('prefixes with "id" by default', () => {
    expect(createId()).toMatch(/^id_/)
  })

  it('uses the supplied prefix', () => {
    expect(createId('app')).toMatch(/^app_/)
    expect(createId('evt')).toMatch(/^evt_/)
  })

  it('builds on crypto.randomUUID when the environment offers it', () => {
    const randomUUID = vi.fn(() => '11111111-2222-3333-4444-555555555555')
    vi.stubGlobal('crypto', { randomUUID })

    expect(createId('app')).toBe('app_11111111-2222-3333-4444-555555555555')
    expect(randomUUID).toHaveBeenCalledTimes(1)
  })

  it('degrades to a counter when randomUUID is missing', () => {
    vi.stubGlobal('crypto', {})

    // A non-secure context still has to produce usable, distinct ids.
    const first = createId('app')
    const second = createId('app')

    expect(first).toMatch(/^app_[0-9a-z]+_[0-9a-z]+$/)
    expect(second).not.toBe(first)
  })

  it('degrades when crypto is absent entirely', () => {
    vi.stubGlobal('crypto', undefined)

    expect(createId()).toMatch(/^id_/)
  })

  it('does not repeat ids across a burst of calls', () => {
    const ids = Array.from({ length: 200 }, () => createId('evt'))

    expect(new Set(ids).size).toBe(ids.length)
  })
})
