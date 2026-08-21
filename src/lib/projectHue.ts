import type { Project } from './types'

/**
 * 20 oklch hues spaced 18° apart around the wheel — enough headroom that the
 * expected 3-7 concurrent buckets essentially never collide. A project's hue
 * is "assigned" for as long as it appears in `projects`; there is no separate
 * tracking array — removing a project (drop or clear) frees its hue for
 * reuse simply by no longer being in the list.
 */
export const HUE_PALETTE: number[] = [
  10, 28, 46, 64, 82, 100, 118, 136, 154, 172, 190, 208, 226, 244, 262, 280, 298, 316, 334, 352,
]

/** Picks a random hue not already in use by an existing project; falls back to any palette hue once the palette is exhausted. */
export function pickHue(projects: Project[]): number {
  const taken = new Set(projects.map((p) => p.hue))
  const free = HUE_PALETTE.filter((h) => !taken.has(h))
  const pool = free.length > 0 ? free : HUE_PALETTE
  return pool[Math.floor(Math.random() * pool.length)]
}
