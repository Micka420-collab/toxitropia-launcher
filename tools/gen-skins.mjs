// Génère ~50 skins Minecraft (64×64) thématiques (apocalyptique + variété).
// Aucune dépendance : encodeur PNG maison. Sort les PNG + skins.json dans
// src/renderer/src/assets/skins/, et une planche de QA (vues de face) dans F:/tmp.
import zlib from 'node:zlib'
import { writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'renderer', 'src', 'assets', 'skins')
const QA = 'F:/tmp/skins-qa.png'

/* ───────────────────────── PNG (RGBA, filtre 0) ───────────────────────── */
const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (b) => {
  let c = 0xffffffff
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit, RGBA
  const stride = w * 4
  const raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

/* ───────────────────────── Canvas ───────────────────────── */
const C = (w, h) => ({ w, h, d: Buffer.alloc(w * h * 4, 0) })
function P(c, x, y, col) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return
  const i = (y * c.w + x) * 4
  c.d[i] = col[0]; c.d[i + 1] = col[1]; c.d[i + 2] = col[2]; c.d[i + 3] = col[3] === undefined ? 255 : col[3]
}
function R(c, x, y, w, h, col) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(c, x + i, y + j, col) }
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0)
const sh = (col, f) => [clamp(col[0] * f), clamp(col[1] * f), clamp(col[2] * f), col[3]]
const mix = (a, b, t) => [clamp(a[0] + (b[0] - a[0]) * t), clamp(a[1] + (b[1] - a[1]) * t), clamp(a[2] + (b[2] - a[2]) * t)]
// RNG déterministe
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 } }
function grain(c, reg, col, amp, rnd) {
  const [x, y, w, h] = reg
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const n = (rnd() - 0.5) * 2 * amp
    P(c, x + i, y + j, [clamp(col[0] + n), clamp(col[1] + n), clamp(col[2] + n), 255])
  }
}

/* ───────────────────────── UV (couche de base) ───────────────────────── */
const HEAD = { top: [8, 0, 8, 8], bot: [16, 0, 8, 8], r: [0, 8, 8, 8], f: [8, 8, 8, 8], l: [16, 8, 8, 8], b: [24, 8, 8, 8] }
const BODY = { top: [20, 16, 8, 4], bot: [28, 16, 8, 4], r: [16, 20, 4, 12], f: [20, 20, 8, 12], l: [28, 20, 4, 12], b: [32, 20, 8, 12] }
const RARM = { top: [44, 16, 4, 4], bot: [48, 16, 4, 4], r: [40, 20, 4, 12], f: [44, 20, 4, 12], l: [48, 20, 4, 12], b: [52, 20, 4, 12] }
const LARM = { top: [36, 48, 4, 4], bot: [40, 48, 4, 4], r: [32, 52, 4, 12], f: [36, 52, 4, 12], l: [40, 52, 4, 12], b: [44, 52, 4, 12] }
const RLEG = { top: [4, 16, 4, 4], bot: [8, 16, 4, 4], r: [0, 20, 4, 12], f: [4, 20, 4, 12], l: [8, 20, 4, 12], b: [12, 20, 4, 12] }
const LLEG = { top: [20, 48, 4, 4], bot: [24, 48, 4, 4], r: [16, 52, 4, 12], f: [20, 52, 4, 12], l: [24, 52, 4, 12], b: [28, 52, 4, 12] }

const SIDE = 0.86, BACK = 0.78, TOP = 1.08
function box(c, B, col) {
  R(c, ...B.f, col); R(c, ...B.b, sh(col, BACK))
  R(c, ...B.r, sh(col, SIDE)); R(c, ...B.l, sh(col, SIDE))
  R(c, ...B.top, sh(col, TOP)); R(c, ...B.bot, sh(col, BACK))
}
// peint une bande verticale (rows [y0,y1) en local) sur les 4 faces latérales d'une part
function band(c, B, y0, y1, col) {
  for (const k of ['f', 'b', 'r', 'l']) {
    const [x, y, w] = B[k]
    R(c, x, y + y0, w, y1 - y0, k === 'b' ? sh(col, BACK) : k === 'f' ? col : sh(col, SIDE))
  }
}

