import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import type { SeasonalEffect } from '@shared/types'

type Resolved = 'none' | 'snow' | 'halloween'

/** Résout le mode « auto » selon la date courante. */
function resolveEffect(setting: SeasonalEffect): Resolved {
  if (setting === 'snow' || setting === 'halloween' || setting === 'none') return setting
  const now = new Date()
  const m = now.getMonth() // 0 = janvier
  const d = now.getDate()
  // Noël : 1 déc → 6 jan.
  if (m === 11 || (m === 0 && d <= 6)) return 'snow'
  // Halloween : 18 oct → 2 nov.
  if ((m === 9 && d >= 18) || (m === 10 && d <= 2)) return 'halloween'
  return 'none'
}

/* Accent UI par saison → toute l'interface prend l'ambiance, pas juste l'overlay. */
const SEASON_ACCENT: Record<Exclude<Resolved, 'none'>, [string, string]> = {
  halloween: ['#ff7a18', '#9b4dff'], // citrouille → violet sorcier
  snow: ['#e8b04b', '#46b06a'] // or chaud → sapin
}

/** Applique les couleurs d'accent de la saison et restaure à la sortie. */
function useSeasonalAccent(effect: Resolved): void {
  useEffect(() => {
    if (effect === 'none') return
    const root = document.documentElement
    const prev1 = root.style.getPropertyValue('--accent')
    const prev2 = root.style.getPropertyValue('--accent-2')
    const [a, b] = SEASON_ACCENT[effect]
    root.style.setProperty('--accent', a)
    root.style.setProperty('--accent-2', b)
    return () => {
      prev1 ? root.style.setProperty('--accent', prev1) : root.style.removeProperty('--accent')
      prev2 ? root.style.setProperty('--accent-2', prev2) : root.style.removeProperty('--accent-2')
    }
  }, [effect])
}

const KEYFRAMES = `
/* ─────────── Halloween ─────────── */
@keyframes hw-breathe {
  0%, 100% { opacity: .80; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.045); }
}
@keyframes hw-fog-a {
  0%   { transform: translate3d(-10%, 0, 0); }
  100% { transform: translate3d(12%, 0, 0); }
}
@keyframes hw-fog-b {
  0%   { transform: translate3d(10%, 0, 0); }
  100% { transform: translate3d(-13%, 0, 0); }
}
@keyframes hw-ember {
  0%   { transform: translate3d(0, 0, 0); opacity: 0; }
  12%  { opacity: var(--op); }
  88%  { opacity: var(--op); }
  100% { transform: translate3d(var(--drift), -86vh, 0); opacity: 0; }
}
@keyframes hw-eyes {
  0%, 58%, 100% { opacity: 0; }
  66%           { opacity: var(--op); }
  70%           { opacity: calc(var(--op) * .15); }   /* clignement */
  74%, 90%      { opacity: var(--op); }
  96%           { opacity: 0; }
}
@keyframes hw-glide {
  0%   { transform: translate3d(-16vw, 0, 0); opacity: 0; }
  10%  { opacity: var(--op); }
  50%  { transform: translate3d(48vw, var(--sway), 0); }
  90%  { opacity: var(--op); }
  100% { transform: translate3d(116vw, 0, 0); opacity: 0; }
}
@keyframes hw-flap {
  0%, 100% { transform: scaleY(1); }
  50%      { transform: scaleY(.5); }
}
@keyframes hw-flicker {
  0%, 93%, 100% { opacity: 0; }
  94%           { opacity: .14; }
  95%           { opacity: .03; }
  96%           { opacity: .11; }
  97%           { opacity: .01; }
}
@keyframes hw-bolt {
  0%   { opacity: 0; }
  2%   { opacity: .85; }
  6%   { opacity: .12; }
  10%  { opacity: .7; }
  18%  { opacity: 0; }
  100% { opacity: 0; }
}

/* ─────────── Noël / neige ─────────── */
@keyframes xmas-fall {
  0%   { transform: translateY(-12vh); opacity: 0; }
  6%   { opacity: var(--op); }
  94%  { opacity: var(--op); }
  100% { transform: translateY(112vh); opacity: 0; }
}
@keyframes xmas-sway {
  0%, 100% { transform: translateX(calc(var(--sway) * -1)) rotate(0deg); }
  50%      { transform: translateX(var(--sway)) rotate(200deg); }
}
@keyframes xmas-twinkle {
  0%, 100% { opacity: .35; filter: brightness(.65); }
  50%      { opacity: 1;   filter: brightness(1.5); }
}
@keyframes xmas-bokeh {
  0%   { transform: translate3d(0, 6vh, 0); opacity: 0; }
  16%  { opacity: var(--op); }
  84%  { opacity: var(--op); }
  100% { transform: translate3d(var(--drift), -92vh, 0); opacity: 0; }
}
@keyframes xmas-aurora {
  0%, 100% { transform: translateX(-5%); opacity: .45; }
  50%      { transform: translateX(5%);  opacity: .8; }
}`

