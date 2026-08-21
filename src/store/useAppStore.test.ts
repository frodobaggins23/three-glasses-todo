import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HUE_PALETTE } from '../lib/projectHue'
import { useAppStore } from './useAppStore'

function reset() {
  useAppStore.setState({
    tasks: [],
    caps: { s: 12, m: 6, l: 3 },
    projects: [],
    draft: { scope: 'm', title: '', projectId: null, drainPct: 15 },
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
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  reset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('tryAddTask', () => {
  it('adds a task and flags it fx="new", clearing the flag after 560ms', () => {
    useAppStore.getState().updateDraftTitle('Water the fig')
    const added = useAppStore.getState().tryAddTask()
    expect(added).toBe(true)

    const task = useAppStore.getState().tasks[0]
    expect(task.title).toBe('Water the fig')
    expect(task.scope).toBe('m')
    expect(useAppStore.getState().fx[task.id]).toBe('new')
    expect(useAppStore.getState().draft.title).toBe('')

    vi.advanceTimersByTime(560)
    expect(useAppStore.getState().fx[task.id]).toBeUndefined()
  })

  it('rejects an empty title without touching capacity/shake', () => {
    useAppStore.getState().updateDraftTitle('   ')
    const added = useAppStore.getState().tryAddTask()
    expect(added).toBe(false)
    expect(useAppStore.getState().addError).toEqual({ type: 'titleRequired' })
    expect(useAppStore.getState().shake).toBeNull()
  })

  it('blocks adding to a full glass, sets a structured glassFull error, and shakes for 600ms', () => {
    useAppStore.setState({ caps: { s: 12, m: 1, l: 3 } })
    useAppStore.getState().updateDraftTitle('first')
    expect(useAppStore.getState().tryAddTask()).toBe(true)

    useAppStore.getState().updateDraftTitle('second')
    const added = useAppStore.getState().tryAddTask()
    expect(added).toBe(false)
    expect(useAppStore.getState().addError).toEqual({ type: 'glassFull', scope: 'm', cap: 1 })
    expect(useAppStore.getState().shake).toBe('m')

    vi.advanceTimersByTime(600)
    expect(useAppStore.getState().shake).toBeNull()
  })

  it('clears addError as soon as the draft title changes', () => {
    useAppStore.setState({ addError: { type: 'titleRequired' } })
    useAppStore.getState().updateDraftTitle('x')
    expect(useAppStore.getState().addError).toBeNull()
  })
})

describe('decCap — capacity floor is max(1, currentCount), not just currentCount', () => {
  it('allows decrementing an empty glass down to 1, not 0', () => {
    useAppStore.setState({ caps: { s: 12, m: 1, l: 3 } })
    useAppStore.getState().decCap('m')
    // floor is max(1, 0) = 1, cap is already 1 -> blocked
    expect(useAppStore.getState().caps.m).toBe(1)
    expect(useAppStore.getState().capNote).toBe('m')
  })

  it('blocks decrementing below the current task count', () => {
    useAppStore.setState({
      caps: { s: 12, m: 6, l: 3 },
      tasks: [
        { id: 1, scope: 'm', title: 'a', notes: '', remind: '', t: 1 },
        { id: 2, scope: 'm', title: 'b', notes: '', remind: '', t: 2 },
      ],
    })
    useAppStore.setState({ caps: { s: 12, m: 2, l: 3 } })
    useAppStore.getState().decCap('m')
    expect(useAppStore.getState().caps.m).toBe(2)
    expect(useAppStore.getState().capNote).toBe('m')

    vi.advanceTimersByTime(2600)
    expect(useAppStore.getState().capNote).toBeNull()
  })

  it('decrements normally when above the floor', () => {
    useAppStore.getState().decCap('m')
    expect(useAppStore.getState().caps.m).toBe(5)
    expect(useAppStore.getState().capNote).toBeNull()
  })

  it('a later capNote for a different scope is not clobbered by an earlier timeout', () => {
    useAppStore.setState({ caps: { s: 1, m: 1, l: 3 } })
    useAppStore.getState().decCap('s')
    vi.advanceTimersByTime(1000)
    useAppStore.getState().decCap('m')
    vi.advanceTimersByTime(1600) // s's 2600ms note would have expired by now if not scope-guarded
    expect(useAppStore.getState().capNote).toBe('m')
  })
})

describe('incCap', () => {
  it('caps at 24', () => {
    useAppStore.setState({ caps: { s: 24, m: 6, l: 3 } })
    useAppStore.getState().incCap('s')
    expect(useAppStore.getState().caps.s).toBe(24)
  })
})

describe('completeTask / dropTask', () => {
  beforeEach(() => {
    useAppStore.setState({
      tasks: [{ id: 1, scope: 's', title: 'x', notes: '', remind: '', t: 1 }],
    })
  })

  it('completeTask flags "pop" immediately, excluding it from counts, then removes it after 330ms', () => {
    useAppStore.getState().completeTask(1)
    expect(useAppStore.getState().fx[1]).toBe('pop')
    expect(useAppStore.getState().tasks).toHaveLength(1) // still present until timeout

    vi.advanceTimersByTime(330)
    expect(useAppStore.getState().tasks).toHaveLength(0)
    expect(useAppStore.getState().fx[1]).toBeUndefined()
  })

  it('dropTask flags "sink" and removes after 430ms', () => {
    useAppStore.getState().dropTask(1)
    expect(useAppStore.getState().fx[1]).toBe('sink')

    vi.advanceTimersByTime(429)
    expect(useAppStore.getState().tasks).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(useAppStore.getState().tasks).toHaveLength(0)
  })
})

describe('tapGlass', () => {
  it('returns "ok" and presets a fresh, unattached draft with an empty title when the glass has room', () => {
    useAppStore.setState({ draft: { scope: 's', title: 'leftover', projectId: 7, drainPct: 5 } })
    const result = useAppStore.getState().tapGlass('l')
    expect(result).toBe('ok')
    expect(useAppStore.getState().draft).toEqual({ scope: 'l', title: '', projectId: null, drainPct: 30 })
  })

  it('returns "full" and sets homeError (not addError) when the glass is full', () => {
    useAppStore.setState({ caps: { s: 12, m: 6, l: 0 } })
    const result = useAppStore.getState().tapGlass('l')
    expect(result).toBe('full')
    expect(useAppStore.getState().homeError).toEqual({ type: 'glassFull', scope: 'l', cap: 0 })
    expect(useAppStore.getState().addError).toBeNull()
  })
})

describe('selectDraftScope — Add screen picker tap', () => {
  it('keeps the existing draft title when switching scope', () => {
    useAppStore.setState({ draft: { scope: 's', title: 'keep me', projectId: null, drainPct: 5 } })
    useAppStore.getState().selectDraftScope('l')
    expect(useAppStore.getState().draft).toEqual({ scope: 'l', title: 'keep me', projectId: null, drainPct: 30 })
  })

  it('sets addError (not homeError) when the target scope is full', () => {
    useAppStore.setState({
      caps: { s: 12, m: 6, l: 0 },
      draft: { scope: 's', title: 'x', projectId: null, drainPct: 5 },
    })
    useAppStore.getState().selectDraftScope('l')
    expect(useAppStore.getState().addError).toEqual({ type: 'glassFull', scope: 'l', cap: 0 })
    expect(useAppStore.getState().homeError).toBeNull()
  })

  it('re-suggests drain clamped to the attached project\'s remaining when switching scope', () => {
    useAppStore.setState({
      projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 8 }],
      draft: { scope: 's', title: '', projectId: 1, drainPct: 5 },
    })
    useAppStore.getState().selectDraftScope('l') // default 30, but bucket only has 8 left
    expect(useAppStore.getState().draft.drainPct).toBe(8)
  })
})

describe('setSort', () => {
  it('resets shown to 5 on every sort change', () => {
    useAppStore.setState({ shown: 15 })
    useAppStore.getState().setSort('size')
    expect(useAppStore.getState().shown).toBe(5)
  })

  it('switching to a different mode resets direction to desc', () => {
    useAppStore.setState({ sort: 'recent', sortDir: 'asc' })
    useAppStore.getState().setSort('size')
    expect(useAppStore.getState().sort).toBe('size')
    expect(useAppStore.getState().sortDir).toBe('desc')
  })

  it('clicking the already-active mode toggles direction instead of resetting it', () => {
    useAppStore.getState().setSort('recent')
    expect(useAppStore.getState().sort).toBe('recent')
    expect(useAppStore.getState().sortDir).toBe('asc')

    useAppStore.getState().setSort('recent')
    expect(useAppStore.getState().sortDir).toBe('desc')
  })
})

describe('exportBackup / restoreBackup', () => {
  it('exportBackup captures the current tasks, caps and projects', () => {
    useAppStore.setState({
      tasks: [{ id: 1, scope: 's', title: 'x', notes: '', remind: '', t: 1 }],
      caps: { s: 10, m: 6, l: 3 },
      projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 40 }],
    })
    const backup = useAppStore.getState().exportBackup()
    expect(backup.tasks).toEqual(useAppStore.getState().tasks)
    expect(backup.caps).toEqual({ s: 10, m: 6, l: 3 })
    expect(backup.projects).toEqual([{ id: 1, name: 'Kitchen', hue: 150, remaining: 40 }])
  })

  it('restoreBackup replaces tasks/caps/projects and resets shown/fx', () => {
    useAppStore.setState({
      tasks: [{ id: 1, scope: 's', title: 'old', notes: '', remind: '', t: 1 }],
      projects: [{ id: 9, name: 'stale', hue: 10, remaining: 1 }],
      shown: 15,
      fx: { 1: 'new' },
    })
    useAppStore.getState().restoreBackup({
      exportedAt: '',
      tasks: [{ id: 2, scope: 'l', title: 'new', notes: '', remind: '', t: 2 }],
      caps: { s: 1, m: 1, l: 1 },
      projects: [{ id: 3, name: 'fresh', hue: 20, remaining: 90 }],
    })
    expect(useAppStore.getState().tasks).toEqual([{ id: 2, scope: 'l', title: 'new', notes: '', remind: '', t: 2 }])
    expect(useAppStore.getState().caps).toEqual({ s: 1, m: 1, l: 1 })
    expect(useAppStore.getState().projects).toEqual([{ id: 3, name: 'fresh', hue: 20, remaining: 90 }])
    expect(useAppStore.getState().shown).toBe(5)
    expect(useAppStore.getState().fx).toEqual({})
  })
})

