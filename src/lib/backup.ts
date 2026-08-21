import { SCOPES, type ScopeKey } from './scopes'
import type { Project, Task } from './types'

export interface BackupData {
  exportedAt: string
  tasks: Task[]
  caps: Record<ScopeKey, number>
  projects: Project[]
}

export function buildBackup(tasks: Task[], caps: Record<ScopeKey, number>, projects: Project[]): BackupData {
  return { exportedAt: new Date().toISOString(), tasks, caps, projects }
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

function isProject(value: unknown): value is Project {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p.id === 'number' &&
    typeof p.name === 'string' &&
    typeof p.hue === 'number' &&
    typeof p.remaining === 'number'
  )
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
  // Backups exported before the Projects Pool existed have no `projects` key —
  // treat missing as an empty pool rather than rejecting older files.
  if (r.projects !== undefined && (!Array.isArray(r.projects) || !r.projects.every(isProject))) {
    throw new InvalidBackupError('That file has malformed projects.')
  }
  return {
    exportedAt: typeof r.exportedAt === 'string' ? r.exportedAt : '',
    tasks: r.tasks,
    caps: r.caps,
    projects: Array.isArray(r.projects) ? r.projects : [],
  }
}
