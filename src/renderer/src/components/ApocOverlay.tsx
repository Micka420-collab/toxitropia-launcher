import { useMemo } from 'react'

/**
 * Couche d'ambiance « Apocalypse Tropicale » globale et permanente :
 * vignette radioactive + scanlines CRT + grain de film + cendres qui tombent
 * et spores toxiques qui dérivent. 100 % décoratif.
 *
 * z-index 54 = juste SOUS .grit-overlay (55) et toutes les modales
 * (toast 60, achievement 65, crash 70, seasonal 80, intro 100).
 * pointer-events-none : ne bloque jamais les clics. Aucune dépendance aux pages.
 */
export function ApocOverlay(): JSX.Element {
  const ash = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: -Math.random() * 16,
        duration: 11 + Math.random() * 12,
        drift: `${(Math.random() * 2 - 1) * 60}px`,
        op: 0.1 + Math.random() * 0.3
      })),
    []
  )
  const spores = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: -Math.random() * 18,
        duration: 16 + Math.random() * 12,
        drift: `${(Math.random() * 2 - 1) * 80}px`,
        op: 0.12 + Math.random() * 0.28
      })),
    []
  )

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 54 }}>
      <div className="rad-vignette" />
      <div className="noise-overlay" />
      <div className="crt-overlay" />

      {/* Cendres qui retombent */}
      {ash.map((a) => (
        <span
          key={`a${a.id}`}
          className="absolute top-0 block rounded-full"
          style={{
            left: `${a.left}%`,
            width: a.size,
            height: a.size,
            background: 'rgba(120,124,114,0.9)',
            ['--drift' as string]: a.drift,
            ['--op' as string]: a.op,
            animation: `ash-fall ${a.duration}s linear ${a.delay}s infinite`
          }}
        />
      ))}

      {/* Spores toxiques qui montent */}
      {spores.map((s) => (
        <span
          key={`s${s.id}`}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            bottom: '-3%',
            width: s.size,
            height: s.size,
            background:
              'radial-gradient(circle, rgba(157,255,46,0.9), rgba(127,255,0,0.25) 60%, transparent)',
            boxShadow: '0 0 6px 1px rgba(157,255,46,0.5)',
            ['--drift' as string]: s.drift,
            ['--op' as string]: s.op,
            animation: `spore-drift ${s.duration}s linear ${s.delay}s infinite`
          }}
        />
      ))}
    </div>
  )
}
