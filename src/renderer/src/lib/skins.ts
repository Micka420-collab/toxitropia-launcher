/// <reference types="vite/client" />
import skinsData from '@/assets/skins/skins.json'

interface RawSkin {
  id: number
  file: string
  thumb: string
  name: string
  theme: string
}
const data = skinsData as { default: number; skins: RawSkin[] }

// Vite : URLs des PNG embarqués (skin complet + vignette de face).
const skinUrls = import.meta.glob('../assets/skins/skin-*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>
const thumbUrls = import.meta.glob('../assets/skins/thumb-*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

function urlFor(map: Record<string, string>, file: string): string {
  const hit = Object.entries(map).find(([k]) => k.endsWith('/' + file))
  return hit ? hit[1] : ''
}

export interface SkinEntry {
  id: number
  name: string
  theme: string
  url: string
  thumb: string
}

export const SKINS: SkinEntry[] = data.skins.map((s) => ({
  id: s.id,
  name: s.name,
  theme: s.theme,
  url: urlFor(skinUrls, s.file),
  thumb: urlFor(thumbUrls, s.thumb)
}))

export const DEFAULT_SKIN = data.default ?? 0

/** Lit le PNG du skin choisi et l'envoie au main (stocké pour les comptes hors-ligne). */
export async function applySkin(id: number): Promise<void> {
  const s = SKINS.find((x) => x.id === id)
  if (!s) return
  const bytes = new Uint8Array(await (await fetch(s.url)).arrayBuffer())
  await window.api.setSkin(id, bytes)
}
