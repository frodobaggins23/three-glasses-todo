import { describe, expect, it } from 'vitest'
import { backupFilename, buildBackup, InvalidBackupError, parseBackup } from './backup'
import type { Task } from './types'

const tasks: Task[] = [{ id: 1, scope: 'm', title: 'Water the fig', notes: '', remind: '', t: 1000 }]
const caps = { s: 12, m: 6, l: 3 }

describe('buildBackup / parseBackup round trip', () => {
  it('parses exactly what was built', () => {
    const built = buildBackup(tasks, caps)
    const parsed = parseBackup(JSON.stringify(built))
    expect(parsed).toEqual(built)
  })
})

describe('backupFilename', () => {
  it('embeds the date as YYYY-MM-DD', () => {
    expect(backupFilename(new Date('2026-08-17T12:00:00Z'))).toBe('three-glasses-export-2026-08-17.json')
  })
})

describe('parseBackup validation', () => {
  it('rejects invalid JSON', () => {
    expect(() => parseBackup('not json')).toThrow(InvalidBackupError)
  })

  it('rejects a JSON value that is not an object', () => {
    expect(() => parseBackup('42')).toThrow(InvalidBackupError)
  })

  it('rejects a missing tasks array', () => {
    expect(() => parseBackup(JSON.stringify({ caps }))).toThrow(InvalidBackupError)
  })

  it('rejects a task with an unknown scope', () => {
    const bad = { tasks: [{ id: 1, scope: 'xl', title: 'x', notes: '', remind: '', t: 1 }], caps }
    expect(() => parseBackup(JSON.stringify(bad))).toThrow(InvalidBackupError)
  })

  it('rejects malformed caps', () => {
    expect(() => parseBackup(JSON.stringify({ tasks: [], caps: { s: 1 } }))).toThrow(InvalidBackupError)
  })

  it('defaults a missing exportedAt rather than rejecting', () => {
    const parsed = parseBackup(JSON.stringify({ tasks: [], caps }))
    expect(parsed.exportedAt).toBe('')
  })
})
