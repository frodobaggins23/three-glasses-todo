import { useTranslation } from 'react-i18next'
import { BucketGlyph } from '../../components/BucketGlyph'
import { committedBarGradient } from '../../lib/projectColor'
import type { Project } from '../../lib/types'
import { useAppStore } from '../../store/useAppStore'

export interface BucketCardProps {
  project: Project
  onSpill: (project: Project) => void
}

export function BucketCard({ project, onSpill }: BucketCardProps) {
  const { t } = useTranslation()
  const edit = useAppStore((s) => s.edit)
  const removing = useAppStore((s) => s.removing)
  const isEditing = edit?.id === project.id
  const isRemoving = removing === project.id
  const startEditProject = useAppStore((s) => s.startEditProject)
  const updateEditName = useAppStore((s) => s.updateEditName)
  const updateEditRemaining = useAppStore((s) => s.updateEditRemaining)
  const commitEditProject = useAppStore((s) => s.commitEditProject)
  const removeProject = useAppStore((s) => s.removeProject)

  const remaining = isEditing && edit ? edit.remaining : project.remaining
  const done = !isEditing && project.remaining <= 0
  const displayName = (isEditing ? edit?.name : project.name) || t('pool.untitled')

  return (
    <div
      className={`rounded-card border px-4.5 py-4 transition-colors duration-200 ${
        done ? 'bg-[rgba(243,234,217,0.06)]' : 'bg-white/3.5'
      } ${
        done || isEditing ? 'border-[rgba(240,228,205,0.4)]' : 'border-white/8'
      } ${isRemoving ? 'animate-tg-fold' : ''}`}
    >
      <div className="flex items-center gap-4">
        <BucketGlyph hue={project.hue} remaining={remaining} width={52} height={46} />
        <div className="flex-1">
          <div className="text-16 text-text-secondary" style={{ textWrap: 'pretty' }}>
            {displayName}
          </div>
          <div className="mt-[3px] text-12.5 text-text-quiet">
            {isEditing ? t('pool.editing') : done ? t('pool.emptied') : t('pool.committed', { pct: 100 - remaining })}
          </div>
        </div>
        <div
          className={`font-serif text-24 ${
            done ? 'text-selected-pill' : remaining <= 15 ? 'text-warning' : 'text-count-normal'
          }`}
        >
          {done ? '✓' : `${remaining}%`}
        </div>
      </div>

      <div className="mt-3.5 h-[5px] overflow-hidden rounded-pill bg-white/7">
        <div
          className="h-full rounded-pill transition-[width] duration-[520ms] ease-[cubic-bezier(.4,0,.2,1)]"
          style={{ width: `${100 - remaining}%`, background: committedBarGradient(project.hue) }}
        />
      </div>

      {isEditing && edit ? (
        <div className="mt-4 border-t border-white/7 pt-3.5">
          <div className="text-11 tracking-[1.4px] text-text-faint uppercase">{t('pool.name')}</div>
          <input
            value={edit.name}
            onChange={(e) => updateEditName(e.target.value)}
            placeholder={t('pool.namePlaceholder')}
            className="mt-2 w-full border-0 border-b border-white/14 bg-transparent pb-2 font-serif text-22 text-text-primary outline-none placeholder:text-text-primary/50"
          />
          <div className="mt-[18px] flex items-baseline justify-between">
            <div className="text-11 tracking-[1.4px] text-text-faint uppercase">{t('pool.remaining')}</div>
            <div className="font-serif text-22 text-text-primary">{edit.remaining}%</div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={edit.remaining}
            onChange={(e) => updateEditRemaining(Number(e.target.value))}
            className="tg-slider mt-2.5 w-full"
          />
          <div className="mt-4 flex gap-2.5">
            <button
              type="button"
              onClick={() => removeProject(project.id)}
              className="h-[38px] flex-1 rounded-button border border-error-border text-[14px] text-error-text hover:bg-error-bg"
            >
              {t('pool.drop')}
            </button>
            <button
              type="button"
              onClick={commitEditProject}
              className="h-[38px] flex-1 rounded-button text-[14px] font-semibold text-action-text shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
              style={{ background: 'var(--gradient-action)' }}
            >
              {t('pool.done')}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3.5 flex gap-2.5">
          <button
            type="button"
            onClick={() => (done ? removeProject(project.id) : onSpill(project))}
            className="h-[38px] flex-1 rounded-button text-[14px] font-semibold text-action-text shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            style={{ background: 'var(--gradient-action)' }}
          >
            {done ? t('pool.clear') : t('pool.spill')}
          </button>
          <button
            type="button"
            onClick={() => startEditProject(project.id)}
            className="h-[38px] w-11 rounded-button border border-white/12 text-[14px] text-action-secondary hover:bg-white/4"
          >
            ✎
          </button>
        </div>
      )}
    </div>
  )
}
