import { useTranslation } from 'react-i18next'
import { Dot } from '../../components/Dot'
import { Glass } from '../../components/Glass'
import { layoutMarbles } from '../../lib/marbleLayout'
import { anyGlassFull, countLevel, countOf, sortedTasks, totalMarbles } from '../../lib/selectors'
import { SC, SCOPES, type ScopeKey } from '../../lib/scopes'
import { useAppStore } from '../../store/useAppStore'
import { SortToggle } from './SortToggle'

const COUNT_LEVEL_CLASS: Record<ReturnType<typeof countLevel>, string> = {
  normal: 'text-count-normal',
  warning: 'text-warning',
  full: 'text-error-text',
}

export interface HomeScreenProps {
  goAdd: () => void
  goDetail: (id: number) => void
  goSettings: () => void
}

export function HomeScreen({ goAdd, goDetail, goSettings }: HomeScreenProps) {
  const { t } = useTranslation()
  const state = useAppStore()
  const { tasks, caps, fx, shown, shake, homeError } = state

  const total = totalMarbles(state)
  const full = anyGlassFull(state)
  const sorted = sortedTasks(state)
  const visible = sorted.slice(0, shown)
  const hasMore = shown < sorted.length
  const moreCount = Math.min(5, sorted.length - shown)

  const handleGlassTap = (scope: ScopeKey) => {
    if (state.tapGlass(scope) === 'ok') goAdd()
  }

  return (
    <div className="relative flex-1 pt-[66px]">
      <div className="mb-1 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-38 leading-[1.05] tracking-[-0.5px] text-text-primary">
            {t('home.title')}
          </h1>
          <p className="mt-1.5 text-13 tracking-[0.2px] text-text-muted">
            {t('home.marblesInPlay', { count: total })}
            {full ? ` · ${t('home.aGlassIsFull')}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={goSettings}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-[17px] text-icon-muted hover:bg-white/6"
        >
          ⚙
        </button>
      </div>

      <div className="mt-[26px] flex justify-between gap-2">
        {SCOPES.map((s) => {
          const list = tasks.filter((t) => t.scope === s.key).sort((a, b) => a.t - b.t)
          const n = countOf(state, s.key)
          const cap = caps[s.key]
          const marbles = layoutMarbles(
            s.hue,
            list.map((t) => ({ id: t.id, fx: fx[t.id] })),
            cap,
          )
          return (
            <div key={s.key} className="flex flex-1 flex-col items-center">
              <Glass marbles={marbles} shaking={shake === s.key} onMarbleTap={goDetail} />
              <button
                type="button"
                onClick={() => handleGlassTap(s.key)}
                className="mt-3.5 text-center"
              >
                <div className="text-11 tracking-[1.6px] text-text-muted uppercase">{t(`scopes.${s.key}`)}</div>
                <div className={`mt-[3px] font-serif text-22 ${COUNT_LEVEL_CLASS[countLevel(n, cap)]}`}>
                  {n}/{cap}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {homeError ? (
        <div className="animate-tg-rise mt-[22px] flex items-start gap-3 rounded-field border border-error-border bg-error-bg px-[15px] py-[13px] text-13.5 leading-[1.45] text-error-text">
          <div className="flex-1" style={{ textWrap: 'pretty' }}>
            {homeError.type === 'glassFull'
              ? t('errors.homeGlassFull', { scope: t(`scopes.${homeError.scope}`), cap: homeError.cap })
              : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <button type="button" onClick={goSettings} className="text-12 whitespace-nowrap text-error-link underline">
              {t('home.limits')}
            </button>
            <button type="button" onClick={state.dismissHomeError} className="text-12 text-error-secondary">
              {t('home.dismiss')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-[30px] flex items-center justify-between gap-3">
        <div className="text-11 tracking-[1.6px] text-text-faint uppercase">{t('home.recent')}</div>
        <SortToggle />
      </div>

      <div className="mt-2.5 flex flex-col gap-px">
        {visible.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => goDetail(task.id)}
            className="flex items-center gap-3 border-b border-white/6 px-1 py-[13px] text-left hover:bg-white/3"
          >
            <Dot hue={SC[task.scope].hue} diameter={12} />
            <div className="flex-1 text-15.5 text-text-secondary" style={{ textWrap: 'pretty' }}>
              {task.title}
            </div>
            <div className="text-11 tracking-[1.2px] text-text-faint uppercase">{t(`scopes.${task.scope}`)}</div>
          </button>
        ))}
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={state.showMore}
          className="mt-3.5 w-full rounded-field border border-white/10 py-[11px] text-center text-13 text-text-tertiary hover:bg-white/5"
        >
          {t('home.showMore', { count: moreCount })}
        </button>
      ) : null}

      <div className="h-[130px]" />

      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 h-[150px]"
        style={{ background: 'linear-gradient(180deg, rgba(15,14,13,0) 0%, var(--color-app-end) 55%)' }}
      />
      <button
        type="button"
        onClick={() => {
          state.resetDraftForNewAdd()
          goAdd()
        }}
        className="absolute bottom-[52px] left-1/2 flex h-[66px] w-[66px] -translate-x-1/2 items-center justify-center rounded-full text-34 font-light text-action-text shadow-fab active:scale-[0.94]"
        style={{ background: 'var(--gradient-action)' }}
      >
        +
      </button>
    </div>
  )
}
