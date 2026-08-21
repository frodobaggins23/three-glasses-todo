import { useTranslation } from 'react-i18next'
import { BucketGlyph } from '../../components/BucketGlyph'
import { MiniGlass } from '../../components/MiniGlass'
import { countOf } from '../../lib/selectors'
import { DRAIN_STEP, SCOPES } from '../../lib/scopes'
import { useAppStore } from '../../store/useAppStore'

function DrainButton({ symbol, onClick, disabled }: { symbol: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/14 text-[19px] text-count-normal disabled:cursor-default disabled:text-text-disabled"
    >
      {symbol}
    </button>
  )
}

export interface AddScreenProps {
  goHome: () => void
}

export function AddScreen({ goHome }: AddScreenProps) {
  const { t } = useTranslation()
  const state = useAppStore()
  const { draft, caps, shake, addError, projects } = state
  const project = projects.find((p) => p.id === draft.projectId) ?? null

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

      {project ? (
        <div className="mt-5 rounded-field border border-white/10 bg-white/4 px-[15px] py-3.5">
          <div className="flex items-center gap-3">
            <BucketGlyph hue={project.hue} remaining={project.remaining} width={34} height={30} borderRadius={5} />
            <div className="flex-1">
              <div className="text-11 tracking-[1.4px] text-text-faint uppercase">{t('spill.from')}</div>
              <div className="mt-[3px] text-15 text-text-secondary">{project.name || t('pool.untitled')}</div>
            </div>
            <button
              type="button"
              onClick={state.detachProject}
              className="text-12 whitespace-nowrap text-text-muted"
            >
              {t('spill.detach')}
            </button>
          </div>
          <div className="mt-3.5 flex items-center gap-3 border-t border-white/7 pt-3.5">
            <div className="flex-1">
              <div className="text-12.5 text-text-quiet">{t('spill.drainBy')}</div>
              <div className="mt-0.5 text-12.5 text-text-muted">
                {t('spill.preview', {
                  before: project.remaining,
                  after: Math.max(0, project.remaining - draft.drainPct),
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DrainButton
                symbol="−"
                onClick={() => state.setDrainPct(draft.drainPct - DRAIN_STEP)}
                disabled={draft.drainPct <= 0}
              />
              <div className="min-w-[52px] text-center font-serif text-24 text-text-primary">
                {draft.drainPct}%
              </div>
              <DrainButton
                symbol="+"
                onClick={() => state.setDrainPct(draft.drainPct + DRAIN_STEP)}
                disabled={draft.drainPct >= project.remaining}
              />
            </div>
          </div>
        </div>
      ) : null}

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
