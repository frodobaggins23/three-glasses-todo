import { describe, expect, it } from 'vitest'
import { HUE_PALETTE, pickHue } from './projectHue'
import type { Project } from './types'

function project(hue: number): Project {
  return { id: hue, name: '', hue, remaining: 100 }
}

describe('HUE_PALETTE', () => {
  it('has 20 distinct hues', () => {
    expect(HUE_PALETTE).toHaveLength(20)
    expect(new Set(HUE_PALETTE).size).toBe(20)
  })
})

describe('pickHue', () => {
  it('picks a palette hue when there are no existing projects', () => {
    for (let i = 0; i < 20; i++) {
      expect(HUE_PALETTE).toContain(pickHue([]))
    }
  })

  it('never returns a hue already assigned to an existing project while the palette has room', () => {
    const taken = HUE_PALETTE.slice(0, 19).map(project)
    for (let i = 0; i < 20; i++) {
      expect(pickHue(taken)).toBe(HUE_PALETTE[19])
    }
  })

  it('falls back to reusing a palette hue once every hue is taken, rather than crashing', () => {
    const allTaken = HUE_PALETTE.map(project)
    expect(HUE_PALETTE).toContain(pickHue(allTaken))
  })
})