/* Silhouette de chauve-souris (aile gauche + miroir). */
function Bat(): JSX.Element {
  const wing =
    'M60 26 C 50 16 36 14 24 20 C 20 14 14 14 10 22 C 14 24 16 28 14 32 ' +
    'C 22 28 28 32 30 38 C 34 32 40 32 42 40 C 46 34 54 34 60 40 Z'
  return (
    <svg viewBox="0 0 120 70" width="100%" height="100%" fill="#04050a">
      <path d={wing} />
      <path d={wing} transform="translate(120,0) scale(-1,1)" />
      <ellipse cx="60" cy="30" rx="6.5" ry="11" />
      <path d="M54 22 L57 12 L60 22 Z" />
      <path d="M66 22 L63 12 L60 22 Z" />
    </svg>
  )
}

/* Quart de toile d'araignée depuis un coin. */
function Cobweb(): JSX.Element {
  const rings = [24, 48, 72, 96, 120]
  const angles = [0, 18, 36, 54, 72, 90]
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none" stroke="rgba(220,226,238,.16)" strokeWidth="0.6">
      {angles.map((a, i) => {
        const r = (a * Math.PI) / 180
        return <line key={i} x1="0" y1="0" x2={150 * Math.cos(r)} y2={150 * Math.sin(r)} />
      })}
      {rings.map((r, i) => (
        <path key={i} d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`} />
      ))}
    </svg>
  )
}

function HalloweenScene(): JSX.Element {
  const [bolt, setBolt] = useState(0)

  // Éclairs à intervalles aléatoires (effet de sursaut).
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const loop = (): void => {
      t = setTimeout(
        () => {
          setBolt((n) => n + 1)
          loop()
        },
        7000 + Math.random() * 14000
      )
    }
    loop()
    return () => clearTimeout(t)
  }, [])

  const embers = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: -Math.random() * 16,
        duration: 9 + Math.random() * 11,
        drift: `${(Math.random() * 2 - 1) * 70}px`,
        op: 0.4 + Math.random() * 0.5
      })),
    []
  )

  const eyes = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const colors = ['#ffae3b', '#ff8a00', '#9dff4a', '#ff4646', '#ffae3b']
        return {
          id: i,
          left: i % 2 === 0 ? 4 + Math.random() * 22 : 74 + Math.random() * 22,
          top: 16 + Math.random() * 64,
          color: colors[i % colors.length],
          delay: -Math.random() * 12,
          duration: 9 + Math.random() * 7,
          op: 0.55 + Math.random() * 0.35
        }
      }),
    []
  )

  const bats = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        top: 8 + Math.random() * 58,
        size: 26 + Math.random() * 24,
        delay: -Math.random() * 22,
        duration: 13 + Math.random() * 11,
        flap: 0.32 + Math.random() * 0.22,
        sway: `${(Math.random() * 2 - 1) * 90}px`,
        op: 0.7 + Math.random() * 0.3
      })),
    []
  )

  return (
    <>
      {/* Ténèbres qui « respirent » + halos sang & sorcier */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(116% 116% at 50% 42%, transparent 45%, rgba(18,2,5,.80) 100%),' +
            'radial-gradient(82% 52% at 50% 0%, rgba(122,10,16,.34), transparent 60%),' +
            'radial-gradient(72% 52% at 50% 100%, rgba(96,30,150,.24), transparent 65%)',
          animation: 'hw-breathe 6s ease-in-out infinite'
        }}
      />

      {/* Brume rampante au sol */}
      <div
        className="absolute inset-x-0 bottom-0 h-[46%]"
        style={{
          background: 'radial-gradient(60% 100% at 32% 100%, rgba(52,74,48,.5), transparent 70%)',
          filter: 'blur(22px)',
          mixBlendMode: 'screen',
          animation: 'hw-fog-a 19s ease-in-out infinite alternate'
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[40%]"
        style={{
          background: 'radial-gradient(56% 100% at 70% 100%, rgba(78,40,96,.42), transparent 70%)',
          filter: 'blur(26px)',
          mixBlendMode: 'screen',
          animation: 'hw-fog-b 25s ease-in-out infinite alternate'
        }}
      />

      {/* Toiles dans les coins hauts */}
      <div className="absolute left-0 top-0 h-32 w-32 opacity-80">
        <Cobweb />
      </div>
      <div className="absolute right-0 top-0 h-32 w-32 opacity-80" style={{ transform: 'scaleX(-1)' }}>
        <Cobweb />
      </div>

      {/* Yeux luisants tapis dans l'ombre */}
      {eyes.map((e) => (
        <div
          key={e.id}
          className="absolute flex gap-[7px]"
          style={{
            left: `${e.left}%`,
            top: `${e.top}%`,
            ['--op' as string]: e.op,
            animation: `hw-eyes ${e.duration}s ease-in-out ${e.delay}s infinite`
          }}
        >
          {[0, 1].map((k) => (
            <span
              key={k}
              className="rounded-full"
              style={{
                width: 8,
                height: 5,
                background: e.color,
                boxShadow: `0 0 8px 2px ${e.color}, 0 0 16px 4px ${e.color}66`
              }}
            />
          ))}
        </div>
      ))}

      {/* Braises montantes */}
      {embers.map((e) => (
        <span
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: `${e.left}%`,
            bottom: '-2%',
            width: e.size,
            height: e.size,
            background: 'radial-gradient(circle, #ffc66a, #ff6a00 60%, transparent)',
            boxShadow: '0 0 7px 1px rgba(255,128,0,.85)',
            ['--drift' as string]: e.drift,
            ['--op' as string]: e.op,
            animation: `hw-ember ${e.duration}s linear ${e.delay}s infinite`
          }}
        />
      ))}

      {/* Chauves-souris en vol (silhouettes battantes) */}
      {bats.map((b) => (
        <div
          key={b.id}
          className="absolute"
          style={{
            top: `${b.top}%`,
            left: 0,
            width: b.size,
            height: b.size * 0.58,
            ['--sway' as string]: b.sway,
            ['--op' as string]: b.op,
            animation: `hw-glide ${b.duration}s ease-in-out ${b.delay}s infinite`
          }}
        >
          <div
            className="h-full w-full"
            style={{
              animation: `hw-flap ${b.flap}s ease-in-out infinite`,
              filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.7))'
            }}
          >
            <Bat />
          </div>
        </div>
      ))}

      {/* Scintillement façon vieille lampe */}
      <div className="absolute inset-0 bg-black" style={{ animation: 'hw-flicker 8s linear infinite' }} />

      {/* Éclair (rejoué à chaque clé) */}
      <div
        key={bolt}
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(85% 65% at 50% -5%, rgba(206,214,255,.92), rgba(150,170,255,.42) 40%, transparent 75%)',
          opacity: 0,
          animation: 'hw-bolt 1.2s ease-out'
        }}
      />
    </>
  )
}

function SnowScene(): JSX.Element {
  // Neige en 3 couches (profondeur).
  const snow = useMemo(() => {
    const make = (
      count: number,
      sz: [number, number],
      blur: number,
      dur: [number, number],
      sway: [number, number],
      op: [number, number]
    ): Array<{
      id: number
      left: number
      size: number
      blur: number
      duration: number
      delay: number
      sway: number
      swayDur: number
      op: number
    }> =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: sz[0] + Math.random() * (sz[1] - sz[0]),
        blur,
        duration: dur[0] + Math.random() * (dur[1] - dur[0]),
        delay: -Math.random() * 24,
        sway: sway[0] + Math.random() * (sway[1] - sway[0]),
        swayDur: 3 + Math.random() * 4,
        op: op[0] + Math.random() * (op[1] - op[0])
      }))
    return {
      far: make(42, [1.5, 3], 0.2, [15, 23], [8, 18], [0.3, 0.6]),
      mid: make(26, [3, 5], 0.5, [10, 16], [14, 30], [0.5, 0.8]),
      near: make(13, [5, 9], 1.4, [7, 11], [24, 50], [0.55, 0.9])
    }
  }, [])

  const lights = useMemo(() => {
    const n = 18
    const colors = ['#ff5a5a', '#ffd24a', '#5ad1ff', '#6dff8f', '#c77dff']
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      x: (i / (n - 1)) * 100,
      top: 7 + Math.sin(i * 0.7) * 4,
      color: colors[i % colors.length],
      delay: -(Math.random() * 2),
      duration: 1.6 + Math.random() * 1.6
    }))
  }, [])

  const bokeh = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 4 + Math.random() * 8,
        delay: -Math.random() * 18,
        duration: 13 + Math.random() * 12,
        drift: `${(Math.random() * 2 - 1) * 60}px`,
        op: 0.25 + Math.random() * 0.4
      })),
    []
  )

  const renderLayer = (
    layer: { id: number; left: number; size: number; blur: number; duration: number; delay: number; sway: number; swayDur: number; op: number }[]
  ): JSX.Element[] =>
    layer.map((s) => (
      <span
        key={s.id}
        className="absolute top-0 block"
        style={{
          left: `${s.left}%`,
          ['--op' as string]: s.op,
          animation: `xmas-fall ${s.duration}s linear ${s.delay}s infinite`
        }}
      >
        <span
          className="block rounded-full bg-white"
          style={{
            width: s.size,
            height: s.size,
            filter: `blur(${s.blur}px)`,
            boxShadow: '0 0 6px rgba(255,255,255,.7)',
            ['--sway' as string]: `${s.sway}px`,
            animation: `xmas-sway ${s.swayDur}s ease-in-out infinite`
          }}
        />
      </span>
    ))

  return (
    <>
      {/* Nuit bleutée en haut + chaleur de foyer en bas + bords doux */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 50% -12%, rgba(30,54,90,.5), transparent 55%),' +
            'radial-gradient(120% 120% at 50% 122%, rgba(124,72,30,.30), transparent 60%),' +
            'radial-gradient(120% 120% at 50% 45%, transparent 60%, rgba(6,10,20,.5) 100%)'
        }}
      />

      {/* Aurore festive très douce */}
      <div
        className="absolute inset-x-0 top-0 h-[55%]"
        style={{
          background:
            'linear-gradient(100deg, transparent, rgba(80,210,170,.10), rgba(120,150,255,.12), rgba(180,120,230,.08), transparent)',
          filter: 'blur(30px)',
          mixBlendMode: 'screen',
          animation: 'xmas-aurora 15s ease-in-out infinite'
        }}
      />

      {/* Givre dans les coins */}
      {[
        { pos: { left: 0, top: 0 }, at: '0 0' },
        { pos: { right: 0, top: 0 }, at: '100% 0' },
        { pos: { left: 0, bottom: 0 }, at: '0 100%' },
        { pos: { right: 0, bottom: 0 }, at: '100% 100%' }
      ].map((c, i) => (
        <div
          key={i}
          className="absolute h-40 w-40"
          style={{
            ...c.pos,
            background: `radial-gradient(circle at ${c.at}, rgba(200,230,255,.22), transparent 70%)`
          }}
        />
      ))}

      {/* Guirlande lumineuse */}
      <svg
        className="absolute left-0 top-0 w-full"
        height={40}
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        <polyline
          points={lights.map((l) => `${l.x},${l.top}`).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,.16)"
          strokeWidth={0.4}
        />
      </svg>
      {lights.map((l) => (
        <span
          key={l.id}
          className="absolute -translate-x-1/2 rounded-full"
          style={{
            left: `${l.x}%`,
            top: `${l.top}px`,
            width: 7,
            height: 7,
            background: l.color,
            boxShadow: `0 0 8px 2px ${l.color}, 0 0 18px 5px ${l.color}77`,
            animation: `xmas-twinkle ${l.duration}s ease-in-out ${l.delay}s infinite`
          }}
        />
      ))}

      {/* Orbes chaleureux qui flottent */}
      {bokeh.map((o) => (
        <span
          key={o.id}
          className="absolute rounded-full"
          style={{
            left: `${o.left}%`,
            bottom: '-5%',
            width: o.size,
            height: o.size,
            background: 'radial-gradient(circle, rgba(255,226,170,.9), rgba(255,190,120,.3) 50%, transparent)',
            filter: 'blur(1px)',
            ['--drift' as string]: o.drift,
            ['--op' as string]: o.op,
            animation: `xmas-bokeh ${o.duration}s linear ${o.delay}s infinite`
          }}
        />
      ))}

      {/* Neige (3 profondeurs) */}
      {renderLayer(snow.far)}
      {renderLayer(snow.mid)}
      {renderLayer(snow.near)}

      {/* Congère lumineuse au sol */}
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{
          background:
            'radial-gradient(120% 140% at 50% 135%, rgba(255,255,255,.92), rgba(232,244,255,.5) 42%, transparent 72%)',
          filter: 'blur(6px)'
        }}
      />
    </>
  )
}

export function SeasonalEffects(): JSX.Element | null {
  const setting = useStore((s) => s.app?.settings.seasonalEffect ?? 'auto')
  const effect = resolveEffect(setting)
  useSeasonalAccent(effect)

  if (effect === 'none') return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      <style>{KEYFRAMES}</style>
      {effect === 'halloween' ? <HalloweenScene /> : <SnowScene />}
    </div>
  )
}
