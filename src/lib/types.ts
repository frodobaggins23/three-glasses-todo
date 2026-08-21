import type { ScopeKey } from './scopes'

export interface Task {
  id: number
  scope: ScopeKey
  title: string
  notes: string
  /** ISO local datetime string (<input type="datetime-local"> value), '' if unset. */
  remind: string
  /** createdAt, used for recency sort. */
  t: number
}

export interface Draft {
  scope: ScopeKey
  title: string
  /** Set when this Add flow was reached via "Spill a marble" on a project bucket. */
  projectId: number | null
  /** How much of the bucket to drain on Add, 0..project.remaining, step 5. Meaningless when projectId is null. */
  drainPct: number
}

export type FxKind = 'pop' | 'sink' | 'new'

export type AppError = { type: 'glassFull'; scope: ScopeKey; cap: number } | { type: 'titleRequired' }

export type SortMode = 'recent' | 'size'
export type SortDir = 'asc' | 'desc'

/** A long-term project bucket. Marbles spilled from it keep no back-reference — this is purely a progress visualization. */
export interface Project {
  id: number
  name: string
  /** oklch hue in degrees, unique among current projects when possible (see pickHue). */
  hue: number
  /** 0-100 integer percent left in the bucket. */
  remaining: number
}

/** Inline bucket editor — ephemeral, not persisted. */
export type EditState = { id: number; name: string; remaining: number } | null

/** Bucket mid fold-out animation — ephemeral, not persisted. */
export type RemovingState = number | null

/** Bucket-tip animation over a glass, cleared 820ms after a spill. */
export type PourState = { scope: ScopeKey; hue: number } | null

/** Pending "undo the spill" toast, cleared 5000ms after a spill. */
export type UndoState = { taskId: number; projectId: number; pct: number; scope: ScopeKey } | null
