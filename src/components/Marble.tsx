import type { MouseEvent } from 'react'

export interface MarbleProps {
  diameter: number
  left: number
  top: number
  background: string
  animation?: string
  onClick?: () => void
}

/** A single packed marble — ported from Component.layout()'s per-marble style object. */
export function Marble({ diameter, left, top, background, animation, onClick }: MarbleProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onClick?.()
  }

  return (
    <div
      onClick={onClick ? handleClick : undefined}
      style={{
        cursor: onClick ? 'pointer' : undefined,
        position: 'absolute',
        width: diameter,
        height: diameter,
        borderRadius: diameter,
        left,
        top,
        background,
        boxShadow: 'var(--shadow-marble)',
        transition:
          'width 420ms cubic-bezier(.4,0,.2,1), height 420ms cubic-bezier(.4,0,.2,1), left 420ms cubic-bezier(.4,0,.2,1), top 420ms cubic-bezier(.4,0,.2,1)',
        animation,
      }}
    />
  )
}
