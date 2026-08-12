import { AddScreen } from './features/add/AddScreen'
import { DetailScreen } from './features/detail/DetailScreen'
import { HomeScreen } from './features/home/HomeScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { useAppRouter } from './hooks/useAppRouter'

function App() {
  const { screen, goHome, goAdd, goDetail, goSettings } = useAppRouter()

  // Known gap: viewports narrower than 402px (many Android phones at 360px,
  // iPhone SE at 375px) will clip the third glass or force horizontal
  // scroll — Glass is hard-coded to 106px (tied to the packing algorithm's
  // coordinate space) and nothing shrinks it below that. Flagged, not fixed.
  return (
    <div
      className="mx-auto flex min-h-full w-[402px] max-w-full flex-col px-5"
      style={{ background: 'var(--gradient-app-bg)' }}
    >
      {screen.name === 'home' ? <HomeScreen goAdd={goAdd} goDetail={goDetail} goSettings={goSettings} /> : null}
      {screen.name === 'add' ? <AddScreen goHome={goHome} /> : null}
      {screen.name === 'detail' ? <DetailScreen taskId={screen.id} goHome={goHome} /> : null}
      {screen.name === 'settings' ? <SettingsScreen goHome={goHome} /> : null}
    </div>
  )
}

export default App