/* ───────────────────────── Peinture d'un skin ───────────────────────── */
function paint(s, seed) {
  const c = C(64, 64)
  const rnd = rng(seed)
  const skin = s.skin

  // Tête
  box(c, HEAD, skin)
  grain(c, HEAD.f, skin, 6, rnd)

  // Cheveux / capuche / casque
  const hair = s.hair
  const st = s.hairStyle || 'short'
  if (st === 'short') {
    R(c, ...HEAD.top, sh(hair, TOP)); R(c, ...HEAD.b, sh(hair, BACK))
    band(c, HEAD, 0, 2, hair); R(c, HEAD.b[0], HEAD.b[1], 8, 5, sh(hair, BACK))
  } else if (st === 'cap') {
    R(c, ...HEAD.top, sh(hair, TOP)); band(c, HEAD, 0, 1, hair)
    R(c, HEAD.f[0], HEAD.f[1] + 2, 8, 1, sh(hair, 0.7)) // visière casquette
    R(c, HEAD.b[0], HEAD.b[1], 8, 3, sh(hair, BACK))
  } else if (st === 'helmet') {
    R(c, ...HEAD.top, sh(hair, TOP)); R(c, ...HEAD.b, sh(hair, BACK))
    band(c, HEAD, 0, 4, hair)
    R(c, HEAD.f[0], HEAD.f[1] + 7, 8, 1, sh(hair, 0.6)) // jugulaire
  } else if (st === 'hood') {
    // capuche : tête entière couleur capuche, ouverture du visage à l'avant
    box(c, HEAD, hair)
    R(c, HEAD.f[0] + 1, HEAD.f[1] + 2, 6, 6, skin) // ouverture
    R(c, HEAD.f[0] + 1, HEAD.f[1] + 1, 6, 1, sh(hair, 0.7)) // bord d'ombre
  }

  // Visage (face avant locale 8×8 à HEAD.f)
  face(c, s, HEAD.f, rnd)

  // Torse
  box(c, BODY, s.shirt)
  if (s.shirtAlt) camo(c, BODY, s.shirtAlt, rnd)
  chest(c, s)
  belt(c, s)

  // Bras
  arm(c, RARM, s); arm(c, LARM, s)
  // Jambes
  leg(c, RLEG, s); leg(c, LLEG, s)

  if (s.grime) grimePass(c, s.grime, rnd)
  return c
}

