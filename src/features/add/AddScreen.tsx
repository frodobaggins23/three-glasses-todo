import { useTranslation } from 'react-i18next'
import { MiniGlass } from '../../components/MiniGlass'
import { countOf } from '../../lib/selectors'
import { SCOPES } from '../../lib/scopes'
import { useAppStore } from '../../store/useAppStore'

export interface AddScreenProps {
  goHome: () => void
}

export function AddScreen({ goHome }: AddScreenProps) {
  const { t } = useTranslation()
  const state = useAppStore()
  const { draft, caps, shake, addError } = state

  const handleAdd = () => {
    if (state.tryAddTask()) goHome()
  }

  return (
    <div className="flex-1 pt-[66px]" style={{ animation: 'tg-rise 260ms ease-out' }}>
      <div className="flex items-center justify-between">
        <button type="button" onClick={goHome} className="text-15 text-text-muted">
          {t('add.cancel')}
        </button>
        <button
          type="button"
          onClick={handleAdd}
          className={`text-15 ${draft.title.trim() ? 'text-action-start' : 'text-text-disabled'}`}
        >
          {t('add.add')}
        </button>
      </div>

      <h1 className="mt-[26px] font-serif text-34 tracking-[-0.4px] text-text-primary">{t('add.heading')}</h1>
      <p className="mt-2 text-13 leading-[1.5] text-text-muted">{t('add.subhead')}</p>

      <div className="mt-6 flex gap-2.5">
        {SCOPES.map((s) => {
          const n = countOf(state, s.key)
          const cap = caps[s.key]
          const full = n >= cap
          const active = draft.scope === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => state.selectDraftScope(s.key)}
              className="flex-1 rounded-card px-2 pt-4 pb-3.5 text-left transition-colors duration-150"
              style={{
                border: `1px solid ${active ? 'rgba(240,228,205,0.55)' : 'rgba(255,255,255,0.09)'}`,
                background: active ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.025)',
                opacity: full ? 0.55 : 1,
              }}
            >
              <div className={shake === s.key ? 'animate-tg-shake' : undefined}>
                <MiniGlass hue={s.hue} fillRatio={Math.min(1, n / cap)} />
              </div>
              <div className="mt-3 text-center text-11 tracking-[1.4px] text-text-tertiary uppercase">
                {t(`scopes.${s.key}`)}
              </div>
              <div className="mt-1 text-center text-11.5 text-text-quiet">
                {full ? t('add.full') : `${n}/${cap}`}
              </div>
            </button>
          )
        })}
      </div>

      {addError ? (
        <div className="mt-[18px] rounded-field border border-error-border bg-error-bg px-[15px] py-[13px] text-13.5 leading-[1.45] text-error-text">
          {addError.type === 'glassFull'
            ? t('errors.addGlassFull', { scope: t(`scopes.${addError.scope}`), cap: addError.cap })
            : t('errors.titleRequired')}
        </div>
      ) : null}

      <div className="mt-[26px] border-b border-white/14 pb-2.5">
        <input
          value={draft.title}
          onChange={(e) => state.updateDraftTitle(e.target.value)}
          placeholder={t('add.titlePlaceholder')}
          className="w-full bg-transparent font-serif text-22 text-text-primary outline-none placeholder:text-text-primary/50"
        />
      </div>
      <p className="mt-3.5 text-12.5 text-text-faint">{t('add.footnote')}</p>
    </div>
  )
}