describe('addProject', () => {
  it('appends an empty bucket with a hue from the palette and opens it in the inline editor', () => {
    useAppStore.getState().addProject()
    const { projects, edit } = useAppStore.getState()
    expect(projects).toHaveLength(1)
    expect(projects[0]).toMatchObject({ name: '', remaining: 100 })
    expect(HUE_PALETTE).toContain(projects[0].hue)
    expect(edit).toEqual({ id: projects[0].id, name: '', remaining: 100 })
  })

  it('never reuses a hue already assigned to an existing project while the palette has room', () => {
    useAppStore.setState({ projects: HUE_PALETTE.slice(0, 19).map((hue, i) => ({ id: i + 1, name: '', hue, remaining: 100 })) })
    useAppStore.getState().addProject()
    const added = useAppStore.getState().projects.at(-1)!
    expect(added.hue).toBe(HUE_PALETTE[19])
  })
})

describe('startSpill', () => {
  it('opens the Add draft attached to the project, suggesting Medium drain clamped to remaining', () => {
    useAppStore.setState({ projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 8 }] })
    useAppStore.getState().startSpill(1)
    expect(useAppStore.getState().draft).toEqual({ scope: 'm', title: '', projectId: 1, drainPct: 8 })
  })

  it('is a no-op for an unknown project id', () => {
    const before = useAppStore.getState().draft
    useAppStore.getState().startSpill(999)
    expect(useAppStore.getState().draft).toEqual(before)
  })
})

