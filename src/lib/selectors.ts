import { SCOPES, SIZE_SORT_ORDER, type ScopeKey } from './scopes'
import type { FxKind, SortMode, Task } from './types'

interface CountableState {
  tasks: Task[]
  fx: Record<number, FxKind>
}

/** Ported from Component.countOf() — excludes tasks mid pop/sink animation, so a glass frees up the moment the animation starts. */
export function countOf(state: CountableState, scope: ScopeKey): number {
  return state.tasks.filter((t) => t.scope === scope && state.fx[t.id] !== 'pop' && state.fx[t.id] !== 'sink').length
}

/** Ported from renderVals()'s `total` — excludes pop/sink, includes 'new'. */
export function totalMarbles(state: CountableState): number {
  return state.tasks.filter((t) => !state.fx[t.id] || state.fx[t.id] === 'new').length
}

export function anyGlassFull(state: CountableState & { caps: Record<ScopeKey, number> }): boolean {
  return SCOPES.some((s) => countOf(state, s.key) >= state.caps[s.key])
}

export function sortedTasks(state: { tasks: Task[]; sort: SortMode }): Task[] {
  return [...state.tasks].sort((a, b) =>
    state.sort === 'size' ? SIZE_SORT_ORDER[a.scope] - SIZE_SORT_ORDER[b.scope] || b.t - a.t : b.t - a.t,
  )
}

export type CountLevel = 'normal' | 'warning' | 'full'

/** Ported from the glasses[].countColor ternary. */
export function countLevel(n: number, cap: number): CountLevel {
  if (n >= cap) return 'full'
  if (n / cap > 0.75) return 'warning'
  return 'normal'
}

export type CapHint = { kind: 'spare'; spare: number } | { kind: 'overLimit' }

/** Ported from the glasses[].capHint ternary. */
export function capHint(n: number, cap: number): CapHint {
  return n > cap ? { kind: 'overLimit' } : { kind: 'spare', spare: cap - n }
}
