import { describe, expect, it } from 'vitest'
import { parseScreen, pathForScreen } from './routing'

describe('parseScreen', () => {
  it('parses each known path', () => {
    expect(parseScreen('/')).toEqual({ name: 'home' })
    expect(parseScreen('/add')).toEqual({ name: 'add' })
    expect(parseScreen('/settings')).toEqual({ name: 'settings' })
    expect(parseScreen('/task/42')).toEqual({ name: 'detail', id: 42 })
  })

  it('falls back to home for an unknown path', () => {
    expect(parseScreen('/nope')).toEqual({ name: 'home' })
    expect(parseScreen('/task/not-a-number')).toEqual({ name: 'home' })
  })
})

describe('pathForScreen', () => {
  it('is the inverse of parseScreen for every screen', () => {
    const screens: Parameters<typeof pathForScreen>[0][] = [
      { name: 'home' },
      { name: 'add' },
      { name: 'settings' },
      { name: 'detail', id: 42 },
    ]
    for (const screen of screens) {
      expect(parseScreen(pathForScreen(screen))).toEqual(screen)
    }
  })
})
