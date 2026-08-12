import { AddScreen } from './features/add/AddScreen'
import { DetailScreen } from './features/detail/DetailScreen'
import { HomeScreen } from './features/home/HomeScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { useAppRouter } from './hooks/useAppRouter'

function App() {
  const { screen, goHome, goAdd, goDetail, goSettings } = useAppRouter()

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
