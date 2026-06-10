import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { fileExists } from '../util'

/**
 * Écrit/fusionne le serveur dans `servers.dat` (liste multijoueur in-game), afin que
 * « Zarn » apparaisse pré-ajouté avec la bonne adresse (IP:port) — sans écraser
 * les serveurs que le joueur a ajoutés lui-même.
 *
 * `servers.dat` est du NBT Java **non compressé** (big-endian). On implémente un codec
 * minimal : on interprète Compound/List/String/Byte (ce qui compose réellement ce fichier)
 * et on conserve tout autre tag tel quel (octets opaques) → round-trip sans perte.
 */

type Tag =
  | { type: 1; value: number } // TAG_Byte
  | { type: 8; value: string } // TAG_String
  | { type: 9; elemType: number; items: Tag[] } // TAG_List
  | { type: 10; entries: Array<{ name: string; tag: Tag }> } // TAG_Compound
  | { type: number; raw: Buffer } // autres tags : conservés bruts

type Compound = Extract<Tag, { type: 10 }>
type ListTag = Extract<Tag, { type: 9 }>

const u8 = (n: number): Buffer => Buffer.from([n & 0xff])
const u16 = (n: number): Buffer => {
  const b = Buffer.alloc(2)
  b.writeUInt16BE(n & 0xffff)
  return b
}
const i32 = (n: number): Buffer => {
  const b = Buffer.alloc(4)
  b.writeInt32BE(n)
  return b
}
const i8b = (n: number): Buffer => {
  const b = Buffer.alloc(1)
  b.writeInt8(n)
  return b
}
const nbtStr = (s: string): Buffer => {
  const d = Buffer.from(s, 'utf8')
  return Buffer.concat([u16(d.length), d])
}

class Reader {
  off = 0
  constructor(private buf: Buffer) {}
  u8(): number {
    return this.buf.readUInt8(this.off++)
  }
  i8(): number {
    const v = this.buf.readInt8(this.off)
    this.off += 1
    return v
  }
  u16(): number {
    const v = this.buf.readUInt16BE(this.off)
    this.off += 2
    return v
  }
  i32(): number {
    const v = this.buf.readInt32BE(this.off)
    this.off += 4
    return v
  }
  take(n: number): Buffer {
    const b = this.buf.subarray(this.off, this.off + n)
    this.off += n
    return Buffer.from(b)
  }
  str(): string {
    return this.take(this.u16()).toString('utf8')
  }
}

/** Taille fixe (octets) des tags scalaires opaques. */
const FIXED: Record<number, number> = { 2: 2, 3: 4, 4: 8, 5: 4, 6: 8 }

function readPayload(r: Reader, type: number): Tag {
  switch (type) {
    case 1:
      return { type, value: r.i8() }
    case 8:
      return { type, value: r.str() }
    case 9: {
      const elemType = r.u8()
      const count = r.i32()
      const items: Tag[] = []
      for (let i = 0; i < count; i++) items.push(readPayload(r, elemType))
      return { type, elemType, items }
    }
    case 10: {
      const entries: Compound['entries'] = []
      for (;;) {
        const t = r.u8()
        if (t === 0) break
        const name = r.str()
        entries.push({ name, tag: readPayload(r, t) })
      }
      return { type, entries }
    }
    case 7: {
      // TAG_Byte_Array : on garde longueur + données bruts.
      const n = r.i32()
      return { type, raw: Buffer.concat([i32(n), r.take(n)]) }
    }
    case 11: {
      const n = r.i32()
      return { type, raw: Buffer.concat([i32(n), r.take(n * 4)]) }
    }
    case 12: {
      const n = r.i32()
      return { type, raw: Buffer.concat([i32(n), r.take(n * 8)]) }
    }
    default: {
      const size = FIXED[type]
      if (size === undefined) throw new Error(`NBT type non géré: ${type}`)
      return { type, raw: r.take(size) }
    }
  }
}

function writePayload(tag: Tag): Buffer {
  switch (tag.type) {
    case 1:
      return i8b((tag as { value: number }).value)
    case 8:
      return nbtStr((tag as { value: string }).value)
    case 9: {
      const t = tag as ListTag
      const parts = [u8(t.elemType), i32(t.items.length)]
      for (const it of t.items) parts.push(writePayload(it))
      return Buffer.concat(parts)
    }
    case 10: {
      const t = tag as Compound
      const parts: Buffer[] = []
      for (const e of t.entries) parts.push(u8(e.tag.type), nbtStr(e.name), writePayload(e.tag))
      parts.push(u8(0)) // TAG_End
      return Buffer.concat(parts)
    }
    default:
      return Buffer.from((tag as { raw: Buffer }).raw)
  }
}

function getStr(c: Compound, key: string): string | undefined {
  const e = c.entries.find((x) => x.name === key)
  return e && e.tag.type === 8 ? (e.tag as { value: string }).value : undefined
}

function setStr(c: Compound, key: string, value: string): void {
  const e = c.entries.find((x) => x.name === key)
  if (e && e.tag.type === 8) (e.tag as { value: string }).value = value
  else c.entries.push({ name: key, tag: { type: 8, value } })
}

export async function ensureServerInList(
  gameDir: string,
  name: string,
  host: string,
  port: number
): Promise<void> {
  const path = join(gameDir, 'servers.dat')
  const addr = port && port !== 25565 ? `${host}:${port}` : host

  let root: Compound | null = null
  if (await fileExists(path)) {
    try {
      const r = new Reader(await readFile(path))
      if (r.u8() !== 10) throw new Error('racine NBT inattendue')
      r.str() // nom de la racine (vide)
      root = readPayload(r, 10) as Compound
    } catch {
      root = null // fichier illisible → on repart proprement
    }
  }
  if (!root) root = { type: 10, entries: [] }

  // Liste "servers" (créée si absente).
  let serversEntry = root.entries.find((e) => e.name === 'servers')
  if (!serversEntry || serversEntry.tag.type !== 9) {
    serversEntry = { name: 'servers', tag: { type: 9, elemType: 10, items: [] } }
    root.entries.unshift(serversEntry)
  }
  const list = serversEntry.tag as ListTag
  if (list.elemType !== 10) {
    list.elemType = 10
    list.items = []
  }

  // Match par même hôte (peu importe le port) ou par nom → on met à jour, sinon on ajoute en tête.
  const hostOf = (ip?: string): string => (ip ? ip.split(':')[0].toLowerCase() : '')
  const existing = list.items.find(
    (it) =>
      it.type === 10 &&
      (hostOf(getStr(it as Compound, 'ip')) === host.toLowerCase() ||
        getStr(it as Compound, 'name') === name)
  ) as Compound | undefined

  if (existing) {
    setStr(existing, 'name', name)
    setStr(existing, 'ip', addr)
  } else {
    list.items.unshift({
      type: 10,
      entries: [
        { name: 'name', tag: { type: 8, value: name } },
        { name: 'ip', tag: { type: 8, value: addr } }
      ]
    })
  }

  const full = Buffer.concat([u8(10), nbtStr(''), writePayload(root)])
  await writeFile(path, full)
}
