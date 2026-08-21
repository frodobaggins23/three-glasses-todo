/** Ported from bucketFill()/barStyle() in the design handoff prototype. */

/** Bottom-anchored liquid fill used by bucket glyphs (Pool cards, Add "Spilling from" banner). */
export function bucketLiquidGradient(hue: number): string {
  return `linear-gradient(180deg, oklch(0.72 0.13 ${hue} / 0.85), oklch(0.5 0.12 ${hue} / 0.95))`
}

/** Left-to-right "committed" progress bar on a bucket card. */
export function committedBarGradient(hue: number): string {
  return `linear-gradient(90deg, oklch(0.62 0.12 ${hue} / 0.9), oklch(0.78 0.13 ${hue} / 0.9))`
}
