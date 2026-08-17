import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildBackup, type BackupData } from '../lib/backup'
import { SCOPES, type ScopeKey } from '../lib/scopes'
import { countOf } from '../lib/selectors'
import type { AppError, Draft, FxKind, SortMode, Task } from '../lib/types'

const DEFAULT_CAPS = Object.fromEntries(SCOPES.map((s) => [s.key, s.defCap])) as Record<ScopeKey, number>

const SHAKE_MS = 600
const CAP_NOTE_MS = 2600
const POP_REMOVE_MS = 330
const SINK_REMOVE_MS = 430
const NEW_FX_CLEAR_MS = 560

interface AppState {
  // Persisted
  tasks: Task[]
  caps: Record<ScopeKey, number>

  // Transient UI state — deliberately not persisted (see partialize below)
  draft: Draft
  shake: ScopeKey | null
  homeError: AppError | null
  addError: AppError | null
  sort: SortMode
  shown: number
  fx: Record<number, FxKind>
  capNote: ScopeKey | null

  // Actions
  updateDraftTitle: (title: string) => void
  resetDraftForNewAdd: () => void
  /** Add-screen scope card tap. */
  selectDraftScope: (scope: ScopeKey) => void
  /** Home-screen glass tap. Returns 'ok' if the caller should navigate to Add, 'full' if blocked. */
  tapGlass: (scope: ScopeKey) => 'ok' | 'full'
  /** Returns true if the task was added; false if blocked by capacity or a missing title. */
  tryAddTask: () => boolean
  dismissHomeError: () => void
  incCap: (scope: ScopeKey) => void
  decCap: (scope: ScopeKey) => void
  setSort: (sort: SortMode) => void
  showMore: () => void
  updateNotes: (id: number, notes: string) => void
  updateRemind: (id: number, remind: string) => void
  completeTask: (id: number) => void
  dropTask: (id: number) => void
  exportBackup: () => BackupData
  restoreBackup: (data: BackupData) => void
}

function nextTaskId(tasks: Task[]): number {
  return tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1
}

function clearShakeAfter(scope: ScopeKey, set: (fn: (s: AppState) => Partial<AppState>) => void) {
  setTimeout(() => set((s) => (s.shake === scope ? { shake: null } : {})), SHAKE_MS)
}

function removeTaskAfter(id: number, delayMs: number, set: (fn: (s: AppState) => Partial<AppState>) => void) {
  setTimeout(() => {
    set((s) => {
      const fx = { ...s.fx }
      delete fx[id]
      return { tasks: s.tasks.filter((t) => t.id !== id), fx }
    })
  }, delayMs)
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      caps: DEFAULT_CAPS,

      draft: { scope: 'm', title: '' },
      shake: null,
      homeError: null,
      addError: null,
      sort: 'recent',
      shown: 5,
      fx: {},
      capNote: null,

      updateDraftTitle: (title) =>
        set((s) => ({ draft: { ...s.draft, title }, addError: null })),

      resetDraftForNewAdd: () => set({ draft: { scope: 'm', title: '' } }),

      selectDraftScope: (scope) => {
        const state = get()
        const n = countOf(state, scope)
        const cap = state.caps[scope]
        if (n >= cap) {
          set({ shake: scope, addError: { type: 'glassFull', scope, cap } })
          clearShakeAfter(scope, set)
          return
        }
        set((s) => ({ draft: { scope, title: s.draft.title }, addError: null }))
      },

      tapGlass: (scope) => {
        const state = get()
        const n = countOf(state, scope)
        const cap = state.caps[scope]
        if (n >= cap) {
          set({ shake: scope, homeError: { type: 'glassFull', scope, cap } })
          clearShakeAfter(scope, set)
          return 'full'
        }
        set({ draft: { scope, title: '' } })
        return 'ok'
      },

      tryAddTask: () => {
        const state = get()
        const { draft, caps } = state
        const n = countOf(state, draft.scope)
        if (n >= caps[draft.scope]) {
          set({ addError: { type: 'glassFull', scope: draft.scope, cap: caps[draft.scope] }, shake: draft.scope })
          clearShakeAfter(draft.scope, set)
          return false
        }
        const title = draft.title.trim()
        if (!title) {
          set({ addError: { type: 'titleRequired' } })
          return false
        }
        const id = nextTaskId(state.tasks)
        const newTask: Task = { id, scope: draft.scope, title, notes: '', remind: '', t: Date.now() }
        set((s) => ({
          tasks: [...s.tasks, newTask],
          draft: { scope: draft.scope, title: '' },
          addError: null,
          homeError: null,
          fx: { ...s.fx, [id]: 'new' },
        }))
        setTimeout(() => {
          set((s) => {
            const fx = { ...s.fx }
            delete fx[id]
            return { fx }
          })
        }, NEW_FX_CLEAR_MS)
        return true
      },

      dismissHomeError: () => set({ homeError: null }),

      incCap: (scope) =>
        set((s) => ({ caps: { ...s.caps, [scope]: Math.min(24, s.caps[scope] + 1) } })),

      decCap: (scope) => {
        const state = get()
        const n = countOf(state, scope)
        const floor = Math.max(1, n)
        if (state.caps[scope] <= floor) {
          set({ capNote: scope })
          setTimeout(() => set((s) => (s.capNote === scope ? { capNote: null } : {})), CAP_NOTE_MS)
          return
        }
        set((s) => ({ capNote: null, caps: { ...s.caps, [scope]: s.caps[scope] - 1 } }))
      },

      setSort: (sort) => set({ sort, shown: 5 }),
      showMore: () => set((s) => ({ shown: s.shown + 5 })),

      updateNotes: (id, notes) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, notes } : t)) })),
      updateRemind: (id, remind) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, remind } : t)) })),

      completeTask: (id) => {
        set((s) => ({ fx: { ...s.fx, [id]: 'pop' } }))
        removeTaskAfter(id, POP_REMOVE_MS, set)
      },
      dropTask: (id) => {
        set((s) => ({ fx: { ...s.fx, [id]: 'sink' } }))
        removeTaskAfter(id, SINK_REMOVE_MS, set)
      },

      exportBackup: () => {
        const state = get()
        return buildBackup(state.tasks, state.caps)
      },
      restoreBackup: (data) => set({ tasks: data.tasks, caps: data.caps, shown: 5, fx: {} }),
    }),
    {
      name: 'three-glasses-storage',
      partialize: (state) => ({ tasks: state.tasks, caps: state.caps }),
    },
  ),
)
