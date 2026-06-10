import { join, basename } from 'path'
import { readdir, stat, rm } from 'fs/promises'
import type { Screenshot } from '@shared/types'

const IMAGE_RE = /\.(png|jpe?g|webp)$/i

/** Liste les captures d'écran (gameDir/screenshots), les plus récentes d'abord. */
export async function listScreenshots(gameDir: string): Promise<Screenshot[]> {
  const dir = join(gameDir, 'screenshots')
  let names: string[]
  try {
    names = await readdir(dir)
  } catch {
    return [] // dossier inexistant : aucune capture
  }
  const shots: Screenshot[] = []
  for (const name of names) {
    if (!IMAGE_RE.test(name)) continue
    try {
      const s = await stat(join(dir, name))
      if (s.isFile()) shots.push({ name, mtimeMs: s.mtimeMs, sizeBytes: s.size })
    } catch {
      /* fichier disparu entre-temps : on l'ignore */
    }
  }
  return shots.sort((a, b) => b.mtimeMs - a.mtimeMs)
}

/** Résout en toute sécurité un nom de capture vers son chemin absolu (anti-traversal). */
export function screenshotPath(gameDir: string, name: string): string {
  return join(gameDir, 'screenshots', basename(name))
}

/** Supprime une capture d'écran. */
export async function deleteScreenshot(gameDir: string, name: string): Promise<void> {
  await rm(screenshotPath(gameDir, name), { force: true })
}
