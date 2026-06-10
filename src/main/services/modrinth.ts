import { join } from 'path'
import { readdir, rename, rm, stat } from 'fs/promises'
import type {
  InstalledMod,
  LauncherManifest,
  ModrinthHit,
  ModrinthInstallResult,
  ModrinthSearchResult
} from '@shared/types'
import { downloadFile, ensureDir, fileExists, readJson, writeJson } from '../util'

const API = 'https://api.modrinth.com/v2'
// Modrinth demande un User-Agent descriptif (cf. docs.modrinth.com).
const UA = 'survival-launcher/1.0.0 (Minecraft launcher)'
const USER_INDEX = '.launcher-userMods.json'
const MANAGED_INDEX = '.launcher-managed.json'
const DISABLED = '.disabled'

interface UserIndex {
  mods: Record<
    string,
    { projectId?: string; title?: string; iconUrl?: string | null; versionNumber?: string }
  >
}

async function modrinthGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal,
    redirect: 'follow'
  })
  if (!res.ok) throw new Error(`Modrinth a répondu HTTP ${res.status}`)
  return (await res.json()) as T
}

interface RawHit {
  project_id: string
  slug: string
  title: string
  description: string
  author: string
  downloads: number
  follows: number
  icon_url?: string | null
  categories?: string[]
  client_side?: string
  server_side?: string
}

export async function searchMods(
  opts: { query: string; gameVersion: string; loader: string; offset?: number; limit?: number },
  signal?: AbortSignal
): Promise<ModrinthSearchResult> {
  const facets: string[][] = [['project_type:mod']]
  if (opts.gameVersion) facets.push([`versions:${opts.gameVersion}`])
  if (opts.loader && opts.loader !== 'vanilla') facets.push([`categories:${opts.loader}`])

  const limit = opts.limit ?? 20
  const offset = opts.offset ?? 0
  const params = new URLSearchParams({
    query: opts.query,
    facets: JSON.stringify(facets),
    limit: String(limit),
    offset: String(offset),
    index: 'relevance'
  })

  const raw = await modrinthGet<{ hits: RawHit[]; total_hits: number }>(
    `/search?${params.toString()}`,
    signal
  )
  const hits: ModrinthHit[] = raw.hits.map((h) => ({
    projectId: h.project_id,
    slug: h.slug,
    title: h.title,
    description: h.description,
    author: h.author,
    downloads: h.downloads,
    follows: h.follows,
    iconUrl: h.icon_url || null,
    categories: h.categories ?? [],
    clientSide: h.client_side ?? 'unknown',
    serverSide: h.server_side ?? 'unknown'
  }))
  return { hits, total: raw.total_hits, offset, limit }
}

interface RawVersion {
  id: string
  version_number: string
  name: string
  date_published: string
  loaders: string[]
  game_versions: string[]
  files: { url: string; filename: string; primary: boolean; size: number; hashes?: { sha1?: string } }[]
}

async function bestVersion(
  idOrSlug: string,
  gameVersion: string,
  loader: string,
  signal?: AbortSignal
): Promise<RawVersion | null> {
  const params = new URLSearchParams()
  if (loader && loader !== 'vanilla') params.set('loaders', JSON.stringify([loader]))
  if (gameVersion) params.set('game_versions', JSON.stringify([gameVersion]))
  const versions = await modrinthGet<RawVersion[]>(
    `/project/${encodeURIComponent(idOrSlug)}/version?${params.toString()}`,
    signal
  )
  // Modrinth renvoie les versions les plus récentes en premier.
  return versions[0] ?? null
}

