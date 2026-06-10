import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, FolderOpen, RefreshCw, Trash2, Maximize2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Button, Spinner } from '@/components/ui'
import type { Screenshot } from '@shared/types'

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`
}

function shotUrl(name: string): string {
  return `shot://img/${encodeURIComponent(name)}`
}

export function Screenshots(): JSX.Element {
  const setToast = useStore((s) => s.setToast)
  const [shots, setShots] = useState<Screenshot[] | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      setShots(await window.api.listScreenshots())
    } catch {
      setShots([])
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function remove(name: string): Promise<void> {
    try {
      setShots(await window.api.deleteScreenshot(name))
      setToast({ kind: 'ok', text: 'Capture supprimée' })
    } catch {
      setToast({ kind: 'err', text: 'Suppression impossible' })
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <ImageIcon size={22} className="accent-text" /> Galerie
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Tes captures d&apos;écran (touche F2 en jeu) — {shots?.length ?? 0} image
            {(shots?.length ?? 0) > 1 ? 's' : ''}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void window.api.openFolder('screenshots')}>
            <FolderOpen size={16} /> Dossier
          </Button>
          <Button variant="outline" onClick={() => void refresh()} disabled={busy}>
            {busy ? <Spinner /> : <RefreshCw size={16} />} Actualiser
          </Button>
        </div>
      </div>

      {shots === null ? (
        <div className="grid place-items-center py-24 text-slate-500">
          <Spinner className="h-7 w-7" />
        </div>
      ) : shots.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <ImageIcon size={40} className="text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-300">Aucune capture pour l&apos;instant</p>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Appuie sur <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">F2</kbd> en jeu
            pour prendre une capture — elle apparaîtra ici.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shots.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.3) }}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-surface-850"
            >
              <button
                onClick={() => void window.api.openScreenshot(s.name)}
                className="block aspect-video w-full overflow-hidden"
                title="Ouvrir en grand"
              >
                <img
                  src={shotUrl(s.name)}
                  alt={s.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                  <Maximize2 size={22} className="text-white drop-shadow" />
                </span>
              </button>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-slate-300" title={s.name}>
                    {s.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {fmtDate(s.mtimeMs)} · {fmtSize(s.sizeBytes)}
                  </p>
                </div>
                <button
                  onClick={() => void remove(s.name)}
                  title="Supprimer"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/20 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
