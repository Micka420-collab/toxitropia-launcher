import { Clock, Flame, Rocket, Trophy, Timer, CalendarDays, Lock } from 'lucide-react'
import { useStore } from '@/lib/store'
import { ACHIEVEMENTS } from '@shared/achievements'
import { cn } from '@/lib/cn'

function fmtDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h >= 24) {
    const d = Math.floor(h / 24)
    return `${d} j ${h % 24} h`
  }
  if (h >= 1) return `${h} h ${m.toString().padStart(2, '0')} min`
  return `${m} min`
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return '—'
  }
}

export function Stats(): JSX.Element {
  const stats = useStore((s) => s.app?.stats)

  if (!stats) return <div className="p-8 text-slate-500">Chargement…</div>

  const unlocked = new Set(stats.achievements)
  const tiles = [
    {
      icon: Clock,
      label: 'Temps de jeu total',
      value: fmtDuration(stats.totalMs),
      tint: 'text-emerald-400'
    },
    {
      icon: Flame,
      label: 'Série en cours',
      value: `${stats.streakDays} ${stats.streakDays > 1 ? 'jours' : 'jour'}`,
      tint: 'text-orange-400'
    },
    {
      icon: Timer,
      label: 'Plus longue session',
      value: fmtDuration(stats.longestSessionMs),
      tint: 'text-sky-400'
    },
    {
      icon: Rocket,
      label: 'Lancements',
      value: String(stats.launches),
      tint: 'text-violet-400'
    },
    {
      icon: Trophy,
      label: 'Succès débloqués',
      value: `${unlocked.size} / ${ACHIEVEMENTS.length}`,
      tint: 'text-amber-400'
    },
    {
      icon: CalendarDays,
      label: 'Premier lancement',
      value: fmtDate(stats.firstLaunchAt),
      tint: 'text-slate-300'
    }
  ]

  const pct = Math.round((unlocked.size / ACHIEVEMENTS.length) * 100)

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-white">Statistiques & succès</h1>
      <p className="mt-1 text-sm text-slate-400">Ton parcours sur le serveur, suivi en local.</p>

      {/* Tuiles de stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {tiles.map(({ icon: Icon, label, value, tint }) => (
          <div key={label} className="card flex items-center gap-3.5 p-4">
            <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5', tint)}>
              <Icon size={20} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-lg font-bold text-white">{value}</div>
              <div className="truncate text-xs text-slate-400">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progression des succès */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
          <Trophy size={15} /> Succès
        </h2>
        <span className="text-xs text-slate-500">{pct}% complété</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full accent-gradient transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.has(a.id)
          return (
            <div
              key={a.id}
              className={cn(
                'card flex items-center gap-3.5 p-4 transition',
                got ? 'border-amber-400/30 bg-amber-400/[0.04]' : 'opacity-60'
              )}
            >
              <span
                className={cn(
                  'relative grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl',
                  got ? 'bg-amber-400/15' : 'bg-white/5 grayscale'
                )}
              >
                {a.icon}
                {!got && (
                  <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-surface-800 bg-surface-700 text-slate-400">
                    <Lock size={11} />
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <div className={cn('truncate font-bold', got ? 'text-white' : 'text-slate-300')}>
                  {a.name}
                </div>
                <div className="truncate text-xs text-slate-400">{a.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