function face(c, s, F, rnd) {
  const [x, y] = F
  const eyeWhite = [236, 236, 240], pupil = [40, 38, 46]
  const drawEyes = (ec = eyeWhite, pc = pupil) => {
    R(c, x + 2, y + 3, 2, 1, ec); R(c, x + 5, y + 3, 2, 1, ec)
    P(c, x + 2, y + 3, pc); P(c, x + 6, y + 3, pc)
    R(c, x + 1, y + 2, 2, 1, sh(s.skin, 0.7)); R(c, x + 5, y + 2, 2, 1, sh(s.skin, 0.7)) // sourcils
  }
  switch (s.face) {
    case 'visor':
      R(c, x, y, 8, 8, sh(s.hair, 0.6)) // casque/visière
      R(c, x + 1, y + 2, 6, 3, [70, 92, 96]) // verre
      R(c, x + 1, y + 2, 6, 1, [150, 180, 185])
      break
    case 'gasmask':
      R(c, x, y, 8, 8, sh(s.accent || s.shirt, 0.85))
      R(c, x + 1, y + 1, 6, 3, [60, 78, 82]) // verres
      P(c, x + 2, y + 2, [150, 175, 180]); P(c, x + 5, y + 2, [150, 175, 180])
      R(c, x + 2, y + 5, 4, 2, sh(s.accent || s.shirt, 0.6)) // filtre
      R(c, x + 3, y + 6, 2, 1, [30, 30, 34])
      break
    case 'bandana':
      drawEyes()
      R(c, x, y + 4, 8, 4, s.accent || [150, 46, 40]) // bas du visage couvert
      R(c, x, y + 4, 8, 1, sh(s.accent || [150, 46, 40], 0.7))
      break
    case 'scarf':
      drawEyes()
      R(c, x, y + 5, 8, 3, s.accent || [170, 150, 108])
      R(c, x, y + 5, 8, 1, sh(s.accent || [170, 150, 108], 0.8))
      break
    case 'goggles':
      R(c, x, y + 2, 8, 2, [30, 30, 34])
      P(c, x + 2, y + 3, [120, 150, 160]); P(c, x + 5, y + 3, [120, 150, 160])
      R(c, x + 2, y + 5, 4, 1, sh(s.skin, 0.8)) // bouche
      break
    case 'zombie':
      R(c, x + 1, y + 3, 2, 2, [22, 26, 22]); R(c, x + 5, y + 3, 2, 2, [22, 26, 22]) // yeux creux
      P(c, x + 2, y + 3, [180, 60, 60]); P(c, x + 5, y + 3, [180, 60, 60])
      R(c, x + 2, y + 6, 4, 1, [40, 30, 30]) // bouche
      P(c, x + 6, y + 5, sh(s.skin, 0.6)); P(c, x + 1, y + 2, sh(s.skin, 0.6)) // plaies
      break
    default:
      drawEyes()
      R(c, x + 3, y + 6, 2, 1, sh(s.skin, 0.78)) // bouche
      if (s.stubble !== false) for (let i = 0; i < 6; i++) P(c, x + 1 + ((rnd() * 6) | 0), y + 5 + ((rnd() * 2) | 0), sh(s.skin, 0.82))
  }
}

function camo(c, B, alt, rnd) {
  for (const k of ['f', 'b', 'r', 'l', 'top']) {
    const [x, y, w, h] = B[k]
    const n = Math.max(3, (w * h) / 6)
    for (let i = 0; i < n; i++) {
      const bx = x + ((rnd() * w) | 0), by = y + ((rnd() * h) | 0)
      R(c, bx, by, 1 + ((rnd() * 2) | 0), 1 + ((rnd() * 2) | 0), sh(alt, k === 'b' ? BACK : 1))
    }
  }
}

function chest(c, s) {
  const [x, y] = BODY.f // 20,20  (8×12)
  switch (s.chest) {
    case 'zip':
      R(c, x + 3, y, 2, 12, sh(s.shirt, 0.8)) // fermeture
      R(c, x, y, 8, 1, sh(s.shirt, 0.7)) // col
      break
    case 'straps': // bandoulières
      for (let i = 0; i < 8; i++) { P(c, x + i, y + i + 1, [54, 44, 34]); P(c, x + 7 - i, y + i + 1, [54, 44, 34]) }
      R(c, x + 1, y + 9, 2, 2, [40, 34, 28]); R(c, x + 5, y + 9, 2, 2, [40, 34, 28]) // poches
      break
    case 'vest':
      R(c, x + 1, y + 1, 6, 10, sh(s.shirt, 0.72))
      R(c, x + 1, y + 1, 1, 10, [30, 30, 34]); R(c, x + 6, y + 1, 1, 10, [30, 30, 34])
      R(c, x + 2, y + 4, 4, 2, [30, 30, 34]); R(c, x + 2, y + 8, 4, 2, [30, 30, 34]) // poches
      break
    case 'cross':
      R(c, x + 1, y + 2, 6, 8, [232, 232, 230]) // panneau blanc
      R(c, x + 3, y + 3, 2, 6, [196, 40, 40]); R(c, x + 1, y + 5, 6, 2, [196, 40, 40]) // croix
      break
    case 'overall':
      R(c, x, y, 8, 12, sh(s.shirt, 0.78)) // salopette plus foncée
      R(c, x + 1, y, 2, 6, sh(s.shirt, 1.12)); R(c, x + 5, y, 2, 6, sh(s.shirt, 1.12)) // bretelles
      R(c, x + 2, y + 6, 4, 4, sh(s.shirt, 0.62)) // poche bavoir
      P(c, x + 1, y, [210, 200, 90]); P(c, x + 6, y, [210, 200, 90]) // boutons
      break
    case 'rip': // vêtement déchiré
      R(c, x, y, 8, 12, s.shirt)
      for (let i = 0; i < 10; i++) P(c, x + ((Math.random() * 8) | 0), y + 2 + ((Math.random() * 9) | 0), sh(s.shirt, 0.5))
      R(c, x + 2, y + 7, 3, 2, sh(s.skin, 0.9)) // peau visible
      break
  }
}

