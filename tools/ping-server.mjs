// Minecraft Server List Ping (status) — récupère le JSON de statut, y compris
// forgeData (liste des mods + canaux) pour un serveur NeoForge/Forge.
// Aucun accès privilégié : c'est exactement ce que fait un client en survolant le serveur.
import net from 'node:net'

const HOST = process.argv[2] || '82.67.63.61'
const PORT = parseInt(process.argv[3] || '25569', 10)

function writeVarInt(n) {
  const bytes = []
  let v = n >>> 0
  do {
    let b = v & 0x7f
    v >>>= 7
    if (v !== 0) b |= 0x80
    bytes.push(b)
  } while (v !== 0)
  return Buffer.from(bytes)
}

function writeString(s) {
  const b = Buffer.from(s, 'utf8')
  return Buffer.concat([writeVarInt(b.length), b])
}

function packet(id, ...parts) {
  const body = Buffer.concat([writeVarInt(id), ...parts])
  return Buffer.concat([writeVarInt(body.length), body])
}

function readVarInt(buf, offset) {
  let numRead = 0
  let result = 0
  let byte
  do {
    if (offset + numRead >= buf.length) return null
    byte = buf[offset + numRead]
    result |= (byte & 0x7f) << (7 * numRead)
    numRead++
    if (numRead > 5) throw new Error('VarInt too big')
  } while ((byte & 0x80) !== 0)
  return { value: result >>> 0, size: numRead }
}

const sock = net.connect({ host: HOST, port: PORT }, () => {
  // Handshake: protocol 767 (1.21.1), nextState=1 (status)
  const handshake = packet(
    0x00,
    writeVarInt(767),
    writeString(HOST),
    Buffer.from([(PORT >> 8) & 0xff, PORT & 0xff]),
    writeVarInt(1)
  )
  sock.write(handshake)
  // Status request
  sock.write(packet(0x00))
})

let chunks = Buffer.alloc(0)
sock.on('data', (d) => {
  chunks = Buffer.concat([chunks, d])
  // Try to parse: VarInt len, VarInt packetId, VarInt strLen, string
  const lenRes = readVarInt(chunks, 0)
  if (!lenRes) return
  const total = lenRes.size + lenRes.value
  if (chunks.length < total) return // wait for more
  let off = lenRes.size
  const idRes = readVarInt(chunks, off)
  off += idRes.size
  const strLenRes = readVarInt(chunks, off)
  off += strLenRes.size
  if (chunks.length < off + strLenRes.value) return
  const json = chunks.slice(off, off + strLenRes.value).toString('utf8')
  sock.end()
  try {
    const obj = JSON.parse(json)
    console.log(JSON.stringify(obj, null, 2))
  } catch {
    console.log('RAW:', json)
  }
})

sock.on('error', (e) => {
  console.error('SOCKET ERROR:', e.message)
  process.exit(2)
})
sock.setTimeout(8000, () => {
  console.error('TIMEOUT')
  sock.destroy()
  process.exit(3)
})
