import { useState } from 'react'
import type { MarbleLayoutResult } from '../lib/marbleLayout'
import { Marble } from './Marble'

export interface GlassProps {
  marbles: MarbleLayoutResult[]
  shaking?: boolean
}

/** The 106x206 tumbler glass with procedural highlights — ported from the prototype's per-glass markup. */
export function Glass({ marbles, shaking }: GlassProps) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const active = marbles.find((m) => m.id === activeId)

  return (
    <div className={shaking ? 'animate-tg-shake' : undefined}>
      <div className="relative h-[206px] w-[106px]" onClick={() => setActiveId(null)}>
        <div
          className="absolute inset-0"
          style={{
            clipPath: 'polygon(2% 0, 98% 0, 88% 100%, 12% 100%)',
            borderRadius: '2px 2px 12px 12px',
            background:
              'linear-gradient(105deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.03) 22%, rgba(255,255,255,0.015) 60%, rgba(255,255,255,0.09) 100%)',
          }}
        />
        <div
          className="absolute overflow-hidden"
          style={{ inset: '4px 5px 6px', clipPath: 'polygon(2% 0, 98% 0, 87% 100%, 13% 100%)' }}
        >
          {marbles.map((m) => (
            <Marble
              key={m.id}
              diameter={m.diameter}
              left={m.left}
              top={m.top}
              background={m.background}
              animation={m.animation}
              onClick={() => setActiveId((current) => (current === m.id ? null : m.id))}
            />
          ))}
        </div>
        {active ? (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[180px] rounded-pill bg-black/80 px-2.5 py-1 text-center text-11.5 text-white shadow-lg"
            style={{
              left: active.left + active.diameter / 2 + 5,
              top: active.top + 4 - 8,
              transform: 'translate(-50%, -100%)',
              textWrap: 'balance',
            }}
          >
            {active.title}
          </div>
        ) : null}
        {/* left specular highlight */}
        <div
          className="absolute"
          style={{
            left: 9,
            top: 8,
            bottom: 16,
            width: 7,
            borderRadius: 6,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.05))',
            filter: 'blur(2.5px)',
            opacity: 0.65,
          }}
        />
        {/* right thin highlight */}
        <div
          className="absolute"
          style={{
            right: 12,
            top: 26,
            bottom: 34,
            width: 3,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.35)',
            filter: 'blur(2px)',
            opacity: 0.5,
          }}
        />
        {/* rim ellipse */}
        <div
          className="absolute"
          style={{
            left: '2%',
            right: '2%',
            top: 0,
            height: 8,
            borderRadius: '50%/60%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.08))',
            opacity: 0.5,
          }}
        />
        {/* base ellipse */}
        <div
          className="absolute"
          style={{
            left: '12%',
            right: '12%',
            bottom: 0,
            height: 9,
            borderRadius: '50%/70%',
            background: 'radial-gradient(60% 100% at 50% 0%, rgba(255,255,255,0.22), rgba(255,255,255,0.02))',
          }}
        />
      </div>
    </div>
  )
}
