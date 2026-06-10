import { join, dirname } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { createHash } from 'crypto'
import { BUNDLED_RESOURCES } from './bundledResources'
import { ensureDir, fileExists } from '../util'

/** Destination (relative à gameDir) de chaque ressource embarquée. */
const TARGETS: Record<string, string> = {
  'casatropia-apoc.zip': 'resourcepacks/casatropia-apoc.zip',
  'apoc_ui.js': 'kubejs/startup_scripts/apoc_ui.js',
  'apoc_items.js': 'kubejs/startup_scripts/apoc_items.js'
}

const PACK_ID = 'file/casatropia-apoc.zip'

/**
 * Écrit les ressources Zarn embarquées (pack + scripts KubeJS) directement dans
 * gameDir, puis active le pack dans options.txt. Plus aucun téléchargement depuis :8090
 * (qui échouait sur un sha1 périmé). Non bloquant.
 */
export async function writeBundledResources(
  gameDir: string,
  log: (m: string, level?: 'info' | 'warn') => void
): Promise<void> {
  try {
    for (const [name, rel] of Object.entries(TARGETS)) {
      const b64 = BUNDLED_RESOURCES[name]
      if (!b64) continue
      const dest = join(gameDir, rel)
      await ensureDir(dirname(dest))
      await writeVerified(dest, Buffer.from(b64, 'base64'), log)
    }
    await writeDefaultOptions(gameDir, log)
    await enablePack(gameDir)
    await writeIrisDefault(gameDir, log)
    log('Pack & scripts Zarn installés (intégrés au launcher).')
  } catch (e) {
    log(`Ressources Zarn non écrites : ${e instanceof Error ? e.message : String(e)}`, 'warn')
  }
}

/**
 * Écrit un fichier puis vérifie son sha1 (relit le fichier). Re-tente une fois si
 * l'écriture est corrompue/verrouillée (antivirus, écriture partielle). Remonte un
 * warning VISIBLE au lieu d'échouer en silence — le joueur saura si le pack n'a pas été posé.
 */
async function writeVerified(
  dest: string,
  buf: Buffer,
  log: (m: string, level?: 'info' | 'warn') => void
): Promise<boolean> {
  const want = createHash('sha1').update(buf).digest('hex')
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await writeFile(dest, buf)
      const got = createHash('sha1').update(await readFile(dest)).digest('hex')
      if (got === want) return true
    } catch (e) {
      if (attempt === 2) {
        log(`Écriture impossible (${dest}) : ${e instanceof Error ? e.message : String(e)}`, 'warn')
        return false
      }
    }
  }
  log(`Fichier écrit corrompu/verrouillé (antivirus ?) : ${dest} — le pack n'a peut-être pas été appliqué.`, 'warn')
  return false
}

