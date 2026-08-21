import { useTranslation } from 'react-i18next'
import type { Project } from '../../lib/types'
import { useAppStore } from '../../store/useAppStore'
import { BucketCard } from './BucketCard'

export interface PoolScreenProps {
  goHome: () => void
  goAdd: () => void
}

export function PoolScreen({ goHome, goAdd }: PoolScreenProps) {
  const { t } = useTranslation()
  const projects = useAppStore((s) => s.projects)
  const addProject = useAppStore((s) => s.addProject)
  const startSpill = useAppStore((s) => s.startSpill)

  const handleSpill = (project: Project) => {
    startSpill(project.id)
    goAdd()
  }

  return (
    <div className="flex-1 pt-[66px]" style={{ animation: 'tg-rise 240ms ease-out' }}>
      <button type="button" onClick={goHome} className="text-15 text-text-muted">
        {t('common.back')}
      </button>
      <h1 className="mt-[26px] font-serif text-34 tracking-[-0.4px] text-text-primary">{t('pool.title')}</h1>
      <p className="mt-2 text-13 leading-[1.5] text-text-muted">{t('pool.subhead')}</p>

      <div className="mt-7 flex flex-col gap-3.5">
        {projects.map((project) => (
          <BucketCard
            key={project.id}
            project={project}
            onSpill={handleSpill}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addProject}
        className="mt-3.5 w-full rounded-card border border-dashed border-white/16 py-[15px] text-center text-13 text-text-tertiary hover:bg-white/4"
      >
        {t('pool.new')}
      </button>

      <p className="mt-5.5 text-12.5 leading-[1.55] text-text-faint">{t('pool.footnote')}</p>
      <div className="h-[60px]" />
    </div>
  )
}