export async function installMod(
  opts: {
    gameDir: string
    projectId: string
    slug: string
    title: string
    iconUrl?: string | null
    gameVersion: string
    loader: string
  },
  signal?: AbortSignal
): Promise<ModrinthInstallResult> {
  const version = await bestVersion(opts.slug || opts.projectId, opts.gameVersion, opts.loader, signal)
  if (!version) {
    throw new Error(
      `Aucune version compatible (${opts.gameVersion} · ${opts.loader}) pour « ${opts.title} ».`
    )
  }
  const file =
    version.files.find((f) => f.primary && f.filename.endsWith('.jar')) ||
    version.files.find((f) => f.filename.endsWith('.jar')) ||
    version.files[0]
  if (!file) throw new Error(`Aucun fichier téléchargeable pour « ${opts.title} ».`)

  const modsDir = join(opts.gameDir, 'mods')
  await ensureDir(modsDir)
  const dest = join(modsDir, file.filename)
  await downloadFile(file.url, dest, { sha1: file.hashes?.sha1, signal })
  // Si une copie désactivée traînait, on la retire.
  await rm(`${dest}${DISABLED}`, { force: true }).catch(() => undefined)

  const idxPath = join(opts.gameDir, USER_INDEX)
  const idx = (await readJson<UserIndex>(idxPath)) ?? { mods: {} }
  idx.mods[file.filename] = {
    projectId: opts.projectId,
    title: opts.title,
    iconUrl: opts.iconUrl ?? null,
    versionNumber: version.version_number
  }
  await writeJson(idxPath, idx)

  return { filename: file.filename, title: opts.title }
}

function canonical(name: string): string {
  return name.endsWith(DISABLED) ? name.slice(0, -DISABLED.length) : name
}

export async function listInstalled(
  gameDir: string,
  _manifest: LauncherManifest | null
): Promise<InstalledMod[]> {
  const modsDir = join(gameDir, 'mods')
  let entries: string[]
  try {
    entries = await readdir(modsDir)
  } catch {
    return []
  }

  const idx = (await readJson<UserIndex>(join(gameDir, USER_INDEX))) ?? { mods: {} }

  // Fichiers gérés par le modpack serveur (lecture seule côté utilisateur).
  const managed = new Set<string>()
  const mi = await readJson<{ files: string[] }>(join(gameDir, MANAGED_INDEX))
  for (const f of mi?.files ?? []) {
    const norm = f.replace(/\\/g, '/')
    if (norm.startsWith('mods/')) managed.add(norm.slice('mods/'.length))
  }

  const out: InstalledMod[] = []
  for (const name of entries) {
    if (!name.endsWith('.jar') && !name.endsWith(`.jar${DISABLED}`)) continue
    const base = canonical(name)
    const enabled = !name.endsWith(DISABLED)
    let sizeBytes = 0
    try {
      sizeBytes = (await stat(join(modsDir, name))).size
    } catch {
      /* ignore */
    }
    const meta = idx.mods[base]
    out.push({
      filename: base,
      enabled,
      sizeBytes,
      projectId: meta?.projectId,
      title: meta?.title,
      iconUrl: meta?.iconUrl ?? null,
      versionNumber: meta?.versionNumber,
      source: meta ? 'modrinth' : 'manual',
      managed: managed.has(base)
    })
  }
  out.sort((a, b) => (a.title ?? a.filename).localeCompare(b.title ?? b.filename))
  return out
}

export async function setModEnabled(
  gameDir: string,
  filename: string,
  enabled: boolean
): Promise<void> {
  const base = canonical(filename)
  const modsDir = join(gameDir, 'mods')
  const enabledPath = join(modsDir, base)
  const disabledPath = `${enabledPath}${DISABLED}`
  if (enabled) {
    if (await fileExists(disabledPath)) await rename(disabledPath, enabledPath)
  } else if (await fileExists(enabledPath)) {
    await rename(enabledPath, disabledPath)
  }
}

export async function removeMod(gameDir: string, filename: string): Promise<void> {
  const base = canonical(filename)
  const modsDir = join(gameDir, 'mods')
  await rm(join(modsDir, base), { force: true }).catch(() => undefined)
  await rm(join(modsDir, `${base}${DISABLED}`), { force: true }).catch(() => undefined)

  const idxPath = join(gameDir, USER_INDEX)
  const idx = await readJson<UserIndex>(idxPath)
  if (idx?.mods?.[base]) {
    delete idx.mods[base]
    await writeJson(idxPath, idx)
  }
}
