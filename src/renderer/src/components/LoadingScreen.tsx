import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { useStore } from '@/lib/store'
import bgUrl from '@/assets/bg-apocalypse.png'
import logoUrl from '@/assets/logo.png'

// Écran de chargement « style Garry's Mod » : overlay plein écran pendant le lancement,
// art apocalyptique + scanlines CRT, barre de progression par phase, tips qui défilent,
// et une MUSIQUE dark-ambient « Metro 2033 » synthétisée en Web Audio (progression mineure + mélodie, 0 fichier copyrighté).

const PHASE_ORDER = [
  'checking', 'java', 'manifest', 'mods', 'assets', 'libraries', 'natives', 'forge', 'launching', 'running'
]
const PHASE_LABEL: Record<string, string> = {
  checking: 'Préparation du largage',
  java: 'Vérification du moteur (Java)',
  manifest: 'Lecture des ordres de mission',
  mods: 'Téléchargement de l\'équipement',
  assets: 'Chargement des ressources',
  libraries: 'Assemblage des bibliothèques',
  natives: 'Composants natifs',
  forge: 'Initialisation de NeoForge',
  launching: 'Mise à feu',
  running: 'Largage en zone infectée…'
}

const TIPS = [
  '☢ Bois régulièrement — la soif tue aussi vite que les infectés.',
  '📡 Clic droit sur ta boussole pour ouvrir le menu de survie.',
  '🔫 Achète tes armes à l\'Armurerie avec tes Pièces de Survie (/parme).',
  '💰 Chaque infecté tué te rapporte des Pièces de Survie.',
  '⛺ Pose une tente pour camper loin du spawn.',
  '🎒 Ton « Sac du Survivant » s\'ouvre d\'un simple clic droit.',
  '🛏 Un sac de couchage te laisse dormir n\'importe où.',
  '🧟 La nuit, les hordes sortent chasser — fortifie ta base.',
  '🗺 Touche M : carte plein écran · Touche U : point de repère.',
  '⚔ Monte le Passe de Combat : des armes t\'attendent aux paliers.',
  '☣ Les boss rapportent gros… si tu survis.',
  '🛡 Revendique tes chunks (carte → claim) pour protéger ta base.'
]

/**
 * Musique d'ambiance « Metro 2033 » entièrement SYNTHÉTISÉE en Web Audio (aucun fichier, 0 copyright) :
 * progression mineure mélancolique (Dm – Bb – F – C), nappes détunées, sous-basse vivante,
 * mélodie lead lancinante, réverb à convolution (tunnel), vent filtré et gouttes d'eau lointaines.
 */