function belt(c, s) {
  band(c, BODY, 10, 11, [44, 36, 28])
  R(c, BODY.f[0] + 3, BODY.f[1] + 10, 2, 1, [150, 130, 70]) // boucle
}

function arm(c, A, s) {
  const sleeve = s.shirt, hand = s.glove || s.skin
  box(c, A, sleeve)
  // main : 4 rangées du bas
  for (const k of ['f', 'b', 'r', 'l']) { const [x, y, w] = A[k]; R(c, x, y + 8, w, 4, k === 'b' ? sh(hand, BACK) : k === 'f' ? hand : sh(hand, SIDE)) }
  R(c, ...A.bot, sh(hand, BACK))
  band(c, A, 7, 8, sh(sleeve, 0.7)) // manchette
}

function leg(c, L, s) {
  box(c, L, s.pants)
  for (const k of ['f', 'b', 'r', 'l']) { const [x, y, w] = L[k]; R(c, x, y + 9, w, 3, k === 'b' ? sh(s.boots, BACK) : k === 'f' ? s.boots : sh(s.boots, SIDE)) }
  R(c, ...L.bot, sh(s.boots, 0.6)) // semelle
}

function grimePass(c, amt, rnd) {
  const n = (amt * 120) | 0
  for (let i = 0; i < n; i++) {
    const x = (rnd() * 64) | 0, y = (rnd() * 64) | 0
    const idx = (y * 64 + x) * 4
    if (c.d[idx + 3] === 0) continue
    const f = 1 - rnd() * 0.28
    c.d[idx] = clamp(c.d[idx] * f); c.d[idx + 1] = clamp(c.d[idx + 1] * f); c.d[idx + 2] = clamp(c.d[idx + 2] * f)
  }
}

/* ───────────────────────── Palette + 50 specs ───────────────────────── */
const col = {
  tanL: [224, 178, 140], tan: [198, 148, 110], pale: [214, 200, 184], dark: [150, 108, 78],
  zG: [120, 150, 96], zP: [170, 178, 150], grey: [150, 150, 150],
  brown: [80, 52, 30], black: [30, 28, 30], greyH: [110, 110, 110], blonde: [180, 150, 80], dbrown: [55, 38, 22],
  olive: [78, 86, 54], fbrown: [92, 66, 42], greyC: [96, 98, 102], navy: [44, 52, 72], rust: [120, 64, 40],
  khaki: [150, 138, 96], blk: [34, 34, 38], dgreen: [48, 66, 46], red: [150, 46, 40], crimson: [110, 30, 34],
  white: [210, 210, 205], yellow: [206, 180, 40], orange: [200, 110, 36], haz: [120, 160, 70], blue: [58, 80, 150],
  teal: [40, 120, 120], maroon: [96, 40, 46], sand: [182, 160, 112], slate: [78, 86, 96], forest: [52, 78, 52],
  purple: [96, 60, 140], gold: [196, 160, 60], cyan: [60, 160, 180], pink: [200, 120, 150],
  bBrown: [64, 44, 28], bBlack: [40, 38, 40], bGrey: [70, 72, 76]
}
const base = {
  skin: col.tan, hair: col.brown, shirt: col.olive, pants: [60, 58, 52], boots: col.bBrown,
  hairStyle: 'short', face: 'normal', chest: null, accent: col.crimson, grime: 0.25, glove: null
}
const SKINS = []
const mk = (name, theme, over) => SKINS.push({ name, theme, spec: { ...base, ...over } })

