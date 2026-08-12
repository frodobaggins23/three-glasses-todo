export type Screen =
  | { name: 'home' }
  | { name: 'add' }
  | { name: 'detail'; id: number }
  | { name: 'settings' }

export function parseScreen(pathname: string): Screen {
  if (pathname === '/add') return { name: 'add' }
  if (pathname === '/settings') return { name: 'settings' }
  const detailMatch = pathname.match(/^\/task\/(\d+)$/)
  if (detailMatch) return { name: 'detail', id: Number(detailMatch[1]) }
  return { name: 'home' }
}

export function pathForScreen(screen: Screen): string {
  switch (screen.name) {
    case 'add':
      return '/add'
    case 'settings':
      return '/settings'
    case 'detail':
      return `/task/${screen.id}`
    case 'home':
      return '/'
  }
}
