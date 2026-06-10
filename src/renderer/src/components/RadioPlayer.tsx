import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { stationById } from '@/lib/stations'

/**
 * Contrôleur audio sans rendu, monté à la racine de l'app : l'élément <audio>
 * vit en dehors des pages, donc la radio continue de jouer quand on change
 * d'onglet. La page Radio ne fait que piloter l'état du store.
 */
export function RadioPlayer(): null {
  const stationId = useStore((s) => s.radioStationId)
  const playing = useStore((s) => s.radioPlaying)
  const volume = useStore((s) => s.radioVolume)
  const setRadioStatus = useStore((s) => s.setRadioStatus)
  const setNowPlaying = useStore((s) => s.setNowPlaying)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  if (!audioRef.current) {
    audioRef.current = new Audio()
    audioRef.current.preload = 'none'
  }

  // Câblage des événements du flux (une seule fois).
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onWaiting = (): void => setRadioStatus({ radioLoading: true })
    const onPlaying = (): void =>
      setRadioStatus({ radioPlaying: true, radioLoading: false, radioError: null })
    const onPause = (): void => setRadioStatus({ radioPlaying: false })
    const onError = (): void => {
      // Ignorer l'erreur émise quand on coupe volontairement le flux (src retiré).
      if (!audio.getAttribute('src')) return
      setRadioStatus({
        radioError: 'Station injoignable. Réessaie ou choisis-en une autre.',
        radioPlaying: false,
        radioLoading: false
      })
    }
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.pause()
      audio.removeAttribute('src')
    }
  }, [setRadioStatus])

  // Volume.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Lecture / pause / changement de station.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const station = stationId ? stationById(stationId) : undefined

    if (playing && station) {
      if (audio.src !== station.url) audio.src = station.url
      setRadioStatus({ radioLoading: true })
      audio.play().catch(() => {
        setRadioStatus({
          radioError: 'Lecture impossible. Vérifie ta connexion.',
          radioPlaying: false,
          radioLoading: false
        })
      })
    } else {
      audio.pause()
      // Couper réellement le flux live (sinon il continue de se télécharger en pause).
      audio.removeAttribute('src')
      audio.load()
    }
  }, [playing, stationId, setRadioStatus])

  // Morceau en cours : uniquement pour les stations SomaFM (seules à exposer
  // l'API now-playing). Interroge via le main toutes les 20 s.
  useEffect(() => {
    const station = stationId ? stationById(stationId) : undefined
    if (!playing || !station || !station.url.includes('somafm.com')) return
    let alive = true
    const poll = (): void => {
      window.api
        .radioNowPlaying(station.id)
        .then((np) => alive && setNowPlaying(np))
        .catch(() => undefined)
    }
    poll()
    const t = setInterval(poll, 20000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [playing, stationId, setNowPlaying])

  return null
}
