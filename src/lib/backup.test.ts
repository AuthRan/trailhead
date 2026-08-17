import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BACKUP_VERSION,
  applicationsToBackup,
  backupFilename,
  downloadBackup,
  parseBackup,
} from './backup'
import { createSeedApplications } from './seed'

const NOW = new Date('2026-06-01T12:00:00.000Z')

describe('applicationsToBackup', () => {
  it('stamps the version and the export time', () => {
    const payload = JSON.parse(applicationsToBackup([], NOW))

    expect(payload.version).toBe(BACKUP_VERSION)
    expect(payload.exportedAt).toBe('2026-06-01T12:00:00.000Z')
  })

  it('carries every application', () => {
    const applications = createSeedApplications(NOW)
    const payload = JSON.parse(applicationsToBackup(applications, NOW))

    expect(payload.applications).toHaveLength(12)
  })

  it('writes indented JSON so the file stays readable', () => {
    expect(applicationsToBackup([], NOW)).toContain('\n  "version": 1')
  })
})

describe('parseBackup', () => {
  it('round-trips a workspace without losing anything', () => {
    const applications = createSeedApplications(NOW)

    const result = parseBackup(applicationsToBackup(applications, NOW))

    expect(result).toEqual({ ok: true, applications })
  })

  it('accepts an empty workspace', () => {
    const result = parseBackup(applicationsToBackup([], NOW))

    expect(result).toEqual({ ok: true, applications: [] })
  })

  it('reports invalid JSON rather than throwing', () => {
    expect(parseBackup('{ not json')).toEqual({
      ok: false,
      error: 'That file is not valid JSON.',
    })
  })

  it('rejects JSON that is not an object', () => {
    expect(parseBackup('[]')).toMatchObject({ ok: false })
    expect(parseBackup('null')).toEqual({
      ok: false,
      error: 'That file is not a Trailhead backup.',
    })
  })

  it('rejects a backup from another version', () => {
    const text = JSON.stringify({ version: 99, exportedAt: '', applications: [] })

    expect(parseBackup(text)).toEqual({
      ok: false,
      error: 'That backup was made by a different version of Trailhead.',
    })
  })

  it('rejects a payload with no applications array', () => {
    const text = JSON.stringify({ version: BACKUP_VERSION, exportedAt: '' })

    expect(parseBackup(text)).toEqual({
      ok: false,
      error: 'That file is not a Trailhead backup.',
    })
  })

  it('counts unreadable records rather than importing them', () => {
    const [valid] = createSeedApplications(NOW)
    const text = JSON.stringify({
      version: BACKUP_VERSION,
      exportedAt: NOW.toISOString(),
      applications: [valid, { id: 'broken' }, { nope: true }],
    })

    expect(parseBackup(text)).toEqual({
      ok: false,
      error: 'That backup contains 2 unreadable applications.',
    })
  })

  it('uses the singular when only one record is unreadable', () => {
    const text = JSON.stringify({
      version: BACKUP_VERSION,
      exportedAt: NOW.toISOString(),
      applications: [{ id: 'broken' }],
    })

    expect(parseBackup(text)).toMatchObject({
      error: 'That backup contains 1 unreadable application.',
    })
  })

  it('rejects a record whose stage is not a real stage', () => {
    const [valid] = createSeedApplications(NOW)
    const text = JSON.stringify({
      version: BACKUP_VERSION,
      exportedAt: NOW.toISOString(),
      applications: [{ ...valid, stage: 'ghosted' }],
    })

    expect(parseBackup(text)).toMatchObject({ ok: false })
  })
})

describe('backupFilename', () => {
  it('dates and pads the filename', () => {
    expect(backupFilename(new Date(2026, 0, 9))).toBe('trailhead-backup-2026-01-09.json')
  })
})

describe('downloadBackup', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function stubDownload() {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:trailhead')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const link = document.createElement('a')
    vi.spyOn(link, 'click').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockReturnValue(link)

    return { createObjectURL, revokeObjectURL, link }
  }

  it('serialises as JSON and names the file by date', () => {
    const { createObjectURL, link } = stubDownload()

    downloadBackup(createSeedApplications(NOW), new Date(2026, 5, 1))

    expect(createObjectURL.mock.calls[0]?.[0].type).toBe('application/json')
    expect(link.download).toBe('trailhead-backup-2026-06-01.json')
  })

  it('releases the object URL', () => {
    const { revokeObjectURL } = stubDownload()

    downloadBackup([], NOW)

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:trailhead')
  })
})
