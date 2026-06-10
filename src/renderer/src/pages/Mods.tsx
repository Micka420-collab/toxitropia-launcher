import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Package,
  FileBox,
  CheckCircle2,
  CircleDashed,
  FolderOpen,
  Search,
  Download,
  Trash2,
  Power,
  Loader2,
  Check,
  Boxes,
  Lock,
  AlertTriangle
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { Badge, Button, TextInput, Spinner, Toggle } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { InstalledMod, ModrinthHit, ModrinthSearchResult } from '@shared/types'

type Tab = 'modpack' | 'browse' | 'mine'

function fmtSize(bytes?: number): string {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} Mo` : `${(bytes / 1024).toFixed(0)} Ko`
}

function fmtNum(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return String(n)
}

export function Mods(): JSX.Element {
  const manifest = useStore((s) => s.app?.manifest)
  const [tab, setTab] = useState<Tab>('modpack')
  const [installed, setInstalled] = useState<InstalledMod[]>([])

  const refreshInstalled = useCallback(async () => {
    try {
      setInstalled(await window.api.modrinthInstalled())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void refreshInstalled()
  }, [refreshInstalled])

  const version = manifest?.minecraft.version ?? '—'
  const loader = manifest?.minecraft.loader ?? 'vanilla'

  return (
    <div className="px-8 py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Mods</h1>
          <p className="mt-1 text-sm text-slate-400">
            Modpack du serveur, bibliothèque Modrinth et tes mods installés.
          </p>
        </div>
        <button
          onClick={() => window.api.openGameDir()}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
        >
          <FolderOpen size={16} /> Ouvrir le dossier
        </button>
      </div>

      {/* Onglets */}
      <div className="mb-6 inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
        <TabButton active={tab === 'modpack'} onClick={() => setTab('modpack')} icon={Package}>
          Modpack serveur
        </TabButton>
        <TabButton active={tab === 'browse'} onClick={() => setTab('browse')} icon={Search}>
          Bibliothèque
        </TabButton>
        <TabButton active={tab === 'mine'} onClick={() => setTab('mine')} icon={Boxes}>
          Mes mods
          {installed.length > 0 && (
            <span className="ml-1 rounded-full bg-white/10 px-1.5 text-[11px] tabular-nums">
              {installed.length}
            </span>
          )}
        </TabButton>
      </div>

      {tab === 'modpack' && <ModpackTab />}
      {tab === 'browse' && (
        <BrowseTab
          version={version}
          loader={loader}
          installed={installed}
          onChanged={refreshInstalled}
        />
      )}
      {tab === 'mine' && <MineTab installed={installed} onChanged={refreshInstalled} />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children
}: {
  active: boolean
  onClick: () => void
  icon: typeof Package
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-slate-200'
      )}
    >
      <Icon size={15} className={active ? 'accent-text' : ''} />
      {children}
    </button>
  )
}

/* ----------------------------- Onglet Modpack ---------------------------- */

function ModpackTab(): JSX.Element {
  const manifest = useStore((s) => s.app?.manifest)
  const mods = manifest?.mods ?? []
  const resources = manifest?.resources ?? []
  const required = mods.filter((m) => !m.optional).length

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-3">
        <StatCard icon={Package} label="Mods" value={mods.length} sub={`${required} requis`} />
        <StatCard icon={FileBox} label="Ressources" value={resources.length} sub="configs, packs" />
        <StatCard
          label="Sync stricte"
          value={manifest?.enforceModSync ? 'Oui' : 'Non'}
          sub="purge auto"
        />
      </div>

      {mods.length === 0 && resources.length === 0 ? (
        <div className="card grid place-items-center gap-3 p-12 text-center text-slate-500">
          <Package size={40} className="opacity-40" />
          <p className="text-sm">
            Aucun mod imposé par le serveur. Tu peux en ajouter depuis l'onglet{' '}
            <span className="accent-text font-medium">Bibliothèque</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {mods.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mods
              </h2>
              <div className="card divide-y divide-white/5 p-0">
                {mods.map((m, i) => (
                  <div key={`${m.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
                    {m.optional ? (
                      <CircleDashed size={18} className="shrink-0 text-slate-500" />
                    ) : (
                      <CheckCircle2 size={18} className="accent-text shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-100">{m.name}</div>
                      <div className="truncate text-xs text-slate-500">{m.path ?? 'mods'}/</div>
                    </div>
                    {m.size ? (
                      <span className="text-xs text-slate-500">{fmtSize(m.size)}</span>
                    ) : null}
                    <Badge>{m.optional ? 'Optionnel' : 'Requis'}</Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {resources.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ressources & configs
              </h2>
              <div className="card divide-y divide-white/5 p-0">
                {resources.map((r, i) => (
                  <div key={`${r.target}-${i}`} className="flex items-center gap-3 px-4 py-3">
                    <FileBox size={18} className="shrink-0 text-slate-500" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-100">{r.name}</div>
                      <div className="truncate text-xs text-slate-500">{r.target}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}

/* --------------------------- Onglet Bibliothèque -------------------------- */

function BrowseTab({
  version,
  loader,
  installed,
  onChanged
}: {
  version: string
  loader: string
  installed: InstalledMod[]
  onChanged: () => void
}): JSX.Element {
  const setToast = useStore((s) => s.setToast)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<ModrinthSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installing, setInstalling] = useState<Set<string>>(new Set())
  const reqId = useRef(0)

  const installedIds = new Set(installed.map((m) => m.projectId).filter(Boolean) as string[])
  const isVanilla = loader === 'vanilla'

  // Recherche (avec léger debounce). La requête vide renvoie les mods populaires.
  useEffect(() => {
    if (isVanilla) return
    const id = ++reqId.current
    setLoading(true)
    setError(null)
    const t = setTimeout(() => {
      window.api
        .modrinthSearch(query.trim())
        .then((r) => {
          if (id === reqId.current) {
            setResult(r)
            setLoading(false)
          }
        })
        .catch((e) => {
          if (id === reqId.current) {
            setError(e instanceof Error ? e.message : 'Recherche impossible')
            setLoading(false)
          }
        })
    }, 350)
    return () => clearTimeout(t)
  }, [query, isVanilla])

  async function install(hit: ModrinthHit): Promise<void> {
    setInstalling((s) => new Set(s).add(hit.projectId))
    try {
      const r = await window.api.modrinthInstall({
        projectId: hit.projectId,
        slug: hit.slug,
        title: hit.title,
        iconUrl: hit.iconUrl
      })
      setToast({ kind: 'ok', text: `« ${r.title} » installé` })
      onChanged()
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Installation impossible' })
    } finally {
      setInstalling((s) => {
        const n = new Set(s)
        n.delete(hit.projectId)
        return n
      })
    }
  }

  if (isVanilla) {
    return (
      <div className="card grid place-items-center gap-3 p-12 text-center text-slate-400">
        <AlertTriangle size={36} className="text-amber-400/80" />
        <p className="max-w-md text-sm">
          Le serveur est configuré en <b className="text-white">vanilla</b> (sans loader de mods).
          Passe sur Fabric, Forge, NeoForge ou Quilt dans le panneau Admin pour installer des mods.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un mod sur Modrinth (ex. sodium, JEI, create…)"
            className="pl-9"
          />
        </div>
        <Badge className="shrink-0">
          {version} · {loader}
        </Badge>
      </div>

      {error && (
        <div className="card mb-4 flex items-center gap-2 border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading && !result ? (
        <div className="grid place-items-center py-16 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      ) : result && result.hits.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          Aucun mod trouvé pour cette recherche et cette version.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {result?.hits.map((hit) => {
            const done = installedIds.has(hit.projectId)
            const busy = installing.has(hit.projectId)
            return (
              <div key={hit.projectId} className="card flex gap-3.5 p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                  {hit.iconUrl ? (
                    <img src={hit.iconUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-slate-500">
                      <Package size={24} />
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => window.api.openExternal(`https://modrinth.com/mod/${hit.slug}`)}
                      className="truncate text-left text-sm font-semibold text-white hover:underline"
                      title="Voir sur Modrinth"
                    >
                      {hit.title}
                    </button>
                    <span className="shrink-0 text-[11px] text-slate-500">
                      ⬇ {fmtNum(hit.downloads)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                    {hit.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="truncate text-[11px] text-slate-500">par {hit.author}</span>
                    {done ? (
                      <Button size="sm" variant="outline" disabled className="!opacity-70">
                        <Check size={14} /> Installé
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="accent"
                        disabled={busy}
                        onClick={() => install(hit)}
                      >
                        {busy ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                        Installer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

/* ----------------------------- Onglet Mes mods --------------------------- */

function MineTab({
  installed,
  onChanged
}: {
  installed: InstalledMod[]
  onChanged: () => void
}): JSX.Element {
  const setToast = useStore((s) => s.setToast)
  const [busy, setBusy] = useState<Set<string>>(new Set())

  function mark(file: string, on: boolean): void {
    setBusy((s) => {
      const n = new Set(s)
      if (on) n.add(file)
      else n.delete(file)
      return n
    })
  }

  async function toggle(m: InstalledMod): Promise<void> {
    mark(m.filename, true)
    try {
      await window.api.modrinthToggle(m.filename, !m.enabled)
      onChanged()
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Action impossible' })
    } finally {
      mark(m.filename, false)
    }
  }

  async function remove(m: InstalledMod): Promise<void> {
    mark(m.filename, true)
    try {
      await window.api.modrinthRemove(m.filename)
      setToast({ kind: 'ok', text: `« ${m.title ?? m.filename} » supprimé` })
      onChanged()
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Suppression impossible' })
    } finally {
      mark(m.filename, false)
    }
  }

  if (installed.length === 0) {
    return (
      <div className="card grid place-items-center gap-3 p-12 text-center text-slate-500">
        <Boxes size={40} className="opacity-40" />
        <p className="text-sm">
          Aucun mod installé. Ajoute-en depuis l'onglet{' '}
          <span className="accent-text font-medium">Bibliothèque</span>.
        </p>
      </div>
    )
  }

  return (
    <div className="card divide-y divide-white/5 p-0">
      {installed.map((m) => {
        const working = busy.has(m.filename)
        return (
          <div
            key={m.filename}
            className={cn('flex items-center gap-3.5 px-4 py-3', !m.enabled && 'opacity-55')}
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5">
              {m.iconUrl ? (
                <img src={m.iconUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-slate-500">
                  <Package size={18} />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-slate-100">
                  {m.title ?? m.filename}
                </span>
                {m.managed && (
                  <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-300">
                    <Lock size={11} /> Serveur
                  </Badge>
                )}
                {m.versionNumber && <span className="text-[11px] text-slate-500">{m.versionNumber}</span>}
              </div>
              <div className="truncate text-xs text-slate-500">
                {m.filename}
                {m.sizeBytes ? ` · ${fmtSize(m.sizeBytes)}` : ''}
              </div>
            </div>

            {m.managed ? (
              <span className="text-[11px] text-slate-500">Géré par le serveur</span>
            ) : working ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : (
              <div className="flex items-center gap-3">
                <span title={m.enabled ? 'Activé' : 'Désactivé'}>
                  <Toggle checked={m.enabled} onChange={() => toggle(m)} />
                </span>
                <button
                  onClick={() => remove(m)}
                  title="Supprimer"
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-red-500/20 hover:text-red-300"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        )
      })}
      <div className="flex items-center gap-2 px-4 py-2.5 text-[11px] text-slate-500">
        <Power size={12} /> Désactiver renomme le fichier en « .disabled » : Minecraft l'ignore au
        lancement.
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub
}: {
  icon?: typeof Package
  label: string
  value: number | string
  sub: string
}): JSX.Element {
  return (
    <div className="card flex items-center gap-3 px-5 py-4">
      {Icon && (
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 accent-text">
          <Icon size={20} />
        </span>
      )}
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-slate-500">
          {label} · {sub}
        </div>
      </div>
    </div>
  )
}
