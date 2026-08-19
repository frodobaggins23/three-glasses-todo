import { useTranslation } from 'react-i18next'
import type { SortMode } from '../../lib/types'
import { useAppStore } from '../../store/useAppStore'

const SORT_MODES: SortMode[] = ['recent', 'size']

const SORT_LABEL_KEYS: Record<SortMode, { desc: string; asc: string }> = {
  recent: { desc: 'home.sortNewest', asc: 'home.sortOldest' },
  size: { desc: 'home.sortBiggest', asc: 'home.sortSmallest' },
}

export function SortToggle() {
  const { t } = useTranslation()
  const sort = useAppStore((s) => s.sort)
  const sortDir = useAppStore((s) => s.sortDir)
  const setSort = useAppStore((s) => s.setSort)

  return (
    <div className="flex gap-1.5">
      {SORT_MODES.map((mode) => {
        const active = mode === sort
        const isAscending = active && sortDir === 'asc'
        const labelKey = SORT_LABEL_KEYS[mode][isAscending ? 'asc' : 'desc']
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setSort(mode)}
            className={`rounded-pill px-3 py-[5px] text-11 tracking-[1.2px] uppercase transition-colors duration-150 ${
              active ? 'bg-selected-pill text-action-text' : 'bg-white/5 text-text-muted'
            }`}
          >
            {t(labelKey)}
            {active ? <span className="ml-1">{isAscending ? '↑' : '↓'}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
