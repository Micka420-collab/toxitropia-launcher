import { join } from 'path'
import { writeFile } from 'fs/promises'
import { createWriteStream } from 'fs'
import { spawn } from 'child_process'
import type { LoaderType } from '@shared/types'
import { downloadFile, ensureDir, fetchJson, fileExists, readJson } from '../util'

export interface LoaderResult {
  /** version.custom passé à MCLC (fabric/quilt/neoforge). */
  custom?: string
  /** Chemin de l'installer (forge legacy). */
  forge?: string
  /**
   * Arguments JVM supplémentaires à passer au lancement. NeoForge/Forge modernes
   * (1.20.2+) exigent un lancement MODULAIRE (`-p`, `--add-modules`, `--add-opens`…)
   * que MCLC 3.18.2 laisse tomber (il applique les args JVM du parent vanilla). On les
   * ré-injecte depuis le version JSON pour éviter le crash BootstrapLauncher.
   */
  jvmArgs?: string[]
}

type LogFn = (message: string) => void

export async function prepareLoader(
  loader: LoaderType,
  mcVersion: string,
  loaderVersion: string | undefined,
  gameDir: string,
  log: LogFn,
  javaPath?: string
): Promise<LoaderResult> {
  switch (loader) {
    case 'fabric':
      return prepareFabricLike('fabric', mcVersion, loaderVersion, gameDir, log)
    case 'quilt':
      return prepareFabricLike('quilt', mcVersion, loaderVersion, gameDir, log)
    case 'forge':
      return prepareForge(mcVersion, loaderVersion, gameDir, log)
    case 'neoforge':
      return prepareNeoForge(mcVersion, loaderVersion, gameDir, log, javaPath)
    case 'vanilla':
    default:
      return {}
  }
}

/** Exécute un jar/processus Java et résout quand il se termine proprement. */
function runJava(
  java: string,
  args: string[],
  log: LogFn,
  cwd?: string,
  logFile?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const out = logFile ? createWriteStream(logFile, { flags: 'w' }) : null
    const write = (d: Buffer): void => {
      const s = String(d)
      log(s.trimEnd())
      out?.write(s)
    }
    const proc = spawn(java, args, { stdio: ['ignore', 'pipe', 'pipe'], cwd })
    proc.stdout.on('data', write)
    proc.stderr.on('data', write)
    proc.on('error', (e) => {
      out?.end()
      reject(e)
    })
    proc.on('close', (code) => {
      out?.end()
      code === 0 ? resolve() : reject(new Error(`Installeur a quitté avec le code ${code}`))
    })
  })
}

async function prepareFabricLike(
  kind: 'fabric' | 'quilt',
  mc: string,
  loaderVersion: string | undefined,
  gameDir: string,
  log: LogFn
): Promise<LoaderResult> {
  const base = kind === 'fabric' ? 'https://meta.fabricmc.net/v2' : 'https://meta.quiltmc.org/v3'
  let lv = loaderVersion
  if (!lv) {
    const list = await fetchJson<Array<{ loader: { version: string; stable?: boolean } }>>(
      `${base}/versions/loader/${mc}`
    )
    const stable = list.find((e) => e.loader.stable) ?? list[0]
    if (!stable) throw new Error(`Aucun loader ${kind} disponible pour Minecraft ${mc}`)
    lv = stable.loader.version
  }
  log(`Installation de ${kind} ${lv} pour ${mc}…`)
  const profile = await fetchJson<{ id: string }>(`${base}/versions/loader/${mc}/${lv}/profile/json`)
  const id = profile.id
  const dir = join(gameDir, 'versions', id)
  await ensureDir(dir)
  await writeFile(join(dir, `${id}.json`), JSON.stringify(profile), 'utf8')
  return { custom: id }
}

async function prepareForge(
  mc: string,
  forgeVersion: string | undefined,
  gameDir: string,
  log: LogFn
): Promise<LoaderResult> {
  let fv = forgeVersion
  if (!fv) {
    const promos = await fetchJson<{ promos: Record<string, string> }>(
      'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
    )
    fv = promos.promos[`${mc}-recommended`] || promos.promos[`${mc}-latest`]
    if (!fv) throw new Error(`Aucune version Forge pour Minecraft ${mc}. Précise loaderVersion dans l'admin.`)
  }
  const full = `${mc}-${fv}`
  const url = `https://maven.minecraftforge.net/net/minecraftforge/forge/${full}/forge-${full}-installer.jar`
  const dest = join(gameDir, 'installers', `forge-${full}-installer.jar`)
  log(`Téléchargement de Forge ${fv}…`)
  await downloadFile(url, dest)
  return { forge: dest }
}

