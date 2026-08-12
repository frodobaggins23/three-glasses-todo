export interface MiniGlassProps {
  hue: number
  /** Already clamped to [0, 1] — Math.min(1, count / cap). */
  fillRatio: number
}

/** The Add screen's 52x76 scope-picker glass — a liquid fill, not marble-packed. */
export function MiniGlass({ hue, fillRatio }: MiniGlassProps) {
  const fillHeight = Math.round(72 * fillRatio)
  return (
    <div className="relative mx-auto h-[76px] w-[52px]">
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(2% 0, 98% 0, 87% 100%, 13% 100%)',
          background: 'linear-gradient(105deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.09))',
        }}
      />
      <div
        className="absolute bottom-0"
        style={{
          left: '13%',
          right: '13%',
          height: fillHeight,
          clipPath: 'polygon(0 0, 100% 0, 94% 100%, 6% 100%)',
          background: `linear-gradient(180deg, oklch(0.72 0.13 ${hue} / 0.85), oklch(0.5 0.12 ${hue} / 0.95))`,
        }}
      />
    </div>
  )
}