function startDrone(): { stop: () => void; setMuted: (m: boolean) => void } | null {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  let ctx: AudioContext
  try {
    ctx = new Ctx()
  } catch {
    return null
  }
  const VOL = 0.2
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  const t0 = ctx.currentTime
  master.gain.setValueAtTime(0, t0)
  master.gain.linearRampToValueAtTime(VOL, t0 + 4)

  // ── Réverbération « tunnel » : convolver à impulsion synthétisée (bruit décroissant) ──
  const reverb = ctx.createConvolver()
  const irLen = Math.floor(ctx.sampleRate * 3.4)
  const ir = ctx.createBuffer(2, irLen, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.8)
  }
  reverb.buffer = ir
  const revWet = ctx.createGain()
  revWet.gain.value = 0.85
  reverb.connect(revWet)
  revWet.connect(master)
  const revSend = ctx.createGain()
  revSend.gain.value = 0.55
  revSend.connect(reverb)

  // ── Sous-basse vivante (fondation) ──
  const subOsc = ctx.createOscillator()
  subOsc.type = 'sine'
  subOsc.frequency.value = 36.7 // D1
  const subGain = ctx.createGain()
  subGain.gain.value = 0.0001
  subOsc.connect(subGain)
  subGain.connect(master)
  subOsc.start()
  const subLfo = ctx.createOscillator()
  subLfo.frequency.value = 0.06
  const subLfoG = ctx.createGain()
  subLfoG.gain.value = 0.06
  subLfo.connect(subLfoG)
  subLfoG.connect(subGain.gain)
  subLfo.start()

  // ── Vent de tunnel : bruit blanc → passe-bande, soufflé par un LFO lent ──
  const bufLen = Math.floor(ctx.sampleRate * 2)
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const ndata = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) ndata[i] = (Math.random() * 2 - 1) * 0.5
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  noise.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 560
  bp.Q.value = 0.6
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.045
  noise.connect(bp)
  bp.connect(noiseGain)
  noiseGain.connect(master)
  noise.start()
  const wind = ctx.createOscillator()
  wind.frequency.value = 0.08
  const windGain = ctx.createGain()
  windGain.gain.value = 0.03
  wind.connect(windGain)
  windGain.connect(noiseGain.gain)
  wind.start()

  // ── Composition : Ré mineur — Dm – Bb – F – C (i ♭VI ♭III ♭VII) ──
  const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12)
  const CHORDS: number[][] = [
    [50, 53, 57], // Dm : D3 F3 A3
    [46, 50, 53], // Bb : Bb2 D3 F3
    [41, 45, 48], // F  : F2 A2 C3
    [48, 52, 55] // C  : C3 E3 G3
  ]
  const SUBROOTS = [38, 34, 29, 36] // D2 Bb1 F1 C2
  const MEL: number[][] = [[69], [65], [72, 69], [67]] // A4 / F4 / C5→A4 / G4 (lancinant)
  const BAR = 7.5
  let bar = 0

  function pad(midi: number, t: number, dur: number): void {
    const f = mtof(midi)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.value = 0.6
    lp.frequency.setValueAtTime(420, t)
    lp.frequency.linearRampToValueAtTime(900, t + dur * 0.5)
    lp.frequency.linearRampToValueAtTime(420, t + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.1, t + dur * 0.35)
    g.gain.setValueAtTime(0.1, t + dur * 0.72)
    g.gain.linearRampToValueAtTime(0.0001, t + dur)
    lp.connect(g)
    g.connect(master)
    g.connect(revSend)
    ;[0, -7, 7].forEach((det, i) => {
      const o = ctx.createOscillator()
      o.type = i === 0 ? 'sawtooth' : 'triangle'
      o.frequency.value = f
      o.detune.value = det
      o.connect(lp)
      o.start(t)
      o.stop(t + dur + 0.15)
    })
  }
  function lead(midi: number, t: number, dur: number): void {
    const f = mtof(midi)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.17, t + 0.7)
    g.gain.linearRampToValueAtTime(0.0001, t + dur)
    g.connect(master)
    g.connect(revSend)
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = f
    o.connect(g)
    o.start(t)
    o.stop(t + dur + 0.2)
    const oh = ctx.createOscillator()
    oh.type = 'sine'
    oh.frequency.value = f * 2
    const gh = ctx.createGain()
    gh.gain.value = 0.28
    oh.connect(gh)
    gh.connect(g)
    oh.start(t)
    oh.stop(t + dur + 0.2)
  }
  function drip(t: number): void {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(1700 + Math.random() * 1000, t)
    o.frequency.exponentialRampToValueAtTime(680, t + 0.22)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.05, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    o.connect(g)
    g.connect(revSend)
    o.start(t)
    o.stop(t + 0.55)
  }
  function scheduleBar(): void {
    try {
      const t = ctx.currentTime + 0.06
      const ci = bar % CHORDS.length
      subOsc.frequency.setValueAtTime(mtof(SUBROOTS[ci]), t)
      subGain.gain.setTargetAtTime(0.5, t, 1.6)
      CHORDS[ci].forEach((m) => pad(m, t, BAR))
      const mel = MEL[ci]
      mel.forEach((m, k) => lead(m, t + 0.5 + k * (BAR / (mel.length + 0.4)), (BAR / mel.length) * 0.85))
      if (Math.random() < 0.7) drip(t + Math.random() * BAR)
      bar++
    } catch {
      /* ignore */
    }
  }
  scheduleBar()
  const schedId = window.setInterval(scheduleBar, BAR * 1000)

  void ctx.resume()
  let stopped = false
  return {
    setMuted(m: boolean) {
      try {
        const t = ctx.currentTime
        master.gain.cancelScheduledValues(t)
        master.gain.linearRampToValueAtTime(m ? 0 : VOL, t + 0.5)
      } catch {
        /* ignore */
      }
    },
    stop() {
      if (stopped) return
      stopped = true
      try {
        window.clearInterval(schedId)
        const t = ctx.currentTime
        master.gain.cancelScheduledValues(t)
        master.gain.linearRampToValueAtTime(0, t + 1.4)
        window.setTimeout(() => {
          try {
            subOsc.stop()
            subLfo.stop()
            noise.stop()
            wind.stop()
            void ctx.close()
          } catch {
            /* ignore */
          }
        }, 1600)
      } catch {
        /* ignore */
      }
    }
  }
}

