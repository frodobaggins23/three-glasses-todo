import { describe, expect, it } from 'vitest'
import { layoutMarbles } from './marbleLayout'

describe('layoutMarbles', () => {
  it('assigns a position to every task that fits', () => {
    const tasks = [{ id: 1, title: 'a' }, { id: 2, title: 'b' }, { id: 3, title: 'c' }]
    const result = layoutMarbles(62, tasks, 6)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.id)).toEqual([1, 2, 3])
  })

  it('carries the task title through to the layout result', () => {
    const tasks = [{ id: 1, title: 'Water the plants' }]
    const result = layoutMarbles(62, tasks, 6)
    expect(result[0].title).toBe('Water the plants')
  })

  it('grows marble diameter as capacity shrinks (uses max(cap, tasks.length))', () => {
    const tasks = [{ id: 1, title: 'a' }]
    const withRoomToSpare = layoutMarbles(62, tasks, 12)
    const nearlyFull = layoutMarbles(62, tasks, 1)
    expect(nearlyFull[0].diameter).toBeGreaterThan(withRoomToSpare[0].diameter)
  })

  it('shows every marble even over capacity (uses max(cap, count), not cap alone)', () => {
    const tasks = [{ id: 1, title: 'a' }, { id: 2, title: 'b' }, { id: 3, title: 'c' }, { id: 4, title: 'd' }]
    const result = layoutMarbles(62, tasks, 2)
    expect(result).toHaveLength(4)
  })

  it('maps fx flags to the corresponding CSS animation', () => {
    const tasks = [
      { id: 1, title: 'a', fx: 'new' as const },
      { id: 2, title: 'b', fx: 'pop' as const },
      { id: 3, title: 'c', fx: 'sink' as const },
      { id: 4, title: 'd' },
    ]
    const result = layoutMarbles(62, tasks, 6)
    expect(result.find((r) => r.id === 1)?.animation).toContain('tg-drop')
    expect(result.find((r) => r.id === 2)?.animation).toContain('tg-pop')
    expect(result.find((r) => r.id === 3)?.animation).toContain('tg-sink')
    expect(result.find((r) => r.id === 4)?.animation).toBeUndefined()
  })
})
