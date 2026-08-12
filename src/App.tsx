import { useTranslation } from 'react-i18next'
import { useAppRouter } from './hooks/useAppRouter'

function App() {
  const { t } = useTranslation()
  const { screen, goHome, goAdd, goSettings } = useAppRouter()

  return (
    <div
      className="mx-auto flex min-h-full w-[402px] max-w-full flex-col px-5"
      style={{ background: 'var(--gradient-app-bg)' }}
    >
      {/* Screens are wired up in later steps */}
      <h1 className="pt-16 font-serif text-38 text-text-primary">{t('home.title')}</h1>
      <p className="text-text-muted">current screen: {screen.name}</p>
      <div className="flex gap-2 pt-4">
        <button type="button" onClick={goHome} className="text-text-primary underline">
          home
        </button>
        <button type="button" onClick={goAdd} className="text-text-primary underline">
          add
        </button>
        <button type="button" onClick={goSettings} className="text-text-primary underline">
          settings
        </button>
      </div>
    </div>
  )
}

export default App