/** Active le pack dans options.txt (resourcePacks) sans toucher au reste des réglages. */
async function enablePack(gameDir: string): Promise<void> {
  const p = join(gameDir, 'options.txt')
  let lines: string[] = []
  if (await fileExists(p)) {
    lines = (await readFile(p, 'utf8')).split(/\r?\n/)
  }
  const idx = lines.findIndex((l) => l.startsWith('resourcePacks:'))
  let arr: string[] = []
  if (idx >= 0) {
    try {
      arr = JSON.parse(lines[idx].slice('resourcePacks:'.length))
      if (!Array.isArray(arr)) arr = []
    } catch {
      arr = []
    }
  }
  // Toujours réinsérer notre pack en DERNIER = priorité maximale dans Minecraft,
  // même si le joueur a ajouté d'autres packs après coup.
  arr = arr.filter((x) => x !== PACK_ID)
  arr.push(PACK_ID)
  const line = `resourcePacks:${JSON.stringify(arr)}`
  if (idx >= 0) lines[idx] = line
  else lines.push(line)
  // Force le jeu en français (les mods avec fr_fr basculent auto) + coupe la musique vanilla
  // (anti-chevauchement avec l'ambiance AmbientSounds / la radio). Idempotent, ligne par ligne.
  setOpt(lines, 'lang', 'fr_fr')
  setOpt(lines, 'soundCategory_music', '0.0')
  // Évite une ligne vide finale superflue.
  while (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  await writeFile(p, lines.join('\n') + '\n')
}

/** Met à jour (ou ajoute) une clé "key:value" dans options.txt, sans toucher au reste. */
function setOpt(lines: string[], key: string, value: string): void {
  const k = key + ':'
  const i = lines.findIndex((l) => l.startsWith(k))
  if (i >= 0) lines[i] = k + value
  else lines.push(k + value)
}

// options.txt CLÉ EN MAIN écrit au TOUT PREMIER lancement (client neuf). Réglages partiels :
// Minecraft complète les clés manquantes avec ses défauts. Touches dé-conflictées (IDs vérifiés
// en code source des mods ; AmbientSounds n'a aucun keybind natif → absent). On évite les touches
// vanilla (T=chat, F=main secondaire, Espace=saut, E=inventaire).
const DEFAULT_OPTIONS_TXT = `lang:fr_fr
soundCategory_music:0.0
renderDistance:12
simulationDistance:8
graphicsMode:1
ao:2
renderClouds:"true"
enableVsync:true
gamma:1.0
guiScale:3
particles:0
maxFps:120
biomeBlendRadius:2
bobView:true
entityShadows:true
key_key.push_to_talk:key.keyboard.v
key_key.mute_microphone:key.keyboard.n
key_gui.xaero_world_map:key.keyboard.m
key_gui.xaero_new_waypoint:key.keyboard.u
key_gui.xaero_minimap:key.keyboard.x
key_gui.xaero_waypoints_key:key.keyboard.period
key_gui.xaero_enlarge_map:key.keyboard.z
key_key.tacz.reload.desc:key.keyboard.r
key_key.tacz.fire_select.desc:key.keyboard.g
key_key.tacz.aim.desc:key.mouse.right
key_key.tacz.inspect.desc:key.keyboard.h
key_key.tacz.zoom.desc:key.keyboard.j
key_key.sophisticatedbackpacks.open_backpack:key.keyboard.b
resourcePacks:["file/casatropia-apoc.zip"]
`

/** Écrit un options.txt pré-configuré UNIQUEMENT si absent (client neuf) — ne touche jamais aux réglages d'un joueur existant. */
async function writeDefaultOptions(
  gameDir: string,
  log: (m: string, level?: 'info' | 'warn') => void
): Promise<void> {
  try {
    const p = join(gameDir, 'options.txt')
    if (await fileExists(p)) return // respecte les réglages existants
    await ensureDir(dirname(p))
    await writeFile(p, DEFAULT_OPTIONS_TXT)
    log('options.txt pré-configuré (touches, vidéo, pack, langue) écrit.')
  } catch (e) {
    log(`options.txt par défaut non écrit : ${e instanceof Error ? e.message : String(e)}`, 'warn')
  }
}

/**
 * Active un shaderpack par défaut au TOUT PREMIER lancement (Photon, ambiance Metro 2033),
 * sans jamais écraser le choix ultérieur du joueur (write-once). Les .zip de shaders sont
 * téléchargés dans shaderpacks/ via les "resources" du distribution.json.
 */
async function writeIrisDefault(
  gameDir: string,
  log: (m: string, level?: 'info' | 'warn') => void
): Promise<void> {
  try {
    const p = join(gameDir, 'config', 'iris.properties')
    if (await fileExists(p)) return // respecte le choix existant du joueur
    await ensureDir(dirname(p))
    await writeFile(p, 'enableShaders=true\nshaderPack=photon_v1.3b.zip\n')
    log('Shaders activés par défaut (Photon — ambiance Metro 2033).')
  } catch (e) {
    log(`iris.properties non écrit : ${e instanceof Error ? e.message : String(e)}`, 'warn')
  }
}