async function resolveNeoForgeVersion(mc: string, version: string | undefined): Promise<string> {
  if (version) return version
  const meta = await fetchJson<{ versions: string[] }>(
    'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge'
  )
  const parts = mc.split('.')
  const major = parts[1]
  const patch = parts[2] ?? '0'
  // NeoForge versionne <majeur MC>.<patch MC>.<build>. Pour MC 1.21.1 → "21.1.x".
  // ⚠️ NE PAS utiliser startsWith("21.1") : cela capture aussi 21.10.x / 21.11.x
  // (MC 1.21.10 / 1.21.11). On ancre le motif et on trie numériquement sur le build.
  const re = new RegExp(`^${major}\\.${patch}\\.\\d+$`)
  const matching = meta.versions
    .filter((x) => re.test(x))
    .sort((a, b) => Number(a.split('.')[2]) - Number(b.split('.')[2]))
  const v = matching[matching.length - 1]
  if (!v) throw new Error(`Aucune version NeoForge pour Minecraft ${mc}. Précise loaderVersion dans l'admin.`)
  return v
}

/**
 * Lit les `arguments.jvm` (chaînes) du version JSON NeoForge et substitue les variables
 * que MCLC ne connaît pas (`${library_directory}`, `${classpath_separator}`,
 * `${version_name}`). Ce sont ces arguments — module path `-p`, `--add-modules`,
 * `--add-opens java.base/java.lang.invoke=…` — qui manquent et font planter
 * BootstrapLauncher sur Java moderne (`InaccessibleObjectException`).
 */
async function neoForgeJvmArgs(gameDir: string, versionId: string): Promise<string[]> {
  const json = await readJson<{ arguments?: { jvm?: unknown[] } }>(
    join(gameDir, 'versions', versionId, `${versionId}.json`)
  )
  const raw = json?.arguments?.jvm
  if (!Array.isArray(raw)) return []
  const sep = process.platform === 'win32' ? ';' : ':'
  const libDir = join(gameDir, 'libraries')
  const subst = (s: string): string =>
    s
      .replaceAll('${library_directory}', libDir)
      .replaceAll('${classpath_separator}', sep)
      .replaceAll('${version_name}', versionId)
  const out: string[] = []
  for (const a of raw) {
    // On ignore les objets à règles (OS-specific) : MCLC fournit déjà natives & cp.
    if (typeof a === 'string') out.push(subst(a))
  }
  return out
}

/**
 * NeoForge : on exécute l'installeur officiel en `--installClient` (fiable) pour générer
 * versions/neoforge-<ver>/neoforge-<ver>.json (inheritsFrom <mc>) + les libraries, puis on
 * lance via l'id de version `custom` — au lieu de dépendre du handler `forge` de MCLC (peu fiable).
 * On renvoie aussi les args JVM modulaires de NeoForge (cf. neoForgeJvmArgs).
 */
async function prepareNeoForge(
  mc: string,
  version: string | undefined,
  gameDir: string,
  log: LogFn,
  javaPath?: string
): Promise<LoaderResult> {
  const v = await resolveNeoForgeVersion(mc, version)
  const versionId = `neoforge-${v}`
  const versionJson = join(gameDir, 'versions', versionId, `${versionId}.json`)
  if (await fileExists(versionJson)) {
    log(`NeoForge ${v} déjà installé.`)
    return { custom: versionId, jvmArgs: await neoForgeJvmArgs(gameDir, versionId) }
  }
  const url = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${v}/neoforge-${v}-installer.jar`
  const installer = join(gameDir, 'installers', `neoforge-${v}-installer.jar`)
  log(`Téléchargement de NeoForge ${v}…`)
  await downloadFile(url, installer)
  // L'installeur NeoForge exige un launcher_profiles.json dans le répertoire cible.
  const profiles = join(gameDir, 'launcher_profiles.json')
  if (!(await fileExists(profiles))) {
    await writeFile(
      profiles,
      JSON.stringify({ profiles: {}, selectedProfile: '', clientToken: '', authenticationDatabase: {} }),
      'utf8'
    )
  }
  log(`Installation du client NeoForge ${v}…`)
  // cwd = gameDir : l'installeur NeoForge écrit son propre installer.log dans le CWD.
  // Sur une app installée lancée depuis un raccourci, le CWD peut être NON-INSCRIPTIBLE
  // (System32…) → l'installeur échoue sans produire le version JSON et SANS aucun log de
  // jeu (le client ne démarre jamais). On force un CWD inscriptible + on persiste la sortie
  // dans logs/neoforge-install.log pour pouvoir diagnostiquer.
  const installLog = join(gameDir, 'logs', 'neoforge-install.log')
  await ensureDir(join(gameDir, 'logs'))
  await runJava(
    javaPath && javaPath !== 'java' ? javaPath : 'java',
    ['-jar', installer, '--installClient', gameDir],
    log,
    gameDir,
    installLog
  )
  if (!(await fileExists(versionJson))) {
    throw new Error(
      `L'installation NeoForge ${v} a échoué (voir logs/neoforge-install.log). Causes possibles : Java 21 absent, antivirus qui bloque, ou pas de connexion internet.`
    )
  }
  return { custom: versionId, jvmArgs: await neoForgeJvmArgs(gameDir, versionId) }
}
