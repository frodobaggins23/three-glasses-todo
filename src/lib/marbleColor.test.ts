import { describe, expect, it } from 'vitest'
import { dotStyle, jitterForTaskId, marbleBg } from './marbleColor'

describe('jitterForTaskId', () => {
  it('matches the prototype formula (id*37) % 17 - 8 for known ids', () => {
    // Computed independently via Node from the prototype's ((t.id * 37) % 17) - 8,
    // not hand-derived, to avoid asserting a self-consistent-but-wrong value.
    expect(jitterForTaskId(100)).toBe(3)
    expect(jitterForTaskId(101)).toBe(6)
    expect(jitterForTaskId(112)).toBe(5)
  })

  it('stays within [-8, 8] for a range of ids', () => {
    for (let id = 0; id < 500; id++) {
      const j = jitterForTaskId(id)
      expect(j).toBeGreaterThanOrEqual(-8)
      expect(j).toBeLessThanOrEqual(8)
    }
  })

  it('is deterministic for the same id', () => {
    expect(jitterForTaskId(137)).toBe(jitterForTaskId(137))
  })
})

describe('marbleBg', () => {
  it('applies jitter to the base hue in every gradient stop', () => {
    const css = marbleBg(62, 5)
    expect(css).toContain('oklch(0.92 0.06 67)')
    expect(css).toContain('oklch(0.78 0.13 67)')
    expect(css).toContain('oklch(0.58 0.14 67)')
    expect(css).toContain('oklch(0.36 0.09 67)')
  })
})

describe('dotStyle', () => {
  it('uses zero jitter (a static indicator, not a rendered marble)', () => {
    const style = dotStyle(232, 20)
    expect(style.background).toBe(marbleBg(232, 0))
    expect(style.width).toBe(20)
    expect(style.height).toBe(20)
    expect(style.borderRadius).toBe(20)
  })
})