describe('setDrainPct', () => {
  it('clamps between 0 and the attached project\'s remaining', () => {
    useAppStore.setState({
      projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 8 }],
      draft: { scope: 'm', title: '', projectId: 1, drainPct: 5 },
    })
    useAppStore.getState().setDrainPct(50)
    expect(useAppStore.getState().draft.drainPct).toBe(8)
    useAppStore.getState().setDrainPct(-10)
    expect(useAppStore.getState().draft.drainPct).toBe(0)
  })
})

describe('detachProject', () => {
  it('clears projectId without touching the rest of the draft', () => {
    useAppStore.setState({ draft: { scope: 'l', title: 'keep', projectId: 1, drainPct: 30 } })
    useAppStore.getState().detachProject()
    expect(useAppStore.getState().draft).toEqual({ scope: 'l', title: 'keep', projectId: null, drainPct: 30 })
  })
})

describe('tryAddTask — spilling from a project', () => {
  it('drains the bucket, fires a pour + undo toast (cleared at 820ms/5000ms), and resets the draft', () => {
    useAppStore.setState({
      projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 20 }],
      draft: { scope: 'm', title: 'Grout the corners', projectId: 1, drainPct: 15 },
    })
    expect(useAppStore.getState().tryAddTask()).toBe(true)

    const task = useAppStore.getState().tasks[0]
    expect(useAppStore.getState().projects[0].remaining).toBe(5)
    expect(useAppStore.getState().pour).toEqual({ scope: 'm', hue: 150 })
    expect(useAppStore.getState().undo).toEqual({ taskId: task.id, projectId: 1, pct: 15, scope: 'm' })
    expect(useAppStore.getState().draft).toEqual({ scope: 'm', title: '', projectId: null, drainPct: 15 })

    vi.advanceTimersByTime(820)
    expect(useAppStore.getState().pour).toBeNull()
    expect(useAppStore.getState().undo).not.toBeNull()

    vi.advanceTimersByTime(5000 - 820)
    expect(useAppStore.getState().undo).toBeNull()
  })

  it('clamps the drain to whatever remains, never over-draining', () => {
    useAppStore.setState({
      projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 10 }],
      draft: { scope: 'm', title: 'x', projectId: 1, drainPct: 30 },
    })
    useAppStore.getState().tryAddTask()
    expect(useAppStore.getState().projects[0].remaining).toBe(0)
    expect(useAppStore.getState().undo?.pct).toBe(10)
  })

  it('runs the capacity check first — a full glass drains nothing and adds nothing', () => {
    useAppStore.setState({
      caps: { s: 12, m: 0, l: 3 },
      projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 20 }],
      draft: { scope: 'm', title: 'x', projectId: 1, drainPct: 15 },
    })
    expect(useAppStore.getState().tryAddTask()).toBe(false)
    expect(useAppStore.getState().projects[0].remaining).toBe(20)
    expect(useAppStore.getState().undo).toBeNull()
    expect(useAppStore.getState().pour).toBeNull()
  })

  it('a plain add with no project attached does not touch pour/undo', () => {
    useAppStore.setState({ draft: { scope: 'm', title: 'x', projectId: null, drainPct: 15 } })
    useAppStore.getState().tryAddTask()
    expect(useAppStore.getState().pour).toBeNull()
    expect(useAppStore.getState().undo).toBeNull()
  })
})

