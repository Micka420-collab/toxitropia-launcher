import type { NowPlaying } from '@shared/types'

/**
 * Récupère le morceau en cours sur une station SomaFM via le flux XML public
 * (https://somafm.com/songs/<id>.xml). Le parsing est volontairement tolérant
 * (regex + CDATA) pour éviter une dépendance XML. Renvoie null en cas d'échec.
 */
export async function fetchNowPlaying(
  channelId: string,
  signal?: AbortSignal
): Promise<NowPlaying | null> {
  if (!/^[a-z0-9]+$/i.test(channelId)) return null
  try {
    const res = await fetch(`https://somafm.com/songs/${channelId}.xml`, {
      signal,
      redirect: 'follow'
    })
    if (!res.ok) return null
    const xml = await res.text()
    const block = xml.match(/<song>([\s\S]*?)<\/song>/i)?.[1]
    if (!block) return null

    const pick = (tag: string): string => {
      const m = block.match(
        new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i')
      )
      return (m?.[1] ?? '').trim()
    }

    const title = pick('title')
    const artist = pick('artist')
    if (!title && !artist) return null
    return { title, artist }
  } catch {
    return null
  }
}
