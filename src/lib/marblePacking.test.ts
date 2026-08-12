import { describe, expect, it } from 'vitest'
import { fitSize, pack } from './marblePacking'

/**
 * Verbatim copy of pack()/fitSize() from the design handoff's
 * Three Glasses.dc.html (lines ~242-280), de-classed to plain functions,
 * used as a golden-value oracle to catch subtle mistranslation in the
 * TS port above — invariant tests alone (containment, determinism) would
 * still pass on a mistranslated port that drops e.g. the alternating scan
 * direction, since that only affects *which* valid position is chosen,
 * not whether the result is valid.
 */
function originalPack(d: number, n: number, cache: Map<string, any> = new Map()) {
  const key = d + '|' + n
  if (cache.has(key)) return cache.get(key)
  const topW = 96,
    botW = 76,
    H = 190,
    cx = 48
  const halfW = (y: number) => (botW + (topW - botW) * (1 - Math.max(0, Math.min(H, y)) / H)) / 2 - 1
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    let best: { x: number; y: number } | null = null
    for (let s = 0; s <= 60; s++) {
      const x = i % 2 ? 92 - s * 1.5 : 4 + s * 1.5
      let y = H - d / 2 - 1
      for (const p of pts) {
        const dx = x - p.x
        if (Math.abs(dx) < d) y = Math.min(y, p.y - Math.sqrt(d * d - dx * dx))
      }
      if (Math.abs(x - cx) + d / 2 > halfW(y + d / 2)) continue
      if (!best || y > best.y + 0.01) best = { x, y }
    }
    if (!best) break
    pts.push(best)
  }
  const top = pts.length ? Math.min.apply(null, pts.map((p) => p.y)) - d / 2 : H
  const res = { pts, top, ok: pts.length === n }
  cache.set(key, res)
  return res
}

function originalFitSize(cap: number) {
  let d = 10
  for (let c = 62; c >= 10; c -= 1) {
    const p = originalPack(c, cap)
    if (p.ok && p.top >= 1) {
      d = c
      break
    }
  }
  return d
}

describe('pack — golden values against the prototype source', () => {
  const cases: Array<[number, number]> = [
    [30, 0],
    [30, 1],
    [30, 3],
    [20, 6],
    [15, 12],
    [40, 5],
    [62, 1],
    [10, 20],
  ]

  it.each(cases)('matches the original algorithm for pack(%d, %d)', (d, n) => {
    const expected = originalPack(d, n)
    const actual = pack(d, n)
    expect(actual.pts).toEqual(expected.pts)
    expect(actual.top).toBe(expected.top)
    expect(actual.ok).toBe(expected.ok)
  })
})

describe('fitSize — golden values against the prototype source', () => {
  it.each([1, 2, 3, 6, 12, 24])('matches the original algorithm for fitSize(%d)', (cap) => {
    expect(fitSize(cap)).toBe(originalFitSize(cap))
  })
})

describe('pack — containment invariants', () => {
  it('every marble stays within the tapered glass walls', () => {
    const d = 20
    const { pts } = pack(d, 6)
    const topW = 96,
      botW = 76,
      H = 190,
      cx = 48
    for (const p of pts) {
      const y = Math.max(0, Math.min(H, p.y))
      const halfW = (botW + (topW - botW) * (1 - y / H)) / 2 - 1
      expect(Math.abs(p.x - cx) + d / 2).toBeLessThanOrEqual(halfW + 1e-6)
    }
  })

  it('no two marbles overlap', () => {
    const d = 20
    const { pts } = pack(d, 8)
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dist = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
        expect(dist).toBeGreaterThanOrEqual(d - 1e-6)
      }
    }
  })

  it('is deterministic across repeated calls', () => {
    const a = pack(18, 7)
    const b = pack(18, 7)
    expect(a).toEqual(b)
  })

  it('always places every marble for diameters in the valid range (marbles can stack above the visible rim)', () => {
    // Verified against the original algorithm directly: ok never goes false for d<=62,
    // since halfWidthAt clamps y to [0, H] — a marble can always find room by stacking
    // above y=0. It's fitSize's separate `top >= 1` check that rejects unreasonable fits.
    const result = pack(62, 20)
    expect(result.ok).toBe(true)
    expect(result.pts).toHaveLength(20)
  })
})

describe('fitSize', () => {
  it('produces smaller diameters for larger capacities', () => {
    expect(fitSize(3)).toBeGreaterThan(fitSize(12))
  })

  it('is deterministic and memoization-safe across repeated calls', () => {
    expect(fitSize(6)).toBe(fitSize(6))
  })
})
