import type { Application } from './types'
import { isApplication } from './storage'

export const BACKUP_VERSION = 1

interface BackupShape {
  version: number
  exportedAt: string
  applications: Application[]
}

export type BackupResult =
  | { ok: true; applications: Application[] }
  | { ok: false; error: string }

/** Serialises the whole workspace, indented so the file stays readable if
 * someone opens it in an editor. */
export function applicationsToBackup(
  applications: Application[],
  now: Date = new Date(),
): string {
  const payload: BackupShape = {
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    applications,
  }

  return JSON.stringify(payload, null, 2)
}

/** Reads a backup file. Every failure is reported as a message a person can
 * act on rather than thrown, because the input is a file someone picked. */
export function parseBackup(text: string): BackupResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'That file is not a Trailhead backup.' }
  }

  const candidate = parsed as Partial<BackupShape>

  if (candidate.version !== BACKUP_VERSION) {
    return {
      ok: false,
      error: 'That backup was made by a different version of Trailhead.',
    }
  }

  if (!Array.isArray(candidate.applications)) {
    return { ok: false, error: 'That file is not a Trailhead backup.' }
  }

  const unreadable = candidate.applications.filter(
    (application) => !isApplication(application),
  ).length

  if (unreadable > 0) {
    return {
      ok: false,
      error:
        unreadable === 1
          ? 'That backup contains 1 unreadable application.'
          : `That backup contains ${unreadable} unreadable applications.`,
    }
  }

  return { ok: true, applications: candidate.applications }
}

export function backupFilename(now: Date = new Date()): string {
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `trailhead-backup-${now.getFullYear()}-${month}-${day}.json`
}

/** Hands the backup to the browser as a download, releasing the object URL
 * straight after the click. */
export function downloadBackup(
  applications: Application[],
  now: Date = new Date(),
): void {
  const blob = new Blob([applicationsToBackup(applications, now)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = backupFilename(now)
  link.click()

  URL.revokeObjectURL(url)
}
