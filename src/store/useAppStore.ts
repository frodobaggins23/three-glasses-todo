import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildBackup, type BackupData } from '../lib/backup'
import { pickHue } from '../lib/projectHue'
import { DRAIN_DEFAULT, SCOPES, type ScopeKey } from '../lib/scopes'
import { countOf } from '../lib/selectors'
import type {
  AppError,
  Draft,
  EditState,
  FxKind,
  Project,
  PourState,
  SortDir,
  SortMode,
  Task,
  UndoState,
} from '../lib/types'

const DEFAULT_CAPS = Object.fromEntries(SCOPES.map((s) => [s.key, s.defCap])) as Record<ScopeKey, number>

const SHAKE_MS = 600
const CAP_NOTE_MS = 2600
const POP_REMOVE_MS = 330
const SINK_REMOVE_MS = 430
const NEW_FX_CLEAR_MS = 560
const POUR_CLEAR_MS = 820
const UNDO_CLEAR_MS = 5000
const FOLD_REMOVE_MS = 380

interface AppState {
  // Persisted
  tasks: Task[]
  caps: Record<ScopeKey, number>
  projects: Project[]

  // Transient UI state — deliberately not persisted (see partialize below)
  draft: Draft
  shake: ScopeKey | null
  homeError: AppError | null
  addError: AppError | null
  sort: SortMode
  sortDir: SortDir
  shown: number
  fx: Record<number, FxKind>
  capNote: ScopeKey | null
  edit: EditState
  removing: number | null
  pour: PourState
  undo: UndoState

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
  /** Switches to `sort` if it isn't already active; if it's already active, toggles the sort direction instead. */
  setSort: (sort: SortMode) => void
  showMore: () => void
  updateNotes: (id: number, notes: string) => void
  updateRemind: (id: number, remind: string) => void
  completeTask: (id: number) => void
  dropTask: (id: number) => void
  exportBackup: () => BackupData
  restoreBackup: (data: BackupData) => void

  // Project pool actions
  addProject: () => void
  /** Prepares the Add-screen draft to spill from `projectId`; caller still navigates to Add. */
  startSpill: (projectId: number) => void
  setDrainPct: (pct: number) => void
  detachProject: () => void
  /** Undoes the most recent pending spill: refunds the drain and removes the created task. */
  undoSpill: () => void
  startEditProject: (id: number) => void
  updateEditName: (name: string) => void
  updateEditRemaining: (remaining: number) => void
  /** Commits the inline editor ("Done"): trims the name, applies the remaining %. */
  commitEditProject: () => void
  /** Removes a bucket ("Drop project" / "Clear it away"), after the fold-out animation. */
  removeProject: (id: number) => void
}

function nextId<T extends { id: number }>(items: T[]): number {
  return items.reduce((max, x) => Math.max(max, x.id), 0) + 1
}

