// Génère build/icon.ico (Windows) + build/icon.icns (macOS) multi-tailles + PNG
// à partir du logo vectoriel build/logo.svg, via le moteur de rendu resvg.
//   node scripts/make-icon.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const buildDir = join(root, 'build')
const svg = readFileSync(join(buildDir, 'logo.svg'))

const pngCache = new Map()
function renderPng(size) {
  if (pngCache.has(size)) return pngCache.get(size)
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)'
  })
  const buf = Buffer.from(r.render().asPng())
  pngCache.set(size, buf)
  return buf
}

// Assemble un .ico contenant plusieurs PNG (format ICO « PNG-in-ICO », Vista+).
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // réservé
  header.writeUInt16LE(1, 2) // type = icône
  header.writeUInt16LE(images.length, 4)

  const dir = Buffer.alloc(16 * images.length)
  let offset = 6 + 16 * images.length
  const bodies = []
  images.forEach((img, i) => {
    const b = img.buffer
    const e = i * 16
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, e + 0) // largeur (0 = 256)
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, e + 1) // hauteur
    dir.writeUInt8(0, e + 2) // palette
    dir.writeUInt8(0, e + 3) // réservé
    dir.writeUInt16LE(1, e + 4) // plans
    dir.writeUInt16LE(32, e + 6) // bits/pixel
    dir.writeUInt32LE(b.length, e + 8) // taille des données
    dir.writeUInt32LE(offset, e + 12) // décalage
    offset += b.length
    bodies.push(b)
  })
  return Buffer.concat([header, dir, ...bodies])
}

// Assemble un .icns macOS : en-tête « icns » + total, puis des entrées
// { OSType(4) + longueur BE incluant l'en-tête de 8 o + données PNG }. macOS 10.7+ accepte
// des icônes encodées en PNG pour ces OSType. On fournit toutes les tailles Retina (@1x/@2x).
function buildIcns(entries) {
  const chunks = []
  let total = 8 // en-tête de fichier
  for (const { type, buffer } of entries) {
    const head = Buffer.alloc(8)
    head.write(type, 0, 4, 'ascii')
    head.writeUInt32BE(buffer.length + 8, 4)
    chunks.push(head, buffer)
    total += buffer.length + 8
  }
  const fileHeader = Buffer.alloc(8)
  fileHeader.write('icns', 0, 4, 'ascii')
  fileHeader.writeUInt32BE(total, 4)
  return Buffer.concat([fileHeader, ...chunks])
}

const sizes = [16, 24, 32, 48, 64, 128, 256]
const images = sizes.map((size) => ({ size, buffer: renderPng(size) }))

// OSType → taille en pixels (icp4/5/6 = legacy 16/32/64 ; ic07..ic14 = 128→1024 dont @2x).
const icnsMap = [
  ['icp4', 16],
  ['icp5', 32],
  ['icp6', 64],
  ['ic07', 128],
  ['ic08', 256],
  ['ic09', 512],
  ['ic10', 1024],
  ['ic11', 32],
  ['ic12', 64],
  ['ic13', 256],
  ['ic14', 512]
]
const icnsEntries = icnsMap.map(([type, size]) => ({ type, buffer: renderPng(size) }))

mkdirSync(buildDir, { recursive: true })
writeFileSync(join(buildDir, 'icon.ico'), buildIco(images))
writeFileSync(join(buildDir, 'icon.icns'), buildIcns(icnsEntries))
writeFileSync(join(buildDir, 'icon.png'), renderPng(256))
writeFileSync(join(buildDir, 'icon@512.png'), renderPng(512))

console.log(
  `✓ build/icon.ico (${sizes.join(', ')} px) + build/icon.icns (16→1024 px) + icon.png + icon@512.png`
)
