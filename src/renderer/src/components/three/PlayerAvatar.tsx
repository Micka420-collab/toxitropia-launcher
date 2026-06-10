import { useEffect, useRef, useState } from 'react'
import { SkinViewer, IdleAnimation, WalkingAnimation, type PlayerAnimation } from 'skinview3d'
import { Spinner } from '../ui'

interface Props {
  name: string
  uuid: string
  type: 'microsoft' | 'offline'
  /** Force l'animation de marche (ex: pendant le lancement). */
  active?: boolean
  width?: number
  height?: number
  /** URL de skin explicite (catalogue local choisi). Absente → mc-heads d'après uuid/name. */
  skinUrl?: string
}

export function PlayerAvatar({ name, uuid, type, active = false, width = 240, height = 340, skinUrl }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<SkinViewer | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [hover, setHover] = useState(false)

  // Création / destruction du viewer
  useEffect(() => {
    if (!canvasRef.current) return
    const viewer = new SkinViewer({
      canvas: canvasRef.current,
      width,
      height,
      fov: 38,
      zoom: 0.82
    })
    viewer.controls.enableZoom = false
    viewer.controls.enablePan = false
    viewer.autoRotate = true
    viewer.autoRotateSpeed = 0.5
    viewer.animation = new IdleAnimation()
    viewerRef.current = viewer
    return () => {
      viewer.dispose()
      viewerRef.current = null
    }
  }, [width, height])

  // Chargement du skin selon le compte
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    setLoaded(false)
    setError(false)
    const id = type === 'microsoft' && uuid ? uuid : name
    const url = skinUrl ?? `https://mc-heads.net/skin/${encodeURIComponent(id)}`
    const result = viewer.loadSkin(url, { model: 'auto-detect' }) as Promise<void> | void
    Promise.resolve(result)
      .then(() => setLoaded(true))
      .catch(() => setError(true))
  }, [name, uuid, type, skinUrl])

  // Animation idle / marche (au survol ou pendant le lancement)
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const walking = active || hover
    const anim: PlayerAnimation = walking ? new WalkingAnimation() : new IdleAnimation()
    anim.speed = walking ? 0.85 : 0.5
    viewer.animation = anim
    viewer.autoRotateSpeed = walking ? 1.0 : 0.5
  }, [active, hover])

  return (
    <div
      className="relative"
      style={{ width, height }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[var(--accent)]/10 blur-3xl" />
      <canvas ref={canvasRef} className="cursor-grab active:cursor-grabbing" />
      {!loaded && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {error && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11px] text-slate-500">
          Skin indisponible
        </div>
      )}
    </div>
  )
}
