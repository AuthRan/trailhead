import { describe, expect, it } from 'vitest'
import {
  clearApplications,
  loadApplications,
  saveApplications,
  STORAGE_KEY,
} from './storage'
import { createSeedApplications } from './seed'

describe('storage', () => {
  it('round-trips applications', () => {
    const seeded = createSeedApplications(new Date('2026-06-15T12:00:00.000Z'))
    saveApplications(seeded)

    expect(loadApplications()).toEqual(seeded)
  })

  it('returns null when nothing is stored', () => {
    expect(loadApplications()).toBeNull()
  })

  it('returns null for unparseable payloads', () => {
    window.localStorage.setItem(STORAGE_KEY, '{ not json')
    expect(loadApplications()).toBeNull()
  })

  it('returns null when the stored version does not match', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 99, applications: [] }),
    )
    expect(loadApplications()).toBeNull()
  })

  it('rejects payloads containing a malformed application', () => {
    const [first] = createSeedApplications()
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, applications: [first, { id: 'broken' }] }),
    )

    expect(loadApplications()).toBeNull()
  })

  it('clears the stored payload', () => {
    saveApplications(createSeedApplications())
    clearApplications()

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
