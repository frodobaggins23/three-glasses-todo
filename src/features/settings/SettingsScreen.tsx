import { useTranslation } from 'react-i18next'
import { Dot } from '../../components/Dot'
import { capHint, countOf } from '../../lib/selectors'
import { SCOPES, SETTINGS_CHIP_DOT_SIZE } from '../../lib/scopes'
import { useAppStore } from '../../store/useAppStore'
import { ExportImportSection } from './ExportImportSection'

export interface SettingsScreenProps {
  goHome: () => void
}

export function SettingsScreen({ goHome }: SettingsScreenProps) {
  const { t } = useTranslation()
  const state = useAppStore()
  const { caps, capNote } = state

  return (
    <div className="flex-1 pt-[66px]" style={{ animation: 'tg-rise 240ms ease-out' }}>
      <button type="button" onClick={goHome} className="text-15 text-text-muted">
        {t('common.back')}
      </button>
      <h1 className="mt-[26px] font-serif text-34 tracking-[-0.4px] text-text-primary">{t('settings.heading')}</h1>
      <p className="mt-2 text-13 leading-[1.5] text-text-muted">{t('settings.subhead')}</p>

      <div className="mt-7 flex flex-col gap-3.5">
        {SCOPES.map((s) => {
          const n = countOf(state, s.key)
          const cap = caps[s.key]
          const floor = Math.max(1, n)
          const atFloor = cap <= floor
          const hint = capHint(n, cap)
          const blocked = capNote === s.key

          return (
            <div key={s.key} className="rounded-card border border-white/8 bg-white/3.5 px-4.5 py-4">
              <div className="flex items-center gap-4">
                <Dot hue={s.hue} diameter={SETTINGS_CHIP_DOT_SIZE[s.key]} />
                <div className="flex-1">
                  <div className="text-16 text-text-secondary">{t(`scopes.${s.key}`)}</div>
                  <div className="mt-[3px] text-12.5 text-text-quiet">
                    {hint.kind === 'spare'
                      ? t('settings.capHintSpare', { count: n, spare: hint.spare })
                      : t('settings.capHintOverLimit', { count: n })}
                  </div>
                </div>
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => state.decCap(s.key)}
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-white/14 text-[19px]"
                    style={{ color: atFloor ? 'var(--color-text-disabled)' : 'var(--color-count-normal)', cursor: atFloor ? 'default' : 'pointer' }}
                  >
                    −
                  </button>
                  <div className="min-w-6.5 text-center font-serif text-24 text-text-primary">{cap}</div>
                  <button
                    type="button"
                    onClick={() => state.incCap(s.key)}
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-white/14 text-[19px] text-count-normal hover:bg-white/6"
                  >
                    +
                  </button>
                </div>
              </div>
              {blocked ? (
                <div className="mt-3 text-12.5 leading-[1.45] text-error-text" style={{ animation: 'tg-rise 200ms ease-out' }}>
                  {t('settings.capBlockedNote', { scope: t(`scopes.${s.key}`).toLowerCase(), count: n })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <ExportImportSection />

      <p className="mt-6 text-12.5 leading-[1.55] text-text-faint">{t('settings.footnote')}</p>
    </div>
  )
}
