import { join } from 'path'
import { rm, readdir } from 'fs/promises'
import type { LauncherManifest, ProgressEvent, RepairResult } from '@shared/types'
import { downloadFile, readJson, writeJson } from '../util'

type Emit = (e: ProgressEvent) => void

interface ManagedIndex {
  files: string[]
}

interface SyncItem {
  url: string
  rel: string
  sha1?: string
}

/**
 * Synchronise le modpack (mods + ressources) vers gameDir.
 * - Les fichiers déjà présents et valides (sha1) sont laissés tels quels.
 * - Les fichiers manquants ou corrompus sont (re)téléchargés.
 * - Si enforceModSync, les fichiers gérés disparus du manifeste sont supprimés.
 * Renvoie un résumé utilisable pour un retour « vérifier / réparer ».
 */
export async function syncModpack(
  manifest: LauncherManifest,
  gameDir: string,
  emit: Emit,
  signal?: AbortSignal
): Promise<RepairResult> {
  const items: SyncItem[] = []

  for (const mod of manifest.mods) {
    if (mod.optional && mod.enabled === false) continue
    const folder = (mod.path || 'mods').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
    items.push({ url: mod.url, rel: `${folder}/${mod.name}`, sha1: mod.sha1 })
  }
  for (const res of manifest.resources) {
    items.push({ url: res.url, rel: res.target.replace(/\\/g, '/').replace(/^\/+/, ''), sha1: res.sha1 })
  }

  const total = items.length
  const managedNow: string[] = []
  let downloaded = 0
  let i = 0
  for (const it of items) {
    if (signal?.aborted) throw new Error('Lancement annulé')
    i++
    emit({
      phase: 'mods',
      message: it.rel,
      current: i,
      total,
      percent: Math.round((i / Math.max(total, 1)) * 100)
    })
    const didDownload = await downloadFile(it.url, join(gameDir, it.rel), { sha1: it.sha1, signal })
    if (didDownload) downloaded++
    managedNow.push(it.rel)
  }

  const idxPath = join(gameDir, '.launcher-managed.json')
  const prev = (await readJson<ManagedIndex>(idxPath))?.files ?? []
  let removed = 0
  if (manifest.enforceModSync) {
    const stale = prev.filter((p) => !managedNow.includes(p))
    for (const s of stale) {
      await rm(join(gameDir, s), { force: true }).catch(() => undefined)
      removed++
    }
  }
  await writeJson(idxPath, { files: managedNow })

  return { total, downloaded, removed }
}

/**
 * Réinstallation propre : supprime tous les fichiers gérés (mods + ressources du
 * manifeste), l'index de gestion et les versions NeoForge/loader installées, afin
 * de forcer un re-téléchargement complet et une réinstallation du loader au prochain
 * lancement. Les mods ajoutés à la main par le joueur sont préservés.
 */
export async function wipeManagedFiles(gameDir: string): Promise<number> {
  let removed = 0
  const idxPath = join(gameDir, '.launcher-managed.json')
  const managed = (await readJson<ManagedIndex>(idxPath))?.files ?? []
  for (const rel of managed) {
    await rm(join(gameDir, rel), { force: true })
      .then(() => {
        removed++
      })
      .catch(() => undefined)
  }
  await rm(idxPath, { force: true }).catch(() => undefined)

  // Versions du loader (NeoForge/Forge/Fabric/Quilt) : on supprime les dossiers
  // générés pour forcer une réinstallation propre du loader au prochain lancement.
  const versionsDir = join(gameDir, 'versions')
  try {
    for (const entry of await readdir(versionsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      if (/^(neoforge|forge|fabric|quilt)-/i.test(entry.name)) {
        await rm(join(versionsDir, entry.name), { recursive: true, force: true }).catch(() => undefined)
        removed++
      }
    }
  } catch {
    /* pas de dossier versions : rien à nettoyer */
  }

  return removed
}
