import { useEffect, useRef, useState } from 'react'
import { Trash2, ArrowDownToLine } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/cn'
import type { LogLine } from '@shared/types'

const LEVEL_COLOR: Record<LogLine['level'], string> = {
  info: 'text-slate-300',
  warn: 'text-amber-300',
  error: 'text-red-400',
  debug: 'text-slate-500',
  game: 'text-emerald-300'
}

const LEVEL_TAG: Record<LogLine['level'], string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERR ',
  debug: 'DBG ',
  game: 'GAME'
}

export function Console(): JSX.Element {
  const logs = useStore((s) => s.logs)
  const clearLogs = useStore((s) => s.clearLogs)
  const scroller = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll && scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight
    }
  }, [logs, autoScroll])

  function onScroll(): void {
    const el = scroller.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAutoScroll(atBottom)
  }

  return (
    <div className="flex h-full flex-col px-8 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Console</h1>
          <p className="mt-1 text-sm text-slate-400">{logs.length} lignes · journal du lancement et du jeu</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setAutoScroll(true)
              if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
            }}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition',
              autoScroll
                ? 'border-white/10 bg-white/5 text-slate-500'
                : 'accent-border bg-white/5 text-slate-200'
            )}
          >
            <ArrowDownToLine size={16} /> Bas
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
          >
            <Trash2 size={16} /> Effacer
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        onScroll={onScroll}
        className="card min-h-0 flex-1 overflow-y-auto bg-surface-950/80 p-4 font-mono text-xs leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="grid h-full place-items-center text-slate-600">
            En attente du lancement…
          </div>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="flex gap-2 whitespace-pre-wrap break-all">
              <span className="shrink-0 select-none text-slate-600">
                {new Date(l.ts).toLocaleTimeString('fr-FR', { hour12: false })}
              </span>
              <span className={cn('shrink-0 select-none font-semibold', LEVEL_COLOR[l.level])}>
                {LEVEL_TAG[l.level]}
              </span>
              <span className={LEVEL_COLOR[l.level]}>{l.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
