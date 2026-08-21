import { describe, expect, it } from 'vitest'
import { bucketLiquidGradient, committedBarGradient } from './projectColor'

describe('bucketLiquidGradient', () => {
  it('is a top-to-bottom gradient using the given hue at both stops', () => {
    const css = bucketLiquidGradient(150)
    expect(css).toContain('180deg')
    expect(css).toContain('oklch(0.72 0.13 150 / 0.85)')
    expect(css).toContain('oklch(0.5 0.12 150 / 0.95)')
  })
})

describe('committedBarGradient', () => {
  it('is a left-to-right gradient using the given hue at both stops', () => {
    const css = committedBarGradient(285)
    expect(css).toContain('90deg')
    expect(css).toContain('oklch(0.62 0.12 285 / 0.9)')
    expect(css).toContain('oklch(0.78 0.13 285 / 0.9)')
  })
})
