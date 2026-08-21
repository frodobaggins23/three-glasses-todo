import { bucketLiquidGradient } from '../lib/projectColor'

export interface BucketGlyphProps {
  hue: number
  /** 0-100, bottom-anchored fill height as a percent of the glyph. */
  remaining: number
  width: number
  height: number
  borderRadius?: number
}

/** A project bucket's liquid-fill glyph — used at card size (Pool) and mini size (Add "Spilling from" banner). */
export function BucketGlyph({ hue, remaining, width, height, borderRadius = 6 }: BucketGlyphProps) {
  return (
    <div
      className="relative flex-shrink-0 overflow-hidden border border-white/14 bg-white/3"
      style={{ height, width, borderRadius }}
    >
      <div
        className="absolute right-0 bottom-0 left-0 transition-[height] duration-[520ms] ease-[cubic-bezier(.4,0,.2,1)]"
        style={{ height: `${remaining}%`, background: bucketLiquidGradient(hue) }}
      />
    </div>
  )
}
