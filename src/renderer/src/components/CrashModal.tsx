import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Wrench, FolderOpen, FileText, X, Stethoscope } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/cn'

const SEVERITY: Record<string, { ring: string; chip: string; label: string }> = {
  critical: { ring: 'border-red-500/40', chip: 'bg-red-500/15 text-red-300', label: 'Critique' },
  warning: { ring: 'border-amber-500/40', chip: 'bg-amber-500/15 text-amber-300', label: 'Avertissement' },
  info: { ring: 'border-sky-500/40', chip: 'bg-sky-500/15 text-sky-300', label: 'Info' }
}

export function CrashModal(): JSX.Element {
  const crash = useStore((s) => s.crash)
  const dismiss = useStore((s) => s.dismissCrash)
  const setToast = useStore((s) => s.setToast)

  const sev = crash ? (SEVERITY[crash.severity] ?? SEVERITY.warning) : SEVERITY.warning

  const applyFix = async (): Promise<void> => {
    if (!crash?.fix) return
    if (crash.fix.kind === 'setRam') {
      await window.api.setSettings({ ramMb: crash.fix.ramMb })
      setToast({ kind: 'ok', text: `RAM ajustée à ${crash.fix.ramMb} Mo` })
      dismiss()
    } else if (crash.fix.kind === 'openGameDir') {
      await window.api.openGameDir()
    } else if (crash.fix.kind === 'openLog') {
      await window.api.openLog()
    }
  }

  const fixLabel =
    crash?.fix?.kind === 'setRam'
      ? 'Corriger automatiquement'
      : crash?.fix?.kind === 'openGameDir'
        ? 'Ouvrir le dossier du jeu'
        : crash?.fix?.kind === 'openLog'
          ? 'Ouvrir le rapport'
          : null

  return (
    <AnimatePresence>
      {crash && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            className={cn(
              'card relative w-full max-w-lg border bg-surface-900/95 p-0 shadow-2xl',
              sev.ring
            )}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={dismiss}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4 p-6 pb-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-400">
                <Stethoscope size={24} />
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Assistant anti-crash
                  </span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', sev.chip)}>
                    {sev.label}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">{crash.title}</h2>
              </div>
            </div>

            <div className="space-y-4 px-6 pb-2">
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <AlertTriangle size={13} /> Cause probable
                </div>
                <p className="text-sm leading-relaxed text-slate-200">{crash.cause}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <Wrench size={13} /> Solution
                </div>
                <p className="text-sm leading-relaxed text-slate-200">{crash.solution}</p>
              </div>

              {crash.logExcerpt && (
                <details className="group rounded-xl border border-white/10 bg-black/30">
                  <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200">
                    Détails techniques
                  </summary>
                  <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-words px-3 pb-3 text-[11px] leading-relaxed text-slate-400">
                    {crash.logExcerpt}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/5 p-4">
              <button
                onClick={() => void window.api.openLog()}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
              >
                <FileText size={14} /> Voir le journal
              </button>
              <button
                onClick={() => void window.api.openGameDir()}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
              >
                <FolderOpen size={14} /> Dossier du jeu
              </button>
              {fixLabel && (
                <button
                  onClick={() => void applyFix()}
                  className="flex items-center gap-1.5 rounded-lg accent-gradient px-4 py-2 text-xs font-bold text-white shadow-glow hover:brightness-110"
                >
                  <Wrench size={14} /> {fixLabel}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
