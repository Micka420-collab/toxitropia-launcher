import { useEffect, useRef, useState } from 'react'
import {
  RefreshCw,
  FolderOpen,
  Cpu,
  MemoryStick,
  Coffee,
  Link2,
  Search,
  Gauge,
  Zap,
  Snowflake,
  Ghost,
  Sparkles,
  Ban,
  Wrench,
  RotateCcw
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card, Field, TextInput, TextArea, Select, Toggle, Slider, Button, Badge, Spinner } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { GameFolder, LauncherSettings, SeasonalEffect, TuningRecommendation } from '@shared/types'

const FOLDERS: { kind: GameFolder; label: string }[] = [
  { kind: 'game', label: 'Dossier du jeu' },
  { kind: 'mods', label: 'Mods' },
  { kind: 'resourcepacks', label: 'Resource packs' },
  { kind: 'screenshots', label: 'Captures' },
  { kind: 'config', label: 'Config' },
  { kind: 'crash-reports', label: 'Crash reports' },
  { kind: 'logs', label: 'Logs' }
]

const SEASONS: { id: SeasonalEffect; label: string; icon: typeof Snowflake }[] = [
  { id: 'auto', label: 'Automatique', icon: Sparkles },
  { id: 'none', label: 'Aucun', icon: Ban },
  { id: 'snow', label: 'Neige (Noël)', icon: Snowflake },
  { id: 'halloween', label: 'Halloween', icon: Ghost }
]

function scoreTint(score: number): string {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 6) return 'text-lime-400'
  if (score >= 4) return 'text-amber-400'
  return 'text-red-400'
}

