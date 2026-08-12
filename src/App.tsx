import { useTranslation } from 'react-i18next'

function App() {
  const { t } = useTranslation()

  return (
    <div
      className="mx-auto flex min-h-full w-[402px] max-w-full flex-col px-5"
      style={{ background: 'var(--gradient-app-bg)' }}
    >
      {/* Screens are wired up in later steps */}
      <h1 className="pt-16 font-serif text-38 text-text-primary">{t('home.title')}</h1>
    </div>
  )
}

export default App
