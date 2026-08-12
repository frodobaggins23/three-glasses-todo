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
}

export type FxKind = 'pop' | 'sink' | 'new'

export type AppError = { type: 'glassFull'; scope: ScopeKey; cap: number } | { type: 'titleRequired' }

export type SortMode = 'recent' | 'size'
