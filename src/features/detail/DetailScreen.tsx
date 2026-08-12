import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dot } from '../../components/Dot'
import { SC } from '../../lib/scopes'
import { useAppStore } from '../../store/useAppStore'

export interface DetailScreenProps {
  taskId: number
  goHome: () => void
}

export function DetailScreen({ taskId, goHome }: DetailScreenProps) {
  const { t } = useTranslation()
  const task = useAppStore((s) => s.tasks.find((candidate) => candidate.id === taskId))
  const updateNotes = useAppStore((s) => s.updateNotes)
  const updateRemind = useAppStore((s) => s.updateRemind)
  const completeTask = useAppStore((s) => s.completeTask)
  const dropTask = useAppStore((s) => s.dropTask)

  useEffect(() => {
    if (!task) goHome()
  }, [task, goHome])

  if (!task) return null

  const scope = SC[task.scope]

  return (
    <div className="flex-1 pt-[66px]" style={{ animation: 'tg-rise 240ms ease-out' }}>
      <div className="flex items-center justify-between">
        <button type="button" onClick={goHome} className="text-15 text-text-muted">
          {t('common.back')}
        </button>
        <div className="text-11 tracking-[1.4px] text-text-muted uppercase">{t(`scopes.${task.scope}`)}</div>
      </div>

      <div className="mt-[30px] flex items-center gap-3.5">
        <Dot hue={scope.hue} diameter={scope.size + 8} />
        <h1
          className="flex-1 font-serif text-32 leading-[1.15] tracking-[-0.3px] text-text-primary"
          style={{ textWrap: 'pretty' }}
        >
          {task.title}
        </h1>
      </div>

      <div className="mt-[34px] text-11 tracking-[1.6px] text-text-faint uppercase">{t('detail.notes')}</div>
      <textarea
        value={task.notes}
        onChange={(e) => updateNotes(task.id, e.target.value)}
        placeholder={t('detail.notesPlaceholder')}
        className="mt-2.5 min-h-24 w-full resize-none rounded-field border border-white/8 bg-white/3.5 p-3.5 font-sans text-15 leading-[1.5] text-text-secondary outline-none box-border"
      />

      <div className="mt-6.5 text-11 tracking-[1.6px] text-text-faint uppercase">{t('detail.reminder')}</div>
      <div className="mt-2.5 flex items-center gap-2.5 rounded-field border border-white/8 bg-white/3.5 px-3.5 py-[13px]">
        <div className="text-15 text-text-muted">◷</div>
        <input
          type="datetime-local"
          value={task.remind}
          onChange={(e) => updateRemind(task.id, e.target.value)}
          className="flex-1 bg-transparent font-sans text-15 text-text-secondary outline-none"
        />
      </div>

      <div className="mt-[38px] flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => {
            completeTask(task.id)
            goHome()
          }}
          className="h-14 rounded-button text-16 font-semibold text-action-text shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] active:scale-[0.98]"
          style={{ background: 'var(--gradient-action)' }}
        >
          {t('detail.complete')}
        </button>
        <button
          type="button"
          onClick={() => {
            dropTask(task.id)
            goHome()
          }}
          className="h-14 rounded-button border border-white/12 text-15 text-action-secondary hover:bg-white/4"
        >
          {t('detail.dropIt')}
        </button>
      </div>
    </div>
  )
}
