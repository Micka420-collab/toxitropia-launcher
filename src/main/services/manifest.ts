import type { LauncherManifest } from '@shared/types'
import { DEFAULT_MANIFEST, SCHEMA_VERSION } from '@shared/defaults'
import { fetchJson, writeJson } from '../util'

export function normalizeManifest(input: Partial<LauncherManifest> | null | undefined): LauncherManifest {
  const m = input ?? {}
  return {
    schemaVersion: m.schemaVersion ?? SCHEMA_VERSION,
    updatedAt: m.updatedAt ?? new Date().toISOString(),
    server: { ...DEFAULT_MANIFEST.server, ...(m.server ?? {}) },
    minecraft: { ...DEFAULT_MANIFEST.minecraft, ...(m.minecraft ?? {}) },
    java: { ...DEFAULT_MANIFEST.java, ...(m.java ?? {}) },
    mods: Array.isArray(m.mods) ? m.mods : [],
    resources: Array.isArray(m.resources) ? m.resources : [],
    enforceModSync: m.enforceModSync ?? true,
    branding: { ...DEFAULT_MANIFEST.branding, ...(m.branding ?? {}) },
    news: Array.isArray(m.news) ? m.news : [],
    recommendedRamMb: m.recommendedRamMb ?? DEFAULT_MANIFEST.recommendedRamMb
  }
}

export async function fetchManifest(url: string, signal?: AbortSignal): Promise<LauncherManifest> {
  const raw = await fetchJson<Partial<LauncherManifest>>(url, signal)
  return normalizeManifest(raw)
}

export async function exportManifest(manifest: LauncherManifest, dest: string): Promise<void> {
  await writeJson(dest, normalizeManifest({ ...manifest, updatedAt: new Date().toISOString() }))
}
