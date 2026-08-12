/**
 * Ported near-literally from pack()/fitSize() in the design handoff's
 * Three Glasses.dc.html prototype (lines ~242-280). Coordinate space:
 * glass well 96 wide at top, 76 wide at bottom, 190 tall, centered at x=48.
 */

export interface PackedPoint {
  x: number
  y: number
}

export interface PackResult {
  pts: PackedPoint[]
  top: number
  ok: boolean
}

const TOP_W = 96
const BOT_W = 76
const H = 190
const CX = 48

function halfWidthAt(y: number): number {
  const clamped = Math.max(0, Math.min(H, y))
  return (BOT_W + (TOP_W - BOT_W) * (1 - clamped / H)) / 2 - 1
}

const packCache = new Map<string, PackResult>()

/** Packs `n` marbles of diameter `d` into the glass well, deepest-fit-first. Memoized. */
export function pack(d: number, n: number): PackResult {
  const key = `${d}|${n}`
  const cached = packCache.get(key)
  if (cached) return cached

  const pts: PackedPoint[] = []
  for (let i = 0; i < n; i++) {
    let best: PackedPoint | null = null
    for (let s = 0; s <= 60; s++) {
      const x = i % 2 ? 92 - s * 1.5 : 4 + s * 1.5
      let y = H - d / 2 - 1
      for (const p of pts) {
        const dx = x - p.x
        if (Math.abs(dx) < d) y = Math.min(y, p.y - Math.sqrt(d * d - dx * dx))
      }
      if (Math.abs(x - CX) + d / 2 > halfWidthAt(y + d / 2)) continue
      if (!best || y > best.y + 0.01) best = { x, y }
    }
    if (!best) break
    pts.push(best)
  }

  const top = pts.length ? Math.min(...pts.map((p) => p.y)) - d / 2 : H
  const res: PackResult = { pts, top, ok: pts.length === n }
  packCache.set(key, res)
  return res
}

const fitCache = new Map<number, number>()

/** Largest marble diameter (62..10) at which `cap` marbles all fit inside the glass. Memoized. */
export function fitSize(cap: number): number {
  const cached = fitCache.get(cap)
  if (cached !== undefined) return cached

  let d = 10
  for (let c = 62; c >= 10; c -= 1) {
    const p = pack(c, cap)
    if (p.ok && p.top >= 1) {
      d = c
      break
    }
  }
  fitCache.set(cap, d)
  return d
}
