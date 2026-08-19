import { fitSize, pack } from './marblePacking'
import { jitterForTaskId, marbleBg } from './marbleColor'

export type MarbleFx = 'pop' | 'sink' | 'new'

export interface MarbleLayoutInput {
  id: number
  title: string
  fx?: MarbleFx
}

export interface MarbleLayoutResult {
  id: number
  title: string
  diameter: number
  left: number
  top: number
  background: string
  animation: string | undefined
}

const ANIMATION_BY_FX: Record<MarbleFx, string> = {
  pop: 'tg-pop 320ms ease-in forwards',
  sink: 'tg-sink 420ms ease-in forwards',
  new: 'tg-drop 520ms cubic-bezier(.3,1.4,.5,1)',
}

/** Ported from Component.layout() in the prototype. Assigns each task a packed position and its fx animation, if any. */
export function layoutMarbles(hue: number, tasks: MarbleLayoutInput[], cap: number): MarbleLayoutResult[] {
  const d = fitSize(Math.max(cap, tasks.length))
  const pts = pack(d, tasks.length).pts

  const results: MarbleLayoutResult[] = []
  for (let i = 0; i < tasks.length; i++) {
    const p = pts[i]
    if (!p) continue
    const t = tasks[i]
    results.push({
      id: t.id,
      title: t.title,
      diameter: d,
      left: p.x - d / 2,
      top: p.y - d / 2,
      background: marbleBg(hue, jitterForTaskId(t.id)),
      animation: t.fx ? ANIMATION_BY_FX[t.fx] : undefined,
    })
  }
  return results
}
