import { createReadStream, createWriteStream, type Dirent } from 'fs'
import { mkdir, rm, stat, readFile, writeFile, readdir } from 'fs/promises'
import { createHash } from 'crypto'
import { dirname, join } from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export function sha1File(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha1')
    const rs = createReadStream(path)
    rs.on('error', reject)
    rs.on('data', (d) => hash.update(d))
    rs.on('end', () => resolve(hash.digest('hex')))
  })
}

export function sha256File(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const rs = createReadStream(path)
    rs.on('error', reject)
    rs.on('data', (d) => hash.update(d))
    rs.on('end', () => resolve(hash.digest('hex')))
  })
}

export async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return null
  }
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await ensureDir(dirname(path))
  await writeFile(path, JSON.stringify(data, null, 2), 'utf8')
}

export interface DownloadOpts {
  sha1?: string
  onProgress?: (received: number, total: number) => void
  signal?: AbortSignal
}

/**
 * Télécharge `url` vers `dest`. Renvoie `true` si un téléchargement a réellement eu
 * lieu, `false` si le fichier était déjà présent et valide (sha1 identique) — utile
 * pour compter ce qui a été réparé lors d'une vérification du modpack.
 */
export async function downloadFile(url: string, dest: string, opts: DownloadOpts = {}): Promise<boolean> {
  if (opts.sha1 && (await fileExists(dest))) {
    const current = await sha1File(dest)
    if (current.toLowerCase() === opts.sha1.toLowerCase()) return false
  }
  await ensureDir(dirname(dest))
  const res = await fetch(url, { signal: opts.signal, redirect: 'follow' })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} en téléchargeant ${url}`)
  const total = Number(res.headers.get('content-length') || 0)
  let received = 0
  const nodeStream = Readable.fromWeb(res.body as never)
  nodeStream.on('data', (chunk: Buffer) => {
    received += chunk.length
    opts.onProgress?.(received, total)
  })
  await pipeline(nodeStream, createWriteStream(dest))
  if (opts.sha1) {
    const current = await sha1File(dest)
    if (current.toLowerCase() !== opts.sha1.toLowerCase()) {
      await rm(dest, { force: true })
      throw new Error(`SHA1 invalide pour ${dest}`)
    }
  }
  return true
}

export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`)
  return (await res.json()) as T
}

export function offlineUUID(username: string): string {
  const hash = createHash('md5').update(`OfflinePlayer:${username}`, 'utf8').digest()
  hash[6] = (hash[6] & 0x0f) | 0x30
  hash[8] = (hash[8] & 0x3f) | 0x80
  const hex = hash.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

export async function findFileRecursive(dir: string, name: string): Promise<string | null> {
  let entries: Dirent[]
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return null
  }
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      const r = await findFileRecursive(full, name)
      if (r) return r
    } else if (e.name.toLowerCase() === name.toLowerCase()) {
      return full
    }
  }
  return null
}