// Survivants
mk('Survivant Olive', 'apoc', { shirt: col.olive, chest: 'zip', grime: 0.3 })
mk('Survivant Rouille', 'apoc', { shirt: col.rust, pants: [60, 50, 44], chest: 'zip', grime: 0.35 })
mk('Survivant Cendre', 'apoc', { shirt: col.greyC, pants: [64, 64, 68], hair: col.greyH, chest: 'zip', grime: 0.3 })
mk('Survivant Kaki', 'apoc', { shirt: col.khaki, pants: [70, 66, 50], chest: 'straps', grime: 0.3 })
mk('Survivant Nuit', 'apoc', { shirt: col.navy, pants: [40, 44, 56], chest: 'zip', grime: 0.25 })
mk('Survivante Brune', 'apoc', { shirt: col.fbrown, pants: [58, 46, 38], hair: col.dbrown, chest: 'straps', grime: 0.3 })
// Soldats (camo + casque)
mk('Soldat Forêt', 'apoc', { shirt: col.dgreen, shirtAlt: col.olive, pants: [56, 62, 44], boots: col.bBlack, hairStyle: 'helmet', hair: [60, 68, 52], chest: 'straps', grime: 0.2 })
mk('Soldat Désert', 'apoc', { shirt: col.sand, shirtAlt: col.khaki, pants: col.khaki, boots: col.bBrown, hairStyle: 'helmet', hair: [150, 138, 100], chest: 'straps', grime: 0.2 })
mk('Soldat Urbain', 'apoc', { shirt: col.greyC, shirtAlt: col.slate, pants: [80, 84, 90], boots: col.bBlack, hairStyle: 'helmet', hair: [88, 90, 96], chest: 'straps', grime: 0.2 })
mk('Soldat Ombre', 'apoc', { shirt: col.blk, shirtAlt: [60, 60, 66], pants: [40, 40, 46], boots: col.bBlack, hairStyle: 'helmet', hair: [40, 40, 46], chest: 'vest', face: 'goggles', grime: 0.15 })
mk('Soldat Hiver', 'apoc', { shirt: col.white, shirtAlt: [182, 186, 190], pants: [170, 175, 182], boots: col.bGrey, hairStyle: 'helmet', hair: [186, 190, 194], chest: 'straps', grime: 0.15 })
// Hazmat
mk('Hazmat Jaune', 'apoc', { shirt: col.yellow, pants: col.yellow, boots: [150, 130, 30], hairStyle: 'hood', hair: col.yellow, face: 'visor', glove: [150, 130, 30], chest: null, grime: 0.1 })
mk('Hazmat Orange', 'apoc', { shirt: col.orange, pants: col.orange, boots: [150, 80, 24], hairStyle: 'hood', hair: col.orange, face: 'visor', glove: [150, 80, 24], grime: 0.1 })
mk('Hazmat Blanc', 'apoc', { shirt: col.white, pants: col.white, boots: [170, 170, 165], hairStyle: 'hood', hair: col.white, face: 'visor', glove: [170, 170, 165], grime: 0.12 })
mk('Hazmat Vert', 'apoc', { shirt: col.haz, pants: col.haz, boots: [80, 110, 46], hairStyle: 'hood', hair: col.haz, face: 'visor', glove: [80, 110, 46], grime: 0.1 })
// Pillards (capuche + bandana)
mk('Pillard Cramoisi', 'apoc', { shirt: [60, 58, 58], hairStyle: 'hood', hair: col.black, face: 'bandana', accent: col.crimson, pants: [44, 42, 44], boots: col.bBlack, chest: 'straps', grime: 0.4 })
mk('Pillard Os', 'apoc', { shirt: [80, 78, 72], hairStyle: 'hood', hair: col.greyC, face: 'bandana', accent: col.white, pants: [64, 62, 58], boots: col.bGrey, chest: 'straps', grime: 0.4 })
mk('Pillard Terre', 'apoc', { shirt: col.fbrown, hairStyle: 'hood', hair: col.dbrown, face: 'bandana', accent: col.black, pants: [58, 46, 38], boots: col.bBrown, chest: 'straps', grime: 0.45 })
mk('Pillard Forêt', 'apoc', { shirt: col.dgreen, hairStyle: 'hood', hair: [40, 52, 40], face: 'bandana', accent: [40, 52, 40], pants: [44, 54, 42], boots: col.bBlack, chest: 'straps', grime: 0.4 })
mk('Pillard Sang', 'apoc', { shirt: [50, 40, 42], hairStyle: 'hood', hair: col.black, face: 'bandana', accent: col.red, pants: [42, 38, 40], boots: col.bBlack, chest: 'vest', grime: 0.45 })
// Charognards (sweat à capuche)
mk('Charognard Gris', 'apoc', { shirt: col.greyC, hairStyle: 'hood', hair: col.greyC, pants: [70, 70, 74], boots: col.bGrey, chest: 'zip', grime: 0.4 })
mk('Charognard Olive', 'apoc', { shirt: col.olive, hairStyle: 'hood', hair: col.olive, pants: [58, 60, 46], boots: col.bBrown, chest: 'zip', grime: 0.4 })
mk('Charognard Sable', 'apoc', { shirt: col.sand, hairStyle: 'hood', hair: col.sand, pants: col.khaki, boots: col.bBrown, chest: 'zip', grime: 0.45 })
mk('Charognard Bordeaux', 'apoc', { shirt: col.maroon, hairStyle: 'hood', hair: col.maroon, pants: [64, 46, 48], boots: col.bBlack, chest: 'zip', grime: 0.4 })
mk('Charognard Sarcelle', 'apoc', { shirt: col.teal, hairStyle: 'hood', hair: col.teal, pants: [40, 70, 70], boots: col.bBlack, chest: 'zip', grime: 0.4 })
// Infectés
mk('Infecté Vert', 'apoc', { skin: col.zG, hair: [60, 72, 48], shirt: [78, 82, 66], pants: [64, 66, 56], boots: col.bBrown, face: 'zombie', chest: 'rip', grime: 0.5 })
mk('Infecté Pâle', 'apoc', { skin: col.zP, hair: col.greyH, shirt: [96, 96, 90], pants: [80, 80, 76], boots: col.bGrey, face: 'zombie', chest: 'rip', grime: 0.5 })
mk('Infecté Cendré', 'apoc', { skin: col.grey, hair: [70, 70, 72], shirt: [70, 70, 72], pants: [60, 60, 62], boots: col.bBlack, face: 'zombie', chest: 'rip', grime: 0.55 })
mk('Infecté Putride', 'apoc', { skin: [110, 130, 88], hair: [50, 60, 40], shirt: [70, 84, 58], pants: [58, 64, 48], boots: col.bBrown, face: 'zombie', chest: 'rip', grime: 0.55 })
mk('Infecté Spectre', 'apoc', { skin: [176, 186, 172], hair: [120, 128, 122], shirt: [120, 124, 120], pants: [100, 104, 100], boots: col.bGrey, face: 'zombie', chest: 'rip', grime: 0.5 })
// Médecins
mk('Médecin Croix', 'apoc', { shirt: col.white, pants: [180, 182, 180], boots: col.bGrey, hairStyle: 'cap', hair: col.white, face: 'bandana', accent: col.white, chest: 'cross', grime: 0.2 })
mk('Médic Terrain', 'apoc', { shirt: [120, 140, 110], pants: [80, 92, 70], boots: col.bBrown, hairStyle: 'cap', hair: [120, 140, 110], face: 'bandana', accent: col.white, chest: 'cross', grime: 0.25 })
// Mécanos (salopette)
mk('Mécano Bleu', 'apoc', { shirt: col.blue, pants: col.blue, boots: col.bBlack, hair: col.dbrown, chest: 'overall', grime: 0.5 })
mk('Mécano Gris', 'apoc', { shirt: [96, 100, 108], pants: [96, 100, 108], boots: col.bBlack, hair: col.greyH, chest: 'overall', grime: 0.5 })
mk('Mécano Terre', 'apoc', { shirt: col.fbrown, pants: col.fbrown, boots: col.bBrown, hair: col.dbrown, chest: 'overall', grime: 0.55 })
// Nomades (écharpe)
mk('Nomade Sable', 'apoc', { shirt: col.sand, pants: col.khaki, boots: col.bBrown, hairStyle: 'hood', hair: col.sand, face: 'scarf', accent: [170, 150, 108], chest: 'straps', grime: 0.35 })
mk('Nomade Rouille', 'apoc', { shirt: col.rust, pants: [100, 58, 40], boots: col.bBrown, hairStyle: 'hood', hair: col.rust, face: 'scarf', accent: [140, 80, 52], chest: 'straps', grime: 0.35 })
mk('Nomade Ardoise', 'apoc', { shirt: col.slate, pants: [64, 70, 78], boots: col.bGrey, hairStyle: 'hood', hair: col.slate, face: 'scarf', accent: [96, 104, 114], chest: 'straps', grime: 0.35 })
mk('Nomade Forêt', 'apoc', { shirt: col.forest, pants: [44, 60, 44], boots: col.bBrown, hairStyle: 'hood', hair: col.forest, face: 'scarf', accent: [70, 96, 70], chest: 'straps', grime: 0.35 })
// Masques à gaz
mk('Masque Militaire', 'apoc', { shirt: col.dgreen, pants: [50, 60, 44], boots: col.bBlack, hairStyle: 'hood', hair: col.dgreen, face: 'gasmask', accent: [40, 48, 38], chest: 'vest', grime: 0.3 })
mk('Masque Noir', 'apoc', { shirt: col.blk, pants: [40, 40, 46], boots: col.bBlack, hairStyle: 'hood', hair: col.blk, face: 'gasmask', accent: [28, 28, 32], chest: 'vest', grime: 0.25 })
mk('Masque Rouille', 'apoc', { shirt: col.rust, pants: [90, 54, 38], boots: col.bBrown, hairStyle: 'hood', hair: col.rust, face: 'gasmask', accent: [80, 46, 32], chest: 'vest', grime: 0.35 })
// Variété (classiques colorés)
mk('Sweat Rouge', 'classic', { skin: col.tanL, hair: col.brown, shirt: col.red, pants: [60, 60, 66], boots: col.bBlack, chest: 'zip', grime: 0.05 })
mk('Sweat Bleu', 'classic', { skin: col.tanL, hair: col.black, shirt: col.blue, pants: [50, 52, 60], boots: col.bBlack, chest: 'zip', grime: 0.05 })
mk('Sweat Vert', 'classic', { skin: col.tan, hair: col.dbrown, shirt: [60, 140, 80], pants: [54, 58, 52], boots: col.bBrown, chest: 'zip', grime: 0.05 })
mk('Sweat Violet', 'classic', { skin: col.tanL, hair: col.black, shirt: col.purple, pants: [56, 50, 66], boots: col.bBlack, chest: 'zip', grime: 0.05 })
mk('Sweat Cyan', 'classic', { skin: col.tan, hair: col.blonde, shirt: col.cyan, pants: [50, 60, 64], boots: col.bGrey, chest: 'zip', grime: 0.05 })
mk('Sweat Rose', 'classic', { skin: col.tanL, hair: col.dbrown, shirt: col.pink, pants: [64, 56, 60], boots: col.bGrey, chest: 'zip', grime: 0.05 })
mk('Tenue Or', 'classic', { skin: col.tan, hair: col.dbrown, shirt: col.gold, pants: [80, 68, 40], boots: col.bBrown, chest: 'straps', grime: 0.1 })
mk('Monochrome', 'classic', { skin: [200, 200, 200], hair: [40, 40, 40], shirt: [40, 40, 40], pants: [60, 60, 60], boots: [30, 30, 30], chest: 'zip', grime: 0.05 })