export function LoadingScreen(): JSX.Element | null {
  const launching = useStore((s) => s.launching)
  const progress = useStore((s) => s.progress)
  const appName = useStore((s) => s.app?.manifest?.branding.appName) ?? 'Zarn'

  const phase = progress?.phase ?? 'checking'
  // Visible pendant la préparation/lancement, masqué dès que le jeu tourne ou en cas d'erreur.
  const visible = launching && phase !== 'running' && phase !== 'error' && phase !== 'closed' && phase !== 'idle'

  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('apocDroneMuted') === '1'
    } catch {
      return false
    }
  })
  const [tip, setTip] = useState(0)
  const droneRef = useRef<ReturnType<typeof startDrone> | null>(null)

  // Démarre/arrête la nappe avec la visibilité
  useEffect(() => {
    if (visible) {
      if (!droneRef.current) {
        droneRef.current = startDrone()
        droneRef.current?.setMuted(muted)
      }
    } else if (droneRef.current) {
      droneRef.current.stop()
      droneRef.current = null
    }
    return () => {
      if (droneRef.current) {
        droneRef.current.stop()
        droneRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    droneRef.current?.setMuted(muted)
    try {
      localStorage.setItem('apocDroneMuted', muted ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [muted])

  // Rotation des tips
  useEffect(() => {
    if (!visible) return
    const id = window.setInterval(() => setTip((t) => (t + 1) % TIPS.length), 4200)
    return () => window.clearInterval(id)
  }, [visible])

  const pct = useMemo(() => {
    const pi = PHASE_ORDER.indexOf(phase)
    if (pi < 0) return 4
    const within = progress?.percent != null ? Math.max(0, Math.min(100, progress.percent)) / 100 : 0.45
    return Math.min(99, Math.round(((pi + within) / PHASE_ORDER.length) * 100))
  }, [phase, progress?.percent])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[95] flex flex-col items-center justify-center overflow-hidden bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Fond : art apocalyptique, fortement assombri, ken-burns lent */}
          <motion.img
            src={bgUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
            initial={{ scale: 1.04 }}
            animate={{ scale: 1.14 }}
            transition={{ duration: 30, ease: 'linear' }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 120% at 50% 40%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0.88) 100%), linear-gradient(180deg, rgba(20,40,12,0.35), rgba(0,0,0,0.6))'
            }}
          />
          {/* Halo radioactif pulsant */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[38%] h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 62%)', filter: 'blur(40px)' }}
            animate={{ opacity: [0.1, 0.26, 0.1] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="grit-overlay" style={{ zIndex: 1 }} />

          {/* Bloc central */}
          <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-8 text-center">
            <motion.div
              className="mb-1 text-xs font-semibold uppercase tracking-[0.5em] text-[var(--accent)]"
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              ☢ Transmission entrante ☢
            </motion.div>
            <img
              src={logoUrl}
              alt={appName}
              className="mt-3 w-[min(440px,72vw)] drop-shadow-[0_4px_34px_rgba(0,0,0,0.85)]"
            />

            {/* Tip qui défile */}
            <div className="mt-9 h-10 w-full">
              <AnimatePresence mode="wait">
                <motion.p
                  key={tip}
                  className="text-sm text-slate-200/90"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                >
                  {TIPS[tip]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Phase + pourcentage */}
            <div className="mt-6 flex w-full items-center justify-between text-xs font-medium text-slate-300/80">
              <span>{PHASE_LABEL[phase] ?? progress?.message ?? 'Chargement…'}</span>
              <span className="tabular-nums text-[var(--accent)]">{pct}%</span>
            </div>

            {/* Barre de progression encochée (style XP) + bande danger */}
            <div className="xp-bar relative mt-2 h-2.5 w-full overflow-hidden rounded-sm bg-black/55">
              <motion.div
                className="h-full accent-gradient"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>
            <span className="hazard-stripe mt-1 h-[3px] w-full opacity-50" />

            {progress?.message && (
              <p className="mt-3 max-w-md truncate text-[11px] text-slate-400/70">{progress.message}</p>
            )}
          </div>

          {/* Bouton muet de l'ambiance */}
          <button
            onClick={() => setMuted((m) => !m)}
            title={muted ? 'Activer la musique' : 'Couper la musique'}
            className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-md border border-white/10 bg-black/45 px-3 py-2 text-xs font-semibold text-slate-300 backdrop-blur transition hover:border-[var(--accent)] hover:text-white"
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            {muted ? 'Musique coupée' : '♪ Musique Metro'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
