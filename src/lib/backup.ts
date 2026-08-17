import { SCOPES, type ScopeKey } from './scopes'
import type { Task } from './types'

export const BACKUP_VERSION = 1

export interface BackupData {
  version: number
  exportedAt: string
  tasks: Task[]
  caps: Record<ScopeKey, number>
}

export function buildBackup(tasks: Task[], caps: Record<ScopeKey, number>): BackupData {
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tasks, caps }
}

export function backupFilename(date = new Date()): string {
  return `three-glasses-export-${date.toISOString().slice(0, 10)}.json`
}

export class InvalidBackupError extends Error {}

const SCOPE_KEYS = new Set<string>(SCOPES.map((s) => s.key))

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'number' &&
    typeof t.scope === 'string' &&
    SCOPE_KEYS.has(t.scope) &&
    typeof t.title === 'string' &&
    typeof t.notes === 'string' &&
    typeof t.remind === 'string' &&
    typeof t.t === 'number'
  )
}

function isCaps(value: unknown): value is Record<ScopeKey, number> {
  if (typeof value !== 'object' || value === null) return false
  const c = value as Record<string, unknown>
  return SCOPES.every((s) => typeof c[s.key] === 'number')
}

/** Parses and validates a previously exported backup file's contents. Throws InvalidBackupError if malformed. */
export function parseBackup(json: string): BackupData {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new InvalidBackupError('That file is not valid JSON.')
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new InvalidBackupError('That file is not a three-glasses backup.')
  }
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.tasks) || !r.tasks.every(isTask)) {
    throw new InvalidBackupError('That file is missing or has malformed tasks.')
  }
  if (!isCaps(r.caps)) {
    throw new InvalidBackupError('That file is missing or has malformed limits.')
  }
  return {
    version: typeof r.version === 'number' ? r.version : 1,
    exportedAt: typeof r.exportedAt === 'string' ? r.exportedAt : '',
    tasks: r.tasks,
    caps: r.caps,
  }
}
