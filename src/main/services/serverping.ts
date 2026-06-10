import net from 'net'
import { resolveSrv } from 'dns/promises'
import type { ServerStatus } from '@shared/types'

const DEFAULT_PORT = 25565

/* ------------------------------- VarInt ------------------------------- */

function writeVarInt(value: number): Buffer {
  const bytes: number[] = []
  let v = value >>> 0 // traite comme entier non signé 32 bits
  for (;;) {
    if ((v & ~0x7f) === 0) {
      bytes.push(v)
      break
    }
    bytes.push((v & 0x7f) | 0x80)
    v >>>= 7
  }
  return Buffer.from(bytes)
}

function readVarInt(buf: Buffer, offset: number): { value: number; size: number } {
  let numRead = 0
  let result = 0
  let byte: number
  do {
    byte = buf[offset + numRead]
    if (byte === undefined) throw new Error('incomplete') // attendre plus de données
    result |= (byte & 0x7f) << (7 * numRead)
    numRead++
    if (numRead > 5) throw new Error('VarInt too big')
  } while ((byte & 0x80) !== 0)
  return { value: result, size: numRead }
}

/* ------------------------------- MOTD --------------------------------- */

interface ChatNode {
  text?: string
  extra?: ChatNode[]
}

function flattenMotd(desc: unknown): string[] {
  if (!desc) return []
  if (typeof desc === 'string') return stripCodes(desc).split('\n')
  let text = ''
  const walk = (node: ChatNode | string): void => {
    if (typeof node === 'string') {
      text += node
      return
    }
    if (node.text) text += node.text
    if (Array.isArray(node.extra)) node.extra.forEach(walk)
  }
  walk(desc as ChatNode)
  return stripCodes(text).split('\n')
}

function stripCodes(s: string): string {
  return s.replace(/§./g, '')
}

/* --------------------------- Ping direct TCP -------------------------- */

interface RawStatus {
  version?: { name?: string }
  players?: { online?: number; max?: number; sample?: { name?: string; id?: string }[] }
  description?: unknown
  favicon?: string
}

async function resolveTarget(ip: string, port?: number): Promise<{ host: string; port: number }> {
  // Les enregistrements SRV ne s'appliquent qu'au port par défaut.
  if (port && port !== DEFAULT_PORT) return { host: ip, port }
  try {
    const recs = await resolveSrv(`_minecraft._tcp.${ip}`)
    if (recs.length) return { host: recs[0].name, port: recs[0].port }
  } catch {
    /* pas de SRV */
  }
  return { host: ip, port: port || DEFAULT_PORT }
}

function directPing(ip: string, port: number): Promise<RawStatus> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: ip, port })
    let chunks = Buffer.alloc(0)
    let done = false

    const fail = (e: Error): void => {
      if (done) return
      done = true
      socket.destroy()
      reject(e)
    }

    socket.setTimeout(5000)
    socket.on('timeout', () => fail(new Error('timeout')))
    socket.on('error', fail)

    socket.on('connect', () => {
      // Handshake : protocol -1 (= demande la version du serveur), état suivant = 1 (status).
      const host = Buffer.from(ip, 'utf8')
      const portBuf = Buffer.alloc(2)
      portBuf.writeUInt16BE(port, 0)
      const payload = Buffer.concat([
        writeVarInt(0x00),
        writeVarInt(-1),
        writeVarInt(host.length),
        host,
        portBuf,
        writeVarInt(1)
      ])
      const handshake = Buffer.concat([writeVarInt(payload.length), payload])
      const statusReq = Buffer.concat([writeVarInt(1), writeVarInt(0x00)])
      socket.write(Buffer.concat([handshake, statusReq]))
    })

    socket.on('data', (d) => {
      chunks = Buffer.concat([chunks, d])
      try {
        const len = readVarInt(chunks, 0)
        if (chunks.length < len.size + len.value) return // paquet incomplet
        let off = len.size
        const pid = readVarInt(chunks, off)
        off += pid.size
        const strLen = readVarInt(chunks, off)
        off += strLen.size
        if (chunks.length < off + strLen.value) return
        const json = chunks.subarray(off, off + strLen.value).toString('utf8')
        done = true
        socket.destroy()
        resolve(JSON.parse(json) as RawStatus)
      } catch (e) {
        if ((e as Error).message !== 'incomplete') fail(e as Error)
      }
    })
  })
}

/* ---------------------------- Repli via API --------------------------- */

async function apiPing(ip: string, port?: number): Promise<ServerStatus> {
  const host = port && port !== DEFAULT_PORT ? `${ip}:${port}` : ip
  const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(host)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as {
    online?: boolean
    players?: { online?: number; max?: number; list?: { name?: string; uuid?: string }[] }
    version?: string
    motd?: { clean?: string[] }
    icon?: string
  }
  if (!data.online) return { online: false }
  const rawList = data.players?.list
  return {
    online: true,
    players: data.players
      ? { online: data.players.online ?? 0, max: data.players.max ?? 0 }
      : undefined,
    list: Array.isArray(rawList)
      ? rawList.map((p) => ({ name: p.name ?? '', uuid: p.uuid })).filter((p) => p.name)
      : undefined,
    version: data.version,
    motd: data.motd?.clean,
    icon: data.icon
  }
}

/* ----------------------------- Point d'entrée ------------------------- */

export async function pingMinecraftServer(ip: string, port?: number): Promise<ServerStatus> {
  if (!ip) return { online: false }
  try {
    const target = await resolveTarget(ip, port)
    const raw = await directPing(target.host, target.port)
    return {
      online: true,
      players: {
        online: raw.players?.online ?? 0,
        max: raw.players?.max ?? 0
      },
      list: (raw.players?.sample ?? [])
        .map((p) => ({ name: p.name ?? '', uuid: p.id }))
        .filter((p) => p.name),
      version: raw.version?.name ? stripCodes(raw.version.name) : undefined,
      motd: flattenMotd(raw.description),
      icon: raw.favicon
    }
  } catch {
    // Le ping direct a échoué (serveur injoignable depuis la machine, pare-feu…)
    // → on tente l'API publique en dernier recours.
    try {
      return await apiPing(ip, port)
    } catch {
      return { online: false }
    }
  }
}
