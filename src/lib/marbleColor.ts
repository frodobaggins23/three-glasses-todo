/** Ported from marbleBg()/dot() in the design handoff prototype. */

export function marbleBg(hue: number, jitter: number): string {
  const h = hue + jitter
  return `radial-gradient(circle at 32% 26%, oklch(0.92 0.06 ${h}) 0%, oklch(0.78 0.13 ${h}) 26%, oklch(0.58 0.14 ${h}) 62%, oklch(0.36 0.09 ${h}) 100%)`
}

/** Deterministic hue jitter in [-8, 8], derived from task id so a glass reads as many marbles, not one pattern. */
export function jitterForTaskId(id: number): number {
  return ((id * 37) % 17) - 8
}

export interface DotStyle {
  width: number
  height: number
  borderRadius: number
  flexShrink: number
  background: string
  boxShadow: string
}

/** Small static indicator dot (scope chips, recent-list rows) — no jitter, simpler shadow than a full marble. */
export function dotStyle(hue: number, diameter: number): DotStyle {
  return {
    width: diameter,
    height: diameter,
    borderRadius: diameter,
    flexShrink: 0,
    background: marbleBg(hue, 0),
    boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.4)',
  }
}