/* ───────────────────────── Vue de face (QA + thumbnails) ───────────────────────── */
function frontView(c) {
  const v = C(16, 32)
  const cp = (src, sx, sy, w, h, dx, dy) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const si = ((sy + j) * src.w + (sx + i)) * 4; P(v, dx + i, dy + j, [src.d[si], src.d[si + 1], src.d[si + 2], src.d[si + 3]]) } }
  cp(c, ...HEAD.f, 4, 0)
  cp(c, ...RARM.f, 0, 8); cp(c, ...BODY.f, 4, 8); cp(c, ...LARM.f, 12, 8)
  cp(c, ...RLEG.f, 4, 20); cp(c, ...LLEG.f, 8, 20)
  return v
}
function scaleUp(c, f) {
  const o = C(c.w * f, c.h * f)
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const i = (y * c.w + x) * 4; if (c.d[i + 3] === 0) continue; R(o, x * f, y * f, f, f, [c.d[i], c.d[i + 1], c.d[i + 2], c.d[i + 3]]) }
  return o
}

/* ───────────────────────── Écriture ───────────────────────── */
if (existsSync(OUT)) for (const f of readdirSync(OUT)) if (f.endsWith('.png')) rmSync(join(OUT, f))
mkdirSync(OUT, { recursive: true })

