import { AnimatePresence, motion } from 'framer-motion'
import { achievementById } from '@shared/achievements'
import { useStore } from '@/lib/store'

export function AchievementPopup(): JSX.Element {
  const ids = useStore((s) => s.newAchievements)
  const dismiss = useStore((s) => s.dismissAchievements)
  const items = (ids ?? []).map(achievementById).filter(Boolean)

  return (
    <AnimatePresence>
      {ids && items.length > 0 && (
        <motion.div
          className="fixed left-1/2 top-6 z-[65] w-[340px] -translate-x-1/2"
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          onClick={dismiss}
        >
          <div className="card overflow-hidden border-amber-400/30 bg-surface-900/95 p-0 shadow-2xl">
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-300/5 px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-amber-300">
              {items.length > 1 ? `${items.length} succès débloqués !` : 'Succès débloqué !'}
            </div>
            <div className="divide-y divide-white/5">
              {items.map((a) => (
                <div key={a!.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-2xl">
                    {a!.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-white">{a!.name}</div>
                    <div className="truncate text-xs text-slate-400">{a!.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
