import { describe, expect, it } from 'vitest'
import { parseScreen, pathForScreen } from './routing'

describe('parseScreen', () => {
  it('parses each known path relative to the base', () => {
    expect(parseScreen('/three-glasses/', '/three-glasses/')).toEqual({ name: 'home' })
    expect(parseScreen('/three-glasses/add', '/three-glasses/')).toEqual({ name: 'add' })
    expect(parseScreen('/three-glasses/settings', '/three-glasses/')).toEqual({ name: 'settings' })
    expect(parseScreen('/three-glasses/pool', '/three-glasses/')).toEqual({ name: 'pool' })
    expect(parseScreen('/three-glasses/task/42', '/three-glasses/')).toEqual({ name: 'detail', id: 42 })
  })

  it('falls back to home for an unknown path', () => {
    expect(parseScreen('/three-glasses/nope', '/three-glasses/')).toEqual({ name: 'home' })
    expect(parseScreen('/three-glasses/task/not-a-number', '/three-glasses/')).toEqual({ name: 'home' })
  })

  it('works with a root base', () => {
    expect(parseScreen('/', '/')).toEqual({ name: 'home' })
    expect(parseScreen('/add', '/')).toEqual({ name: 'add' })
    expect(parseScreen('/task/42', '/')).toEqual({ name: 'detail', id: 42 })
  })
})

describe('pathForScreen', () => {
  it('prefixes every path with the base', () => {
    expect(pathForScreen({ name: 'home' }, '/three-glasses/')).toBe('/three-glasses/')
    expect(pathForScreen({ name: 'add' }, '/three-glasses/')).toBe('/three-glasses/add')
    expect(pathForScreen({ name: 'settings' }, '/three-glasses/')).toBe('/three-glasses/settings')
    expect(pathForScreen({ name: 'pool' }, '/three-glasses/')).toBe('/three-glasses/pool')
    expect(pathForScreen({ name: 'detail', id: 42 }, '/three-glasses/')).toBe('/three-glasses/task/42')
  })

  it('is the inverse of parseScreen for every screen', () => {
    const screens: Parameters<typeof pathForScreen>[0][] = [
      { name: 'home' },
      { name: 'add' },
      { name: 'settings' },
      { name: 'pool' },
      { name: 'detail', id: 42 },
    ]
    for (const base of ['/', '/three-glasses/']) {
      for (const screen of screens) {
        expect(parseScreen(pathForScreen(screen, base), base)).toEqual(screen)
      }
    }
  })
})