const manifest = []
const cells = []
SKINS.forEach((sk, idx) => {
  const canvas = paint(sk.spec, 0x1234 + idx * 7919)
  const pad = String(idx).padStart(2, '0')
  const file = `skin-${pad}.png`
  const thumb = `thumb-${pad}.png`
  writeFileSync(join(OUT, file), encodePNG(64, 64, canvas.d))
  const cell = scaleUp(frontView(canvas), 4) // vue de face 64×128, fond transparent
  writeFileSync(join(OUT, thumb), encodePNG(cell.w, cell.h, cell.d))
  manifest.push({ id: idx, file, thumb, name: sk.name, theme: sk.theme })
  cells.push(cell)
})
writeFileSync(join(OUT, 'skins.json'), JSON.stringify({ default: 0, skins: manifest }, null, 2))

// Planche QA 10×5
const cols = 10, rows = Math.ceil(cells.length / cols), cw = 64, chh = 128, pad = 8
const sheet = C(cols * (cw + pad) + pad, rows * (chh + pad) + pad)
R(sheet, 0, 0, sheet.w, sheet.h, [26, 28, 32, 255])
cells.forEach((cell, i) => {
  const gx = pad + (i % cols) * (cw + pad), gy = pad + ((i / cols) | 0) * (chh + pad)
  for (let y = 0; y < cell.h; y++) for (let x = 0; x < cell.w; x++) { const si = (y * cell.w + x) * 4; if (cell.d[si + 3] === 0) continue; P(sheet, gx + x, gy + y, [cell.d[si], cell.d[si + 1], cell.d[si + 2], 255]) }
})
try { mkdirSync('F:/tmp', { recursive: true }); writeFileSync(QA, encodePNG(sheet.w, sheet.h, sheet.d)) } catch { /* ignore */ }

console.log(`OK: ${SKINS.length} skins → ${OUT}`)
console.log(`QA sheet → ${QA}`)
