export type Screen =
  | { name: 'home' }
  | { name: 'add' }
  | { name: 'detail'; id: number }
  | { name: 'settings' }
  | { name: 'pool' }

// The app is deployed under a sub-path (e.g. /three-glasses/), configured via
// Vite's `base`. Routes must be built and parsed relative to that base so
// pushState keeps the prefix and a hard refresh on a deep link round-trips.
export function parseScreen(pathname: string, base: string = import.meta.env.BASE_URL): Screen {
  const relative = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\//, '')
  if (relative === 'add') return { name: 'add' }
  if (relative === 'settings') return { name: 'settings' }
  if (relative === 'pool') return { name: 'pool' }
  const detailMatch = relative.match(/^task\/(\d+)$/)
  if (detailMatch) return { name: 'detail', id: Number(detailMatch[1]) }
  return { name: 'home' }
}

export function pathForScreen(screen: Screen, base: string = import.meta.env.BASE_URL): string {
  switch (screen.name) {
    case 'add':
      return `${base}add`
    case 'settings':
      return `${base}settings`
    case 'pool':
      return `${base}pool`
    case 'detail':
      return `${base}task/${screen.id}`
    case 'home':
      return base
  }
}
