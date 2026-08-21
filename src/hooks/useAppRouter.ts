import { useCallback, useEffect, useState } from 'react'
import { parseScreen, pathForScreen, type Screen } from '../lib/routing'

export interface AppRouter {
  screen: Screen
  goHome: () => void
  goAdd: () => void
  goDetail: (id: number) => void
  goSettings: () => void
  goPool: () => void
}

/**
 * Syncs the current screen to browser history via pushState/popstate so the
 * back gesture works, without pulling in a router dependency for 4 screens.
 */
export function useAppRouter(): AppRouter {
  const [screen, setScreen] = useState<Screen>(() => parseScreen(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setScreen(parseScreen(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((next: Screen) => {
    const path = pathForScreen(next)
    if (path !== window.location.pathname) {
      window.history.pushState(null, '', path)
    }
    setScreen(next)
  }, [])

  const goHome = useCallback(() => navigate({ name: 'home' }), [navigate])
  const goAdd = useCallback(() => navigate({ name: 'add' }), [navigate])
  const goDetail = useCallback((id: number) => navigate({ name: 'detail', id }), [navigate])
  const goSettings = useCallback(() => navigate({ name: 'settings' }), [navigate])
  const goPool = useCallback(() => navigate({ name: 'pool' }), [navigate])

  return { screen, goHome, goAdd, goDetail, goSettings, goPool }
}
