import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ShieldCheck,
  Lock,
  Save,
  Upload,
  Download,
  Hammer,
  Plus,
  Trash2,
  Server,
  Boxes,
  Palette,
  Newspaper,
  FileBox,
  KeyRound,
  Loader2,
  Terminal
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card, Field, TextInput, TextArea, Select, Toggle, Button, Badge } from '@/components/ui'
import { DEFAULT_MANIFEST } from '@shared/defaults'
import type { LauncherManifest, LoaderType, ModFile, ResourceFile, NewsItem } from '@shared/types'

const LOADERS: LoaderType[] = ['vanilla', 'fabric', 'forge', 'neoforge', 'quilt']

export function Admin(): JSX.Element {
  const unlocked = useStore((s) => s.app?.adminUnlocked ?? false)
  if (!unlocked) return <Gate />
  return <Editor />
}

/* ---------------- Gate ---------------- */

function Gate(): JSX.Element {
  const setToast = useStore((s) => s.setToast)
  const [hasPw, setHasPw] = useState<boolean | null>(null)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void window.api.adminHasPassword().then(setHasPw)
  }, [])

  async function create(): Promise<void> {
    if (pw.length < 4) return setToast({ kind: 'err', text: 'Mot de passe trop court (min 4)' })
    if (pw !== pw2) return setToast({ kind: 'err', text: 'Les mots de passe ne correspondent pas' })
    setBusy(true)
    try {
      await window.api.adminSetPassword(pw)
      await window.api.adminUnlock(pw)
      setToast({ kind: 'ok', text: 'Mot de passe admin créé' })
    } finally {
      setBusy(false)
    }
  }

  async function unlock(): Promise<void> {
    setBusy(true)
    try {
      const ok = await window.api.adminUnlock(pw)
      if (!ok) setToast({ kind: 'err', text: 'Mot de passe incorrect' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid h-full place-items-center px-8">
      <Card className="w-[400px]">
        <div className="mb-4 flex flex-col items-center text-center">
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl accent-gradient text-white shadow-glow">
            <ShieldCheck size={26} />
          </span>
          <h1 className="text-lg font-bold text-white">Panneau Administrateur</h1>
          <p className="mt-1 text-sm text-slate-400">
            {hasPw === false
              ? 'Crée un mot de passe pour protéger la configuration.'
              : 'Entre le mot de passe pour accéder à la configuration.'}
          </p>
        </div>

        {hasPw === null ? (
          <div className="grid place-items-center py-4">
            <Loader2 className="animate-spin text-slate-500" />
          </div>
        ) : hasPw ? (
          <div className="space-y-3">
            <TextInput
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && unlock()}
              placeholder="Mot de passe"
              autoFocus
            />
            <Button variant="accent" onClick={unlock} disabled={busy} className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Déverrouiller
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <TextInput
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Nouveau mot de passe"
              autoFocus
            />
            <TextInput
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              placeholder="Confirmer"
            />
            <Button variant="accent" onClick={create} disabled={busy} className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              Créer le mot de passe
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ---------------- Editor ---------------- */

function Editor(): JSX.Element {
  const stored = useStore((s) => s.app?.manifest)
  const buildLog = useStore((s) => s.buildLog)
  const setToast = useStore((s) => s.setToast)

  const [m, setM] = useState<LauncherManifest>(stored ?? DEFAULT_MANIFEST)
  const [saving, setSaving] = useState(false)
  const [building, setBuilding] = useState(false)
  const [canBuild, setCanBuild] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void window.api.canBuild().then(setCanBuild)
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [buildLog])

  function set(patch: Partial<LauncherManifest>): void {
    setM((prev) => ({ ...prev, ...patch }))
  }

  async function save(): Promise<void> {
    setSaving(true)
    try {
      await window.api.saveLocalManifest({ ...m, updatedAt: new Date().toISOString() })
      setToast({ kind: 'ok', text: 'Configuration enregistrée' })
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Échec' })
    } finally {
      setSaving(false)
    }
  }

  async function exportManifest(): Promise<void> {
    const dest = await window.api.exportManifest({ ...m, updatedAt: new Date().toISOString() })
    if (dest) setToast({ kind: 'ok', text: `Exporté : ${dest}` })
  }

  async function importManifest(): Promise<void> {
    const imported = await window.api.importManifest()
    if (imported) {
      setM(imported)
      setToast({ kind: 'ok', text: 'Manifest importé' })
    }
  }

  async function build(): Promise<void> {
    setBuilding(true)
    try {
      const res = await window.api.buildExe()
      setToast({
        kind: res.code === 0 ? 'ok' : 'err',
        text: res.code === 0 ? 'Build terminé — voir dossier dist/' : 'Le build a échoué'
      })
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Build impossible' })
    } finally {
      setBuilding(false)
    }
  }

  async function lock(): Promise<void> {
    await window.api.adminLock()
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      {/* Header / actions */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <ShieldCheck className="accent-text" size={24} /> Administration
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure le launcher pour tous les joueurs, puis exporte le manifest ou génère le .exe.
          </p>
        </div>
        <button onClick={lock} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
          <Lock size={13} /> Verrouiller
        </button>
      </div>

      <div className="sticky top-0 z-10 -mx-8 mb-6 flex flex-wrap gap-2 border-b border-white/5 bg-surface-950/80 px-8 pb-4 backdrop-blur">
        <Button variant="accent" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Enregistrer
        </Button>
        <Button variant="outline" onClick={exportManifest}>
          <Download size={16} /> Exporter le manifest
        </Button>
        <Button variant="outline" onClick={importManifest}>
          <Upload size={16} /> Importer
        </Button>
        <div className="flex-1" />
        {canBuild ? (
          <Button variant="primary" onClick={build} disabled={building}>
            {building ? <Loader2 size={16} className="animate-spin" /> : <Hammer size={16} />}
            Générer le .exe
          </Button>
        ) : (
          <Badge>Build dispo depuis les sources</Badge>
        )}
      </div>

      <div className="space-y-5">
        {/* Server */}
        <Section icon={Server} title="Serveur">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_120px]">
            <Field label="Nom">
              <TextInput value={m.server.name} onChange={(e) => set({ server: { ...m.server, name: e.target.value } })} />
            </Field>
            <Field label="Adresse IP">
              <TextInput value={m.server.ip} onChange={(e) => set({ server: { ...m.server, ip: e.target.value } })} />
            </Field>
            <Field label="Port">
              <TextInput
                type="number"
                value={m.server.port}
                onChange={(e) => set({ server: { ...m.server, port: Number(e.target.value) || 25565 } })}
              />
            </Field>
          </div>
        </Section>

        {/* Minecraft */}
        <Section icon={Boxes} title="Minecraft & Mod loader">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Version">
              <TextInput
                value={m.minecraft.version}
                onChange={(e) => set({ minecraft: { ...m.minecraft, version: e.target.value } })}
                placeholder="1.20.1"
              />
            </Field>
            <Field label="Loader">
              <Select
                value={m.minecraft.loader}
                onChange={(e) => set({ minecraft: { ...m.minecraft, loader: e.target.value as LoaderType } })}
              >
                {LOADERS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Version du loader" hint="Vide = dernière">
              <TextInput
                value={m.minecraft.loaderVersion ?? ''}
                onChange={(e) => set({ minecraft: { ...m.minecraft, loaderVersion: e.target.value } })}
                placeholder="auto"
              />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Java recommandé">
              <TextInput
                type="number"
                value={m.java.recommendedMajor}
                onChange={(e) => set({ java: { ...m.java, recommendedMajor: Number(e.target.value) || 17 } })}
              />
            </Field>
            <Field label="RAM recommandée (Mo)">
              <TextInput
                type="number"
                value={m.recommendedRamMb}
                onChange={(e) => set({ recommendedRamMb: Number(e.target.value) || 4096 })}
              />
            </Field>
            <div className="flex flex-col justify-end gap-3 pb-1">
              <Toggle
                checked={m.java.autoDownload}
                onChange={(v) => set({ java: { ...m.java, autoDownload: v } })}
                label="Télécharger Java auto"
              />
            </div>
          </div>
          <div className="mt-3">
            <Toggle
              checked={m.enforceModSync}
              onChange={(v) => set({ enforceModSync: v })}
              label="Synchronisation stricte (supprime les mods non listés)"
            />
          </div>
        </Section>

        {/* Branding */}
        <Section icon={Palette} title="Apparence (branding)">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nom de l'application">
              <TextInput
                value={m.branding.appName}
                onChange={(e) => set({ branding: { ...m.branding, appName: e.target.value } })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="Couleur primaire"
                value={m.branding.primaryColor}
                onChange={(v) => set({ branding: { ...m.branding, primaryColor: v } })}
              />
              <ColorField
                label="Couleur accent"
                value={m.branding.accentColor}
                onChange={(v) => set({ branding: { ...m.branding, accentColor: v } })}
              />
            </div>
            <Field label="Logo (URL)">
              <TextInput
                value={m.branding.logoUrl ?? ''}
                onChange={(e) => set({ branding: { ...m.branding, logoUrl: e.target.value } })}
              />
            </Field>
            <Field label="Image de fond (URL)">
              <TextInput
                value={m.branding.backgroundUrl ?? ''}
                onChange={(e) => set({ branding: { ...m.branding, backgroundUrl: e.target.value } })}
              />
            </Field>
            <Field label="Discord (URL)">
              <TextInput
                value={m.branding.discordUrl ?? ''}
                onChange={(e) => set({ branding: { ...m.branding, discordUrl: e.target.value } })}
              />
            </Field>
            <Field label="Site web (URL)">
              <TextInput
                value={m.branding.websiteUrl ?? ''}
                onChange={(e) => set({ branding: { ...m.branding, websiteUrl: e.target.value } })}
              />
            </Field>
          </div>
        </Section>

        {/* Mods */}
        <Section icon={Boxes} title={`Mods (${m.mods.length})`}>
          <ListEditor<ModFile>
            items={m.mods}
            onChange={(mods) => set({ mods })}
            empty="Aucun mod. Ajoute des URLs de téléchargement direct (.jar)."
            blank={{ name: '', url: '', path: 'mods', optional: false }}
            addLabel="Ajouter un mod"
            render={(mod, upd) => (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.3fr_2fr]">
                <TextInput placeholder="Nom" value={mod.name} onChange={(e) => upd({ name: e.target.value })} />
                <TextInput placeholder="URL (.jar)" value={mod.url} onChange={(e) => upd({ url: e.target.value })} />
                <TextInput placeholder="Dossier (mods)" value={mod.path ?? ''} onChange={(e) => upd({ path: e.target.value })} />
                <div className="flex items-center gap-3">
                  <TextInput placeholder="sha1 (optionnel)" value={mod.sha1 ?? ''} onChange={(e) => upd({ sha1: e.target.value })} className="font-mono text-xs" />
                  <Toggle checked={!!mod.optional} onChange={(v) => upd({ optional: v })} label="Opt." />
                </div>
              </div>
            )}
          />
        </Section>

        {/* Resources */}
        <Section icon={FileBox} title={`Ressources & configs (${m.resources.length})`}>
          <ListEditor<ResourceFile>
            items={m.resources}
            onChange={(resources) => set({ resources })}
            empty="Aucune ressource. Ex: config/mod.toml, resourcepacks/pack.zip."
            blank={{ name: '', url: '', target: '' }}
            addLabel="Ajouter une ressource"
            render={(r, upd) => (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <TextInput placeholder="Nom" value={r.name} onChange={(e) => upd({ name: e.target.value })} />
                <TextInput placeholder="URL" value={r.url} onChange={(e) => upd({ url: e.target.value })} />
                <TextInput placeholder="Chemin cible" value={r.target} onChange={(e) => upd({ target: e.target.value })} />
              </div>
            )}
          />
        </Section>

        {/* News */}
        <Section icon={Newspaper} title={`Actualités (${m.news.length})`}>
          <ListEditor<NewsItem>
            items={m.news}
            onChange={(news) => set({ news })}
            empty="Aucune actualité."
            blank={() => ({
              id: Math.random().toString(36).slice(2, 9),
              title: '',
              body: '',
              date: new Date().toISOString().slice(0, 10),
              tag: ''
            })}
            addLabel="Ajouter une actualité"
            render={(n, upd) => (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_140px]">
                  <TextInput placeholder="Titre" value={n.title} onChange={(e) => upd({ title: e.target.value })} />
                  <TextInput placeholder="Tag" value={n.tag ?? ''} onChange={(e) => upd({ tag: e.target.value })} />
                  <TextInput type="date" value={n.date} onChange={(e) => upd({ date: e.target.value })} />
                </div>
                <TextInput placeholder="Image (URL, optionnel)" value={n.image ?? ''} onChange={(e) => upd({ image: e.target.value })} />
                <TextArea placeholder="Contenu" value={n.body} onChange={(e) => upd({ body: e.target.value })} />
              </div>
            )}
          />
        </Section>

        {/* Build console */}
        {(building || buildLog) && (
          <Section icon={Terminal} title="Sortie du build">
            <div
              ref={logRef}
              className="max-h-72 overflow-y-auto rounded-xl bg-surface-950 p-3 font-mono text-xs leading-relaxed text-slate-400"
            >
              <pre className="whitespace-pre-wrap break-all">{buildLog || 'Démarrage…'}</pre>
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

/* ---------------- Reusable bits ---------------- */

function Section({
  icon: Icon,
  title,
  children
}: {
  icon: typeof Server
  title: string
  children: ReactNode
}): JSX.Element {
  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Icon size={16} className="accent-text" /> {title}
      </h2>
      {children}
    </Card>
  )
}

function ColorField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (v: string) => void
}): JSX.Element {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="no-drag h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-surface-900"
        />
        <TextInput value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </Field>
  )
}

function ListEditor<T>({
  items,
  onChange,
  render,
  blank,
  addLabel,
  empty
}: {
  items: T[]
  onChange: (items: T[]) => void
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode
  blank: T | (() => T)
  addLabel: string
  empty: string
}): JSX.Element {
  function add(): void {
    const item = typeof blank === 'function' ? (blank as () => T)() : { ...(blank as T) }
    onChange([...items, item])
  }
  function update(i: number, patch: Partial<T>): void {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }
  function remove(i: number): void {
    onChange(items.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-xs text-slate-500">{empty}</p>}
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="min-w-0 flex-1">{render(item, (patch) => update(i, patch))}</div>
          <button
            onClick={() => remove(i)}
            className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-red-500/20 hover:text-red-300"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={add}>
        <Plus size={15} /> {addLabel}
      </Button>
    </div>
  )
}
