import type { LauncherManifest } from './types'
import { DEFAULT_MANIFEST } from './defaults'

export const LEGACY_MANIFEST_URL = 'http://82.67.63.61:8090/distribution.json'

/** Only migrate the shipped endpoint/profile, never a custom remote source. */
export function migrateBuiltInProfile(
  manifest: LauncherManifest | null,
  manifestUrl: string,
  gameDir: string,
  oldDefaultDir: string,
  newDefaultDir: string
): { manifest: LauncherManifest; manifestUrl: string; gameDir: string } {
  const oldFactory = manifest?.server?.ip === '82.67.63.61' &&
    manifest.server.port === 25569 && manifest.server.name === 'Zarn' &&
    manifest.minecraft?.version === '1.21.1' && manifest.minecraft.loader === 'neoforge' &&
    manifest.minecraft.loaderVersion === '21.1.233'
  const migrate = (!manifest && manifestUrl === LEGACY_MANIFEST_URL) ||
    (oldFactory && (!manifestUrl || manifestUrl === LEGACY_MANIFEST_URL))
  return {
    manifest: migrate || !manifest ? structuredClone(DEFAULT_MANIFEST) : manifest,
    manifestUrl: migrate && manifestUrl === LEGACY_MANIFEST_URL ? '' : manifestUrl,
    gameDir: migrate && gameDir === oldDefaultDir ? newDefaultDir : gameDir
  }
}
