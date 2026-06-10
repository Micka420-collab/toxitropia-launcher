import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'

interface Burst {
  id: number
  dx: number
  dy: number
  size: number
}

interface Props {
  onClick: () => void
  label: string
  disabled?: boolean
}

/** Bouton JOUER 3D : inclinaison au survol (parallaxe), halo dynamique,
 *  reflet balayant et explosion de particules au clic. */
export function Play3DButton({ onClick, label, disabled = false }: Props): JSX.Element {
  const ref = useRef<HTMLButtonElement>(null)
  const [bursts, setBursts] = useState<Burst[]>([])
  const seq = useRef(0)

  // Position du pointeur normalisée (-0.5 .. 0.5) → inclinaison 3D.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [12, -12]), { stiffness: 220, damping: 18 })
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-16, 16]), { stiffness: 220, damping: 18 })
  // Halo qui suit le pointeur.
  const glowX = useTransform(px, [-0.5, 0.5], ['25%', '75%'])
  const glowY = useTransform(py, [-0.5, 0.5], ['25%', '75%'])

  const onMove = (e: ReactPointerEvent<HTMLButtonElement>): void => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }

  const reset = (): void => {
    px.set(0)
    py.set(0)
  }

  const handleClick = (): void => {
    if (disabled) return
    // Explosion de 18 particules vers l'extérieur.
    const next: Burst[] = Array.from({ length: 18 }, () => {
      const a = Math.random() * Math.PI * 2
      const dist = 60 + Math.random() * 90
      return {
        id: seq.current++,
        dx: Math.cos(a) * dist,
        dy: Math.sin(a) * dist,
        size: 4 + Math.random() * 6
      }
    })
    setBursts((b) => [...b, ...next])
    const ids = new Set(next.map((n) => n.id))
    window.setTimeout(() => setBursts((b) => b.filter((x) => !ids.has(x.id))), 750)
    onClick()
  }

  return (
    <div className="relative" style={{ perspective: 900 }}>
      <motion.button
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        onClick={handleClick}
        disabled={disabled}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileTap={{ scale: 0.96 }}
        className="group relative flex h-16 items-center gap-3 overflow-hidden rounded-2xl accent-gradient px-10 text-xl font-black uppercase tracking-wide text-white shadow-glow transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {/* Halo dynamique sous le pointeur */}
        <motion.span
          className="pointer-events-none absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-2xl"
          style={{ left: glowX, top: glowY }}
        />
        {/* Profondeur 3D : icône + texte légèrement en avant */}
        <span style={{ transform: 'translateZ(28px)' }} className="relative flex items-center gap-3">
          <Play size={26} fill="currentColor" />
          {label}
        </span>
        {/* Reflet balayant */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {/* Liseré interne */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25" />
      </motion.button>

      {/* Particules au clic */}
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.span
            key={b.id}
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full accent-bg"
            style={{ width: b.size, height: b.size }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: b.dx, y: b.dy, opacity: 0, scale: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