function clampDrain(pct: number, max: number): number {
  return Math.max(0, Math.min(max, pct))
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
      projects: [],

      draft: { scope: 'm', title: '', projectId: null, drainPct: DRAIN_DEFAULT.m },
      shake: null,
      homeError: null,
      addError: null,
      sort: 'recent',
      sortDir: 'desc',
      shown: 5,
      fx: {},
      capNote: null,
      edit: null,
      removing: null,
      pour: null,
      undo: null,

      updateDraftTitle: (title) =>
        set((s) => ({ draft: { ...s.draft, title }, addError: null })),

      resetDraftForNewAdd: () =>
        set({ draft: { scope: 'm', title: '', projectId: null, drainPct: DRAIN_DEFAULT.m } }),

      selectDraftScope: (scope) => {
        const state = get()
        const n = countOf(state, scope)
        const cap = state.caps[scope]
        if (n >= cap) {
          set({ shake: scope, addError: { type: 'glassFull', scope, cap } })
          clearShakeAfter(scope, set)
          return
        }
        set((s) => {
          const project = s.projects.find((p) => p.id === s.draft.projectId) ?? null
          const drainPct = project ? clampDrain(DRAIN_DEFAULT[scope], project.remaining) : DRAIN_DEFAULT[scope]
          return { draft: { ...s.draft, scope, drainPct }, addError: null }
        })
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
        set({ draft: { scope, title: '', projectId: null, drainPct: DRAIN_DEFAULT[scope] } })
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
        const id = nextId(state.tasks)
        const newTask: Task = { id, scope: draft.scope, title, notes: '', remind: '', t: Date.now() }
        const project = state.projects.find((p) => p.id === draft.projectId) ?? null
        const pct = project ? clampDrain(draft.drainPct, project.remaining) : 0
        set((s) => ({
          tasks: [...s.tasks, newTask],
          draft: { scope: draft.scope, title: '', projectId: null, drainPct: DRAIN_DEFAULT[draft.scope] },
          addError: null,
          homeError: null,
          fx: { ...s.fx, [id]: 'new' },
          projects: project
            ? s.projects.map((p) => (p.id === project.id ? { ...p, remaining: Math.max(0, p.remaining - pct) } : p))
            : s.projects,
          pour: project ? { scope: draft.scope, hue: project.hue } : s.pour,
          undo: project ? { taskId: id, projectId: project.id, pct, scope: draft.scope } : s.undo,
        }))
        setTimeout(() => {
          set((s) => {
            const fx = { ...s.fx }
            delete fx[id]
            return { fx }
          })
        }, NEW_FX_CLEAR_MS)
        if (project) {
          setTimeout(() => set((s) => (s.pour?.hue === project.hue ? { pour: null } : {})), POUR_CLEAR_MS)
          setTimeout(() => set((s) => (s.undo?.taskId === id ? { undo: null } : {})), UNDO_CLEAR_MS)
        }
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

      setSort: (sort) =>
        set((s) =>
          s.sort === sort
            ? { sortDir: s.sortDir === 'desc' ? 'asc' : 'desc', shown: 5 }
            : { sort, sortDir: 'desc', shown: 5 },
        ),
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
        return buildBackup(state.tasks, state.caps, state.projects)
      },
      restoreBackup: (data) =>
        set({ tasks: data.tasks, caps: data.caps, projects: data.projects, shown: 5, fx: {} }),

      addProject: () => {
        const state = get()
        const id = nextId(state.projects)
        const hue = pickHue(state.projects)
        set((s) => ({
          projects: [...s.projects, { id, name: '', hue, remaining: 100 }],
          edit: { id, name: '', remaining: 100 },
        }))
      },

      startSpill: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId)
        if (!project) return
        set({
          addError: null,
          edit: null,
          draft: {
            scope: 'm',
            title: '',
            projectId: project.id,
            drainPct: clampDrain(DRAIN_DEFAULT.m, project.remaining),
          },
        })
      },

      setDrainPct: (pct) => {
        const state = get()
        const project = state.projects.find((p) => p.id === state.draft.projectId)
        const max = project ? project.remaining : 0
        set((s) => ({ draft: { ...s.draft, drainPct: clampDrain(pct, max) } }))
      },

      detachProject: () => set((s) => ({ draft: { ...s.draft, projectId: null } })),

      undoSpill: () => {
        const undo = get().undo
        if (!undo) return
        set((s) => ({
          undo: null,
          pour: null,
          fx: { ...s.fx, [undo.taskId]: 'sink' },
          projects: s.projects.map((p) =>
            p.id === undo.projectId ? { ...p, remaining: Math.min(100, p.remaining + undo.pct) } : p,
          ),
        }))
        removeTaskAfter(undo.taskId, SINK_REMOVE_MS, set)
      },

      startEditProject: (id) => {
        const project = get().projects.find((p) => p.id === id)
        if (!project) return
        set({ edit: { id: project.id, name: project.name, remaining: project.remaining } })
      },

      updateEditName: (name) => set((s) => (s.edit ? { edit: { ...s.edit, name } } : {})),
      updateEditRemaining: (remaining) => set((s) => (s.edit ? { edit: { ...s.edit, remaining } } : {})),

      // Leaves name '' when untrimmed input is blank — the "Untitled project"
      // fallback is display copy (t('pool.untitled')), resolved at render
      // time, not baked into persisted state (see lib/scopes.ts convention).
      commitEditProject: () => {
        const edit = get().edit
        if (!edit) return
        set((s) => ({
          edit: null,
          projects: s.projects.map((p) =>
            p.id === edit.id ? { ...p, name: edit.name.trim(), remaining: edit.remaining } : p,
          ),
        }))
      },

      removeProject: (id) => {
        set((s) => ({ removing: id, edit: s.edit?.id === id ? null : s.edit }))
        setTimeout(() => {
          set((s) => ({
            removing: null,
            projects: s.projects.filter((p) => p.id !== id),
            draft: s.draft.projectId === id ? { ...s.draft, projectId: null } : s.draft,
            undo: s.undo?.projectId === id ? null : s.undo,
          }))
        }, FOLD_REMOVE_MS)
      },
    }),
    {
      name: 'three-glasses-storage',
      partialize: (state) => ({ tasks: state.tasks, caps: state.caps, projects: state.projects }),
    },
  ),
)
