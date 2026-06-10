import { useEffect, useMemo, useRef, useState } from 'react'
import { SkinViewer, IdleAnimation, WalkingAnimation } from 'skinview3d'
import { Shirt, Check, Loader2, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/cn'
import { Button, Spinner } from '@/components/ui'
import { SKINS, applySkin, type SkinEntry } from '@/lib/skins'

/* Aperçu 3D d'un skin (fichier local) via skinview3d. */
function SkinViewer3D({ url, walk }: { url: string; walk: boolean }): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<SkinViewer | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    const v = new SkinViewer({ canvas: canvasRef.current, width: 260, height: 360, fov: 36, zoom: 0.85 })
    v.controls.enableZoom = false
    v.controls.enablePan = false
    v.autoRotate = true
    v.autoRotateSpeed = 0.6
    v.animation = new IdleAnimation()
    viewerRef.current = v
    return () => {
      v.dispose()
      viewerRef.current = null
    }
  }, [])

  useEffect(() => {
    const v = viewerRef.current
    if (!v) return
    setLoaded(false)
    Promise.resolve(v.loadSkin(url, { model: 'auto-detect' }) as Promise<void> | void)
      .then(() => setLoaded(true))
      .catch(() => setLoaded(true))
  }, [url])

  useEffect(() => {
    const v = viewerRef.current
    if (!v) return
    v.animation = walk ? new WalkingAnimation() : new IdleAnimation()
    if (v.animation) v.animation.speed = walk ? 0.85 : 0.5
    v.autoRotateSpeed = walk ? 1 : 0.6
  }, [walk])

  return (
    <div className="relative" style={{ width: 260, height: 360 }}>
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[var(--accent)]/10 blur-3xl" />
      <canvas ref={canvasRef} className="cursor-grab active:cursor-grabbing" />
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Spinner className="h-6 w-6" />
        </div>
      )}
    </div>
  )
}

const TABS: { id: 'all' | 'apoc' | 'classic'; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'apoc', label: '☣ Apocalyptique' },
  { id: 'classic', label: 'Variété' }
]

export function Skins(): JSX.Element {
  const app = useStore((s) => s.app)
  const setToast = useStore((s) => s.setToast)
  const accounts = app?.accounts ?? []
  const active = accounts.find((a) => a.id === app?.activeAccountId) ?? null
  const isPremium = active?.type === 'microsoft'
  const appliedId = app?.settings.skinId ?? null

  const [tab, setTab] = useState<'all' | 'apoc' | 'classic'>('all')
  const [selected, setSelected] = useState<number>(appliedId ?? 0)
  const [walk, setWalk] = useState(false)
  const [applying, setApplying] = useState(false)

  const list = useMemo<SkinEntry[]>(
    () => (tab === 'all' ? SKINS : SKINS.filter((s) => s.theme === tab)),
    [tab]
  )
  const current = SKINS.find((s) => s.id === selected) ?? SKINS[0]

  async function apply(): Promise<void> {
    setApplying(true)
    try {
      await applySkin(current.id)
      setToast({ kind: 'ok', text: `Skin « ${current.name} » appliqué` })
    } catch {
      setToast({ kind: 'err', text: "Impossible d'appliquer le skin" })
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl accent-gradient text-white shadow-glow">
          <Shirt size={20} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Skins</h1>
          <p className="text-xs text-slate-500">
            {SKINS.length} skins intégrés — survie apocalyptique &amp; plus. Idéal pour les comptes hors-ligne.
          </p>
        </div>
      </header>

      {isPremium && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-200">
          <Sparkles size={15} />
          Ton compte Premium affiche le skin de ton compte Microsoft. Ce sélecteur s'applique aux
          comptes <b>hors-ligne</b>.
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* Aperçu + actions */}
        <div className="card flex flex-col items-center gap-4 p-5">
          <SkinViewer3D url={current.url} walk={walk} />
          <div className="text-center">
            <div className="text-sm font-semibold text-slate-100">{current.name}</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              {current.theme === 'apoc' ? 'Apocalyptique' : 'Variété'}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2">
            <Button
              variant="accent"
              onClick={apply}
              disabled={applying || appliedId === current.id}
              className="w-full"
            >
              {applying ? (
                <Loader2 size={16} className="animate-spin" />
              ) : appliedId === current.id ? (
                <Check size={16} />
              ) : (
                <Shirt size={16} />
              )}
              {appliedId === current.id ? 'Skin actuel' : 'Appliquer'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWalk((w) => !w)} className="w-full">
              {walk ? 'Pause' : 'Marcher'}
            </Button>
          </div>
          <p className="text-center text-[10px] leading-relaxed text-slate-500">
            Le skin s'affiche en jeu via CustomSkinLoader (déjà dans le modpack). Clique-glisse pour
            tourner l'aperçu.
          </p>
        </div>

        {/* Grille */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  tab === t.id
                    ? 'accent-bg text-white shadow-glow'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2.5">
              {list.map((s) => {
                const isSel = s.id === selected
                const isApplied = s.id === appliedId
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    title={s.name}
                    className={cn(
                      'group relative flex flex-col items-center rounded-xl border-2 p-2 transition-all',
                      isSel
                        ? 'border-[var(--accent)] bg-white/10'
                        : 'border-transparent bg-white/5 hover:bg-white/10'
                    )}
                  >
                    {isApplied && (
                      <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
                        <Check size={11} />
                      </span>
                    )}
                    <img
                      src={s.thumb}
                      alt={s.name}
                      draggable={false}
                      className="h-20 w-auto select-none"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span className="mt-1 w-full truncate text-center text-[10px] text-slate-400">
                      {s.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