describe('undoSpill', () => {
  it('refunds the drain (capped at 100), sinks the task, and removes it after 430ms', () => {
    useAppStore.setState({
      projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 20 }],
      draft: { scope: 'm', title: 'x', projectId: 1, drainPct: 15 },
    })
    useAppStore.getState().tryAddTask()
    const task = useAppStore.getState().tasks[0]

    useAppStore.getState().undoSpill()
    expect(useAppStore.getState().projects[0].remaining).toBe(20) // 5 + 15 refunded
    expect(useAppStore.getState().undo).toBeNull()
    expect(useAppStore.getState().pour).toBeNull()
    expect(useAppStore.getState().fx[task.id]).toBe('sink')
    expect(useAppStore.getState().tasks).toHaveLength(1)

    vi.advanceTimersByTime(430)
    expect(useAppStore.getState().tasks).toHaveLength(0)
  })

  it('is a no-op when there is nothing to undo', () => {
    const before = useAppStore.getState()
    useAppStore.getState().undoSpill()
    expect(useAppStore.getState().tasks).toEqual(before.tasks)
  })
})

describe('startEditProject / updateEditName / updateEditRemaining / commitEditProject', () => {
  it('opens, edits, and commits — trimming the name but leaving an untrimmed blank as "" for the render-time fallback', () => {
    useAppStore.setState({ projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 62 }] })
    useAppStore.getState().startEditProject(1)
    expect(useAppStore.getState().edit).toEqual({ id: 1, name: 'Kitchen', remaining: 62 })

    useAppStore.getState().updateEditName('  New name  ')
    useAppStore.getState().updateEditRemaining(40)
    useAppStore.getState().commitEditProject()
    expect(useAppStore.getState().edit).toBeNull()
    expect(useAppStore.getState().projects[0]).toEqual({ id: 1, name: 'New name', hue: 150, remaining: 40 })
  })

  it('commits an empty trimmed name as "" rather than a hardcoded fallback', () => {
    useAppStore.setState({ projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 62 }] })
    useAppStore.getState().startEditProject(1)
    useAppStore.getState().updateEditName('   ')
    useAppStore.getState().commitEditProject()
    expect(useAppStore.getState().projects[0].name).toBe('')
  })
})

describe('removeProject', () => {
  it('folds out over 380ms, then removes the project and nulls a draft/undo referencing it', () => {
    useAppStore.setState({
      projects: [{ id: 1, name: 'Kitchen', hue: 150, remaining: 20 }],
      draft: { scope: 'm', title: '', projectId: 1, drainPct: 15 },
      undo: { taskId: 5, projectId: 1, pct: 15, scope: 'm' },
      edit: { id: 1, name: 'Kitchen', remaining: 20 },
    })
    useAppStore.getState().removeProject(1)
    expect(useAppStore.getState().removing).toBe(1)
    expect(useAppStore.getState().edit).toBeNull()
    expect(useAppStore.getState().projects).toHaveLength(1) // still present until the fold finishes

    vi.advanceTimersByTime(380)
    expect(useAppStore.getState().projects).toHaveLength(0)
    expect(useAppStore.getState().removing).toBeNull()
    expect(useAppStore.getState().draft.projectId).toBeNull()
    expect(useAppStore.getState().undo).toBeNull()
  })
})
