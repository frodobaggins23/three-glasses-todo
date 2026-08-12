import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from './useAppStore'

function reset() {
  useAppStore.setState({
    tasks: [],
    caps: { s: 12, m: 6, l: 3 },
    draft: { scope: 'm', title: '' },
    shake: null,
    homeError: null,
    addError: null,
    sort: 'recent',
    shown: 5,
    fx: {},
    capNote: null,
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
  it('returns "ok" and presets the draft scope with an empty title when the glass has room', () => {
    useAppStore.setState({ draft: { scope: 's', title: 'leftover' } })
    const result = useAppStore.getState().tapGlass('l')
    expect(result).toBe('ok')
    expect(useAppStore.getState().draft).toEqual({ scope: 'l', title: '' })
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
    useAppStore.setState({ draft: { scope: 's', title: 'keep me' } })
    useAppStore.getState().selectDraftScope('l')
    expect(useAppStore.getState().draft).toEqual({ scope: 'l', title: 'keep me' })
  })

  it('sets addError (not homeError) when the target scope is full', () => {
    useAppStore.setState({ caps: { s: 12, m: 6, l: 0 }, draft: { scope: 's', title: 'x' } })
    useAppStore.getState().selectDraftScope('l')
    expect(useAppStore.getState().addError).toEqual({ type: 'glassFull', scope: 'l', cap: 0 })
    expect(useAppStore.getState().homeError).toBeNull()
  })
})

describe('setSort', () => {
  it('resets shown to 5 on every sort change', () => {
    useAppStore.setState({ shown: 15 })
    useAppStore.getState().setSort('size')
    expect(useAppStore.getState().shown).toBe(5)
  })
})