export function Settings(): JSX.Element {
  const app = useStore((s) => s.app)
  const system = useStore((s) => s.system)
  const javas = useStore((s) => s.javas)
  const refreshJava = useStore((s) => s.refreshJava)
  const setToast = useStore((s) => s.setToast)
  const maintenance = useStore((s) => s.maintenance)

  const [form, setForm] = useState<LauncherSettings | null>(app?.settings ?? null)
  const [tuning, setTuning] = useState<TuningRecommendation | null>(null)
  const [repairing, setRepairing] = useState<null | 'repair' | 'reinstall'>(null)
  const pending = useRef<Partial<LauncherSettings>>({})
  const timer = useRef<number>()

  useEffect(() => {
    void window.api.getTuning().then(setTuning).catch(() => undefined)
  }, [])

  if (!app || !form) return <div className="p-8 text-slate-500">Chargement…</div>

  function update(patch: Partial<LauncherSettings>): void {
    setForm((f) => (f ? { ...f, ...patch } : f))
    pending.current = { ...pending.current, ...patch }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      void window.api.setSettings(pending.current)
      pending.current = {}
    }, 350)
  }

  async function pickDir(): Promise<void> {
    const dir = await window.api.pickFolder(form!.gameDir)
    if (dir) update({ gameDir: dir })
  }
  async function pickJava(): Promise<void> {
    // Sous Windows le binaire est javaw.exe ; sous macOS/Linux c'est « java » (sans extension) →
    // un filtre [.exe] le rendrait INSÉLECTIONNABLE dans le sélecteur natif. On ne filtre donc pas
    // hors Windows (le binaire mac est aussi sous .../Contents/Home/bin/java).
    const filters =
      window.api?.platform === 'win32' ? [{ name: 'Java', extensions: ['exe'] }] : undefined
    const file = await window.api.pickFile(filters)
    if (file) update({ javaPath: file })
  }
  async function syncManifest(): Promise<void> {
    try {
      await window.api.fetchManifest(form!.manifestUrl)
      setToast({ kind: 'ok', text: 'Configuration synchronisée' })
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Échec de la synchro' })
    }
  }
  function applyTuning(): void {
    if (!tuning) return
    update({ ramMb: tuning.recommendedRamMb, jvmArgs: tuning.jvmArgs })
    setToast({ kind: 'ok', text: 'Réglages optimaux appliqués' })
    window.setTimeout(() => void window.api.getTuning().then(setTuning).catch(() => undefined), 600)
  }

  async function doRepair(): Promise<void> {
    setRepairing('repair')
    try {
      const r = await window.api.repairGame()
      setToast({
        kind: 'ok',
        text:
          r.downloaded === 0 && r.removed === 0
            ? `Installation vérifiée — ${r.total} fichiers intègres`
            : `Réparé : ${r.downloaded} (re)téléchargé(s), ${r.removed} nettoyé(s)`
      })
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Échec de la vérification' })
    } finally {
      setRepairing(null)
    }
  }

  async function doReinstall(): Promise<void> {
    const ok = window.confirm(
      'Réinstaller le modpack ?\n\nLes mods du serveur et le loader (NeoForge) seront retéléchargés au prochain lancement. Tes mods ajoutés à la main sont conservés.'
    )
    if (!ok) return
    setRepairing('reinstall')
    try {
      const r = await window.api.reinstallGame()
      setToast({ kind: 'ok', text: `Réinstallé : ${r.downloaded} fichier(s), ${r.removed} nettoyé(s)` })
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Échec de la réinstallation' })
    } finally {
      setRepairing(null)
    }
  }

  const totalRam = system?.totalRamMb ?? 16384
  const ramGb = (form.ramMb / 1024).toFixed(form.ramMb % 1024 === 0 ? 0 : 1)

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-white">Paramètres</h1>
      <p className="mt-1 text-sm text-slate-400">Configure ton expérience de jeu.</p>

      <div className="mt-6 space-y-5">
        {/* RAM */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <MemoryStick size={16} className="accent-text" /> Mémoire allouée
            </span>
            <Badge>{ramGb} Go</Badge>
          </div>
          <Slider
            value={form.ramMb}
            min={1024}
            max={Math.max(2048, totalRam)}
            step={512}
            onChange={(v) => update({ ramMb: v })}
          />
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>1 Go</span>
            <span>{(Math.max(2048, totalRam) / 1024).toFixed(0)} Go (total système)</span>
          </div>
        </Card>

        {/* Auto-tuner de performances */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Gauge size={16} className="accent-text" /> Auto-tuner de performances
            </span>
            {tuning && (
              <Badge className={cn('border-current/20', scoreTint(tuning.score))}>
                {tuning.scoreLabel}
              </Badge>
            )}
          </div>

          {tuning ? (
            <>
              <div className="flex items-center gap-4">
                <div className="flex shrink-0 items-baseline gap-1">
                  <span className={cn('text-3xl font-black', scoreTint(tuning.score))}>
                    {tuning.score.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-500">/ 10</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full accent-gradient transition-all"
                      style={{ width: `${(tuning.score / 10) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    RAM recommandée :{' '}
                    <b className="text-slate-200">{(tuning.recommendedRamMb / 1024).toFixed(0)} Go</b>{' '}
                    + flags JVM optimisés (Aikar / G1GC).
                  </p>
                </div>
              </div>

              {tuning.notes.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {tuning.notes.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <Zap size={12} className="mt-0.5 shrink-0 accent-text" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex items-center gap-3">
                <Button variant="accent" onClick={applyTuning} disabled={tuning.current.matchesRam}>
                  <Zap size={16} />
                  {tuning.current.matchesRam ? 'Déjà optimisé' : 'Appliquer les réglages optimaux'}
                </Button>
                {tuning.current.matchesRam && (
                  <span className="text-xs text-emerald-400">Ta configuration est optimale.</span>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">Analyse de ta configuration…</p>
          )}
        </Card>

        {/* Java */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Coffee size={16} className="accent-text" /> Java
            </span>
            <button
              onClick={refreshJava}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <Search size={13} /> Re-détecter
            </button>
          </div>
          <div className="flex gap-2">
            <Select
              value={form.javaPath}
              onChange={(e) => update({ javaPath: e.target.value })}
            >
              <option value="">Automatique {app.manifest?.java.autoDownload ? '(télécharge si besoin)' : ''}</option>
              {javas.map((j) => (
                <option key={j.path} value={j.path}>
                  Java {j.major} — {j.source} ({j.version})
                </option>
              ))}
              {form.javaPath && !javas.some((j) => j.path === form.javaPath) && (
                <option value={form.javaPath}>{form.javaPath}</option>
              )}
            </Select>
            <Button variant="outline" onClick={pickJava} className="shrink-0">
              <FolderOpen size={16} /> Parcourir
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Recommandé : Java {app.manifest?.java.recommendedMajor ?? 17}. En mode automatique, le
            launcher télécharge la bonne version au besoin.
          </p>
        </Card>

        {/* Resolution */}
        <Card>
          <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Cpu size={16} className="accent-text" /> Fenêtre de jeu
          </span>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Largeur">
              <TextInput
                type="number"
                value={form.resolution.width}
                onChange={(e) =>
                  update({ resolution: { ...form.resolution, width: Number(e.target.value) || 0 } })
                }
              />
            </Field>
            <Field label="Hauteur">
              <TextInput
                type="number"
                value={form.resolution.height}
                onChange={(e) =>
                  update({ resolution: { ...form.resolution, height: Number(e.target.value) || 0 } })
                }
              />
            </Field>
          </div>
          <div className="mt-3">
            <Toggle
              checked={form.resolution.fullscreen}
              onChange={(v) => update({ resolution: { ...form.resolution, fullscreen: v } })}
              label="Plein écran"
            />
          </div>
        </Card>

        {/* Effets saisonniers */}
        <Card>
          <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Snowflake size={16} className="accent-text" /> Ambiance saisonnière
          </span>
          <p className="mb-3 text-xs text-slate-500">
            Habille toute l'interface : <span className="text-slate-300">Halloween</span> (ténèbres,
            brume, chauves-souris, éclairs) ou <span className="text-slate-300">Noël</span> (neige,
            guirlandes, foyer chaleureux). « Automatique » s'active selon la date.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SEASONS.map(({ id, label, icon: Icon }) => {
              const active = form.seasonalEffect === id
              return (
                <button
                  key={id}
                  onClick={() => update({ seasonalEffect: id })}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all',
                    active
                      ? 'border-transparent accent-bg text-white shadow-glow'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  )}
                >
                  <Icon size={18} />
                  {label}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Remote config */}
        <Card>
          <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Link2 size={16} className="accent-text" /> Configuration distante
          </span>
          <Field hint="URL du manifest JSON hébergé. Le launcher se met à jour automatiquement depuis cette adresse.">
            <div className="flex gap-2">
              <TextInput
                value={form.manifestUrl}
                onChange={(e) => update({ manifestUrl: e.target.value })}
                placeholder="https://exemple.com/launcher-manifest.json"
              />
              <Button variant="accent" onClick={syncManifest} className="shrink-0" disabled={!form.manifestUrl}>
                <RefreshCw size={16} /> Sync
              </Button>
            </div>
          </Field>
        </Card>

        {/* Maintenance du modpack */}
        <Card>
          <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Wrench size={16} className="accent-text" /> Maintenance du modpack
          </span>
          <p className="mb-3 text-xs text-slate-500">
            Vérifie l&apos;intégrité des mods et ressources (SHA-1) et répare les fichiers manquants
            ou corrompus. La réinstallation force un re-téléchargement complet + une réinstallation
            propre du loader NeoForge.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" onClick={doRepair} disabled={repairing !== null}>
              {repairing === 'repair' ? <Spinner /> : <Wrench size={16} />} Vérifier &amp; réparer
            </Button>
            <Button variant="outline" onClick={doReinstall} disabled={repairing !== null}>
              {repairing === 'reinstall' ? <Spinner /> : <RotateCcw size={16} />} Réinstaller le
              modpack
            </Button>
          </div>
          {repairing && maintenance && (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full accent-gradient transition-all"
                  style={{ width: `${maintenance.percent ?? 0}%` }}
                />
              </div>
              <p className="mt-1.5 truncate font-mono text-[11px] text-slate-500">
                {maintenance.message}
              </p>
            </div>
          )}
        </Card>

        {/* Accès rapide aux dossiers */}
        <Card>
          <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <FolderOpen size={16} className="accent-text" /> Accès rapide aux dossiers
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FOLDERS.map((f) => (
              <Button
                key={f.kind}
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => void window.api.openFolder(f.kind)}
              >
                <FolderOpen size={14} /> {f.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Game dir + advanced */}
        <Card>
          <span className="mb-3 block text-sm font-semibold text-slate-200">Avancé</span>
          <Field label="Dossier du jeu">
            <div className="flex gap-2">
              <TextInput value={form.gameDir} onChange={(e) => update({ gameDir: e.target.value })} />
              <Button variant="outline" onClick={pickDir} className="shrink-0">
                <FolderOpen size={16} />
              </Button>
            </div>
          </Field>
          <Field label="Arguments JVM" className="mt-4">
            <TextArea
              value={form.jvmArgs}
              onChange={(e) => update({ jvmArgs: e.target.value })}
              className="font-mono text-xs"
            />
          </Field>
          <div className="mt-4 space-y-3">
            <Toggle
              checked={form.autoConnect}
              onChange={(v) => update({ autoConnect: v })}
              label="Se connecter automatiquement au serveur au lancement"
            />
            <Toggle
              checked={form.keepLauncherOpen}
              onChange={(v) => update({ keepLauncherOpen: v })}
              label="Garder le launcher ouvert pendant le jeu"
            />
          </div>
        </Card>

        {system && (
          <p className="px-1 text-xs text-slate-600">
            {system.cpu} · {system.cores} cœurs · {(system.totalRamMb / 1024).toFixed(0)} Go RAM ·{' '}
            {system.os} {system.arch}
          </p>
        )}
      </div>
    </div>
  )
}
