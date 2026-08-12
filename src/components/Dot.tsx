import { dotStyle } from '../lib/marbleColor'

export interface DotProps {
  hue: number
  diameter: number
}

/** Small static scope indicator — glass caption chips, recent-list rows, settings cards. */
export function Dot({ hue, diameter }: DotProps) {
  return <div style={dotStyle(hue, diameter)} />
}
