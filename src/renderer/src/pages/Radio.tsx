import { useEffect, useState } from 'react'
import {
  Radio as RadioIcon,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Loader2,
  SkipBack,
  SkipForward,
  Shuffle,
  Star,
  Moon,
  Music
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { STATIONS, stationById, type RadioStation } from '@/lib/stations'
import { Slider } from '@/components/ui'
import { cn } from '@/lib/cn'

const SLEEP_PRESETS = [15, 30, 60]

function Equalizer({ className }: { className?: string }): JSX.Element {
  return (
    <span className={cn('flex items-end gap-[3px]', className)} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="eq-bar" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  )
}

function fmtRemaining(ms: number): string {
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export function Radio(): JSX.Element {
  const stationId = useStore((s) => s.radioStationId)
  const playing = useStore((s) => s.radioPlaying)
  const loading = useStore((s) => s.radioLoading)
  const error = useStore((s) => s.radioError)
  const volume = useStore((s) => s.radioVolume)
  const nowPlaying = useStore((s) => s.radioNowPlaying)
  const favorites = useStore((s) => s.radioFavorites)
  const sleepUntil = useStore((s) => s.radioSleepUntil)
  const playRadio = useStore((s) => s.playRadio)
  const toggleRadio = useStore((s) => s.toggleRadio)
  const stopRadio = useStore((s) => s.stopRadio)
  const setRadioVolume = useStore((s) => s.setRadioVolume)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const nextStation = useStore((s) => s.nextStation)
  const prevStation = useStore((s) => s.prevStation)
  const shuffleStation = useStore((s) => s.shuffleStation)
  const setRadioSleep = useStore((s) => s.setRadioSleep)

  const current = stationId ? stationById(stationId) : undefined
  const pct = Math.round(volume * 100)

  // Tick pour le compte à rebours du minuteur de veille.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!sleepUntil) return
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [sleepUntil])
  const remaining = sleepUntil ? Math.max(0, sleepUntil - Date.now()) : 0

  const npLabel =
    nowPlaying && (nowPlaying.artist || nowPlaying.title)
      ? [nowPlaying.artist, nowPlaying.title].filter(Boolean).join(' — ')
      : ''

  function status(): string {
    if (error) return error
    if (loading) return 'Connexion au flux…'
    if (playing) return npLabel || `En lecture · ${current?.genre ?? ''}`
    return current ? `En pause · ${current.genre}` : ''
  }

  const favStations = STATIONS.filter((s) => favorites.includes(s.id))

  function StationCard({ s }: { s: RadioStation }): JSX.Element {
    const isCurrent = s.id === stationId
    const isLive = isCurrent && playing
    const isFav = favorites.includes(s.id)
    return (
      <div
        className={cn(
          'card relative flex items-center gap-3.5 p-4 transition hover:border-white/25',
          isCurrent && 'accent-border bg-white/[0.04]'
        )}
      >
        <button
          onClick={() => playRadio(s.id)}
          className="absolute inset-0 rounded-2xl"
          aria-label={`Lire ${s.name}`}
        />
        <span
          className={cn(
            'pointer-events-none grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/5',
            s.color
          )}
        >
          {isLive && !loading ? <Equalizer className="h-5" /> : <RadioIcon size={22} />}
        </span>
        <div className="pointer-events-none min-w-0 flex-1">
          <div className="truncate font-bold text-white">{s.name}</div>
          <div className="truncate text-xs text-slate-400">{s.genre}</div>
        </div>
        <button
          onClick={() => toggleFavorite(s.id)}
          title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={cn(
            'relative z-10 grid h-8 w-8 place-items-center rounded-lg transition',
            isFav
              ? 'text-amber-400 hover:bg-white/10'
              : 'text-slate-600 hover:bg-white/10 hover:text-slate-300'
          )}
        >
          <Star size={16} className={isFav ? 'fill-amber-400' : ''} />
        </button>
        {isCurrent && (
          <span className="pointer-events-none relative z-0 shrink-0 text-slate-300">
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : playing ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-white">Radio</h1>
      <p className="mt-1 text-sm text-slate-400">
        Des stations pour t'accompagner pendant le jeu. La lecture continue même quand tu changes
        d'onglet.
      </p>

      {/* Lecteur — station en cours + contrôles */}
      <div className="mt-6 card p-4">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              'grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/5',
              current?.color ?? 'text-slate-400'
            )}
          >
            {playing && !loading ? (
              <Equalizer className={cn('h-6', current?.color)} />
            ) : (
              <RadioIcon size={26} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div
              className={cn('truncate text-lg font-bold', current ? 'text-white' : 'text-slate-300')}
            >
              {current ? current.name : 'Aucune station'}
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 truncate text-xs',
                error ? 'text-red-400' : 'text-slate-400'
              )}
            >
              {playing && npLabel && !error && (
                <Music size={12} className="shrink-0 accent-text" />
              )}
              <span className="truncate">
                {current ? status() : 'Choisis une station ci-dessous pour démarrer la radio.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => current && toggleFavorite(current.id)}
              disabled={!current}
              title="Favori"
              className={cn(
                'grid h-9 w-9 place-items-center rounded-full transition disabled:opacity-30',
                current && favorites.includes(current.id)
                  ? 'text-amber-400 hover:bg-white/10'
                  : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'
              )}
            >
              <Star
                size={17}
                className={current && favorites.includes(current.id) ? 'fill-amber-400' : ''}
              />
            </button>
            <button
              onClick={prevStation}
              title="Station précédente"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={toggleRadio}
              disabled={!current}
              title={playing ? 'Pause' : 'Lecture'}
              className={cn(
                'grid h-11 w-11 place-items-center rounded-full text-white shadow-glow transition',
                current ? 'accent-gradient hover:brightness-110' : 'bg-surface-700 opacity-50'
              )}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : playing ? (
                <Pause size={20} />
              ) : (
                <Play size={20} className="translate-x-[1px]" />
              )}
            </button>
            <button
              onClick={nextStation}
              title="Station suivante"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <SkipForward size={18} />
            </button>
            <button
              onClick={shuffleStation}
              title="Station aléatoire"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Shuffle size={17} />
            </button>
            <button
              onClick={stopRadio}
              disabled={!playing && !loading}
              title="Arrêter"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <Square size={16} />
            </button>
          </div>
        </div>

        {/* Volume */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setRadioVolume(volume > 0 ? 0 : 0.7)}
            title={volume > 0 ? 'Couper le son' : 'Rétablir le son'}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
          >
            {volume > 0 ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <Slider value={pct} min={0} max={100} onChange={(v) => setRadioVolume(v / 100)} />
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-500">
            {pct}%
          </span>
        </div>

        {/* Minuteur de veille */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Moon size={14} /> Minuteur
          </span>
          <button
            onClick={() => setRadioSleep(null)}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium transition',
              !sleepUntil ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'
            )}
          >
            Off
          </button>
          {SLEEP_PRESETS.map((min) => (
            <button
              key={min}
              onClick={() => setRadioSleep(min)}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
            >
              {min} min
            </button>
          ))}
          {sleepUntil && (
            <span className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium accent-text tabular-nums">
              <Moon size={12} /> Extinction dans {fmtRemaining(remaining)}
            </span>
          )}
        </div>
      </div>

      {/* Favoris */}
      {favStations.length > 0 && (
        <>
          <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <Star size={15} className="fill-amber-400 text-amber-400" /> Favoris
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favStations.map((s) => (
              <StationCard key={s.id} s={s} />
            ))}
          </div>
        </>
      )}

      {/* Liste des stations */}
      <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
        <RadioIcon size={15} /> Toutes les stations
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STATIONS.map((s) => (
          <StationCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  )
}
