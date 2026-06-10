import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SkipForward } from 'lucide-react'
import { useStore } from '@/lib/store'
import introUrl from '@/assets/intro.mp4'

const SEEN_KEY = 'introPlayed'
// Filet de sécurité : ne jamais bloquer l'utilisateur derrière l'intro.
const MAX_MS = 30000

export function IntroVideo(): JSX.Element | null {
  const appName = useStore((s) => s.app?.manifest?.branding.appName) ?? 'Zarn'
  // Jouée une seule fois par lancement (sessionStorage survit aux rechargements HMR).
  const [show, setShow] = useState(() => {
    try {
      return sessionStorage.getItem(SEEN_KEY) == null
    } catch {
      return true
    }
  })
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  function finish(): void {
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    setShow(false)
  }

  useEffect(() => {
    if (!show) return
    const v = videoRef.current
    // L'autoplay n'est autorisé que sur une vidéo muette.
    if (v) void v.play().catch(() => undefined)

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish()
    }
    window.addEventListener('keydown', onKey)
    const safety = window.setTimeout(finish, MAX_MS)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(safety)
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={introUrl}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={finish}
            onError={finish}
            onTimeUpdate={(e) => {
              const v = e.currentTarget
              if (v.duration) setProgress((v.currentTime / v.duration) * 100)
            }}
          />

          {/* Voile sombre + vignette pour la lisibilité + ambiance post-apo */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(120% 120% at 50% 45%, transparent 45%, rgba(0,0,0,0.75) 100%)'
            }}
          />
          <div className="grit-overlay" style={{ zIndex: 1 }} />

          {/* Titre + accroche */}
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              {appName}
            </h1>
            <p className="mt-3 text-sm uppercase tracking-[0.35em] text-[var(--accent)] drop-shadow">
              Initialisation du module de survie…
            </p>
          </motion.div>

          {/* Bouton Passer */}
          <button
            onClick={finish}
            className="absolute bottom-7 right-7 z-10 flex items-center gap-2 rounded-md border-2 border-black/50 bg-black/45 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur transition hover:border-[var(--accent)] hover:text-white"
          >
            Passer l'intro <SkipForward size={15} />
          </button>

          {/* Barre de progression encochée (style XP) */}
          <div className="xp-bar absolute inset-x-0 bottom-0 z-10 h-1.5 bg-black/50">
            <motion.div
              className="h-full accent-gradient"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: 'linear' }}
            />
          </div>

          {/* Bande de danger jaune/noir sous la barre */}
          <span className="hazard-stripe pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[3px] opacity-60" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
