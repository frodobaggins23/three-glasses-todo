import { HomeScreen } from './features/home/HomeScreen'
import { useAppRouter } from './hooks/useAppRouter'

function App() {
  const { goAdd, goDetail, goSettings } = useAppRouter()

  return (
    <div
      className="mx-auto flex min-h-full w-[402px] max-w-full flex-col px-5"
      style={{ background: 'var(--gradient-app-bg)' }}
    >
      <HomeScreen goAdd={goAdd} goDetail={goDetail} goSettings={goSettings} />
    </div>
  )
}

export default App
