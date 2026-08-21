import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { backupFilename, InvalidBackupError, parseBackup } from '../../lib/backup'
import { useAppStore } from '../../store/useAppStore'

type Status = { kind: 'error'; message: string } | { kind: 'success'; message: string } | null

async function shareOrDownload(file: File): Promise<void> {
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name })
      return
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      // Sharing failed for a reason other than user cancellation — fall through to a plain download.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportImportSection() {
  const { t } = useTranslation()
  const exportBackup = useAppStore((s) => s.exportBackup)
  const restoreBackup = useAppStore((s) => s.restoreBackup)
  const [status, setStatus] = useState<Status>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    const data = exportBackup()
    const filename = backupFilename()
    const file = new File([JSON.stringify(data, null, 2)], filename, { type: 'application/json' })
    await shareOrDownload(file)
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const text = await file.text()
    try {
      const data = parseBackup(text)
      if (!window.confirm(t('settings.backup.confirmReplace', { count: data.tasks.length }))) return
      restoreBackup(data)
      setStatus({ kind: 'success', message: t('settings.backup.importSuccess', { count: data.tasks.length }) })
    } catch (err) {
      const message = err instanceof InvalidBackupError ? err.message : t('settings.backup.importUnknownError')
      setStatus({ kind: 'error', message })
    }
  }

  return (
    <div className="mt-7 rounded-card border border-white/8 bg-white/3.5 px-4.5 py-4">
      <div className="text-16 text-text-secondary">{t('settings.backup.heading')}</div>
      <p className="mt-[3px] text-12.5 leading-[1.5] text-text-quiet">{t('settings.backup.subhead')}</p>

      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={handleExport}
          className="h-10 flex-1 rounded-button border border-white/14 text-[14px] text-text-secondary active:scale-[0.98]"
        >
          {t('settings.backup.export')}
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="h-10 flex-1 rounded-button border border-white/14 text-[14px] text-text-secondary active:scale-[0.98]"
        >
          {t('settings.backup.import')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChosen}
          className="hidden"
        />
      </div>

      {status ? (
        <div
          className="mt-3 text-12.5 leading-[1.45]"
          style={{ color: status.kind === 'error' ? 'var(--color-error-text)' : 'var(--color-text-muted)' }}
        >
          {status.message}
        </div>
      ) : null}
    </div>
  )
}
