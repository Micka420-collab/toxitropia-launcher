import { Client } from 'minecraft-launcher-core'
import { app } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import type { ChildProcess } from 'child_process'
import type {
  AccountProfile,
  LauncherManifest,
  LauncherSettings,
  LogLine,
  ProgressEvent
} from '@shared/types'
import { ensureValidAuth } from './auth'
import { prepareLoader } from './loaders'
import { syncModpack } from './modpack'
import { detectJava, downloadJava } from './system'
import { ensureServerInList } from './serversDat'
import { writeBundledResources } from './resources'
import { ensureDir, fileExists } from '../util'

export interface LaunchContext {
  manifest: LauncherManifest
  settings: LauncherSettings
  account: AccountProfile
  emitProgress: (e: ProgressEvent) => void
  emitLog: (l: LogLine) => void
  onAccountRefreshed: (a: AccountProfile) => void
  onClose: (code: number) => void
}

let currentProc: ChildProcess | null = null
let abortController: AbortController | null = null

export function isRunning(): boolean {
  return currentProc !== null
}

export function abortLaunch(): void {
  abortController?.abort()
  if (currentProc) {
    try {
      currentProc.kill()
    } catch {
      /* ignore */
    }
    currentProc = null
  }
}

function mapPhase(t: string): ProgressEvent['phase'] {
  if (t === 'assets') return 'assets'
  if (t === 'natives') return 'natives'
  if (t === 'classes' || t === 'libraries' || t === 'classes-maven-custom') return 'libraries'
  return 'launching'
}

export async function launchGame(ctx: LaunchContext): Promise<void> {
  const { manifest, settings, account, emitProgress, emitLog } = ctx
  abortController = new AbortController()
  const signal = abortController.signal
  const gameDir = settings.gameDir
  await ensureDir(gameDir)

  const log = (text: string, level: LogLine['level'] = 'info'): void =>
    emitLog({ level, text, ts: Date.now() })

  // 1. Java
  emitProgress({ phase: 'java', message: 'Vérification de Java…' })
  let javaPath = settings.javaPath
  if (!javaPath) {
    const found = await detectJava()
    const major = manifest.java.recommendedMajor
    // ⚠️ NE JAMAIS retomber sur un Java plus ANCIEN que `major`. NeoForge 1.21.1 exige
    // Java 21. Lancer (ou installer) sous Java 8/17 fait planter la JVM avec
    // « Could not create the Java Virtual Machine » car les args modulaires de NeoForge
    // (-p, --add-modules, --add-opens) sont du Java 9+. L'ancien `|| found[0]` choisissait
    // le 1ᵉʳ Java trouvé (Java 8 sur un PC vierge) et sautait le téléchargement de Java 21.
    const match =
      found.find((j) => j.major === major) || found.find((j) => j.major >= major)
    if (match) {
      javaPath = match.path
      log(`Java détecté : ${match.version} (${match.path})`)
    } else if (manifest.java.autoDownload) {
      if (found.length) {
        log(
          `Java ${found[0].version} présent mais Java ${major} requis pour NeoForge — téléchargement de Java ${major}…`,
          'warn'
        )
      }
      emitProgress({ phase: 'java', message: `Téléchargement de Java ${major}…` })
      javaPath = await downloadJava(major, join(gameDir, 'runtime'), (r, t) =>
        emitProgress({
          phase: 'java',
          message: `Java ${major} : ${(r / 1e6).toFixed(0)}/${(t / 1e6).toFixed(0)} Mo`,
          current: r,
          total: t,
          percent: t ? Math.round((r / t) * 100) : 0
        })
      )
      log(`Java installé : ${javaPath}`)
    } else {
      throw new Error(`Aucun Java ${major} trouvé. Installe-le ou active le téléchargement auto.`)
    }
  }

  // 2. Vérification / refresh du compte
  emitProgress({ phase: 'checking', message: 'Vérification du compte…' })
  const { account: validAccount, authorization } = await ensureValidAuth(account)
  if (validAccount !== account) ctx.onAccountRefreshed(validAccount)
  log(`Compte : ${validAccount.name} (${validAccount.type})`)

  // 3. Synchronisation du modpack
  if (manifest.mods.length || manifest.resources.length) {
    emitProgress({ phase: 'mods', message: 'Synchronisation du modpack…' })
    await syncModpack(manifest, gameDir, emitProgress, signal)
  }

  // 3a. Pack de ressources + scripts KubeJS : écrits depuis les copies EMBARQUÉES dans le
  // launcher (plus de téléchargement :8090 qui échouait sur un sha1 périmé). Après la sync
  // (qui purgerait d'anciennes copies gérées), on (re)pose les bons fichiers.
  await writeBundledResources(gameDir, log)

  // 3b. Skin hors-ligne : on copie le skin choisi (userData/skin.png) dans le dossier
  // local de CustomSkinLoader (mod client-only du modpack) au nom du joueur. Mojang ne
  // peut pas servir le skin d'un compte hors-ligne → CSL le charge depuis ce fichier.
  // (Comptes Microsoft : on ne touche à rien, leur skin premium reste prioritaire.)
  if (validAccount.type === 'offline') {
    try {
      const src = join(app.getPath('userData'), 'skin.png')
      if (await fileExists(src)) {
        const data = await readFile(src)
        const base = join(gameDir, 'CustomSkinLoader', 'LocalSkin')
        await ensureDir(join(base, 'skins'))
        // On écrit aux deux emplacements connus de CSL (sous-dossier skins/ ET racine).
        await writeFile(join(base, 'skins', `${validAccount.name}.png`), data)
        await writeFile(join(base, `${validAccount.name}.png`), data)
        log(`Skin appliqué (CustomSkinLoader) : ${validAccount.name}`)
      }
    } catch (e) {
      log(`Skin non appliqué : ${e instanceof Error ? e.message : String(e)}`, 'warn')
    }
  }

  // 4. Loader (Fabric / Forge / NeoForge / Quilt)
  emitProgress({ phase: 'forge', message: `Préparation : ${manifest.minecraft.loader}…` })
  const loaderResult = await prepareLoader(
    manifest.minecraft.loader,
    manifest.minecraft.version,
    manifest.minecraft.loaderVersion,
    gameDir,
    (m) => {
      emitProgress({ phase: 'forge', message: m })
      log(m)
    },
    javaPath
  )

  if (signal.aborted) throw new Error('Lancement annulé')

  // 4b. Pré-ajoute le serveur à la liste multijoueur in-game (servers.dat) avec la bonne
  // adresse IP:port → « Zarn » apparaît cliquable même sans auto-connexion, et toute
  // ancienne entrée (sans port / :25565) est corrigée. Non bloquant.
  if (manifest.server.ip) {
    const addr = `${manifest.server.ip}:${manifest.server.port || 25565}`
    try {
      await ensureServerInList(
        gameDir,
        manifest.server.name || 'Zarn',
        manifest.server.ip,
        manifest.server.port || 25565
      )
      log(`Serveur ajouté à la liste multijoueur : ${addr}`)
    } catch (e) {
      log(`servers.dat non mis à jour : ${e instanceof Error ? e.message : String(e)}`, 'warn')
    }
  }

  // 5. Lancement via MCLC
  emitProgress({ phase: 'launching', message: 'Lancement de Minecraft…' })
  const launcher = new Client()

  const minMem = Math.min(1024, settings.ramMb)
  const opts = {
    authorization,
    root: gameDir,
    version: {
      number: manifest.minecraft.version,
      type: 'release' as const,
      ...(loaderResult.custom ? { custom: loaderResult.custom } : {})
    },
    memory: { max: `${settings.ramMb}M`, min: `${minMem}M` },
    javaPath: javaPath && javaPath !== 'java' ? javaPath : undefined,
    window: {
      width: settings.resolution.width,
      height: settings.resolution.height,
      fullscreen: settings.resolution.fullscreen
    },
    customArgs: [
      ...settings.jvmArgs
        .split(' ')
        .map((s) => s.trim())
        .filter(Boolean),
      // Args modulaires NeoForge/Forge (sinon MCLC lance BootstrapLauncher sans
      // module path ni --add-opens → crash InaccessibleObjectException sur Java 21).
      ...(loaderResult.jvmArgs ?? [])
    ],
    overrides: { maxSockets: 6, detached: false },
    ...(loaderResult.forge ? { forge: loaderResult.forge } : {}),
    ...(settings.autoConnect && manifest.server.ip
      ? {
          quickPlay: {
            type: 'multiplayer' as const,
            identifier: `${manifest.server.ip}:${manifest.server.port || 25565}`
          }
        }
      : {})
  }

  launcher.on('debug', (e: string) => log(String(e), 'debug'))
  launcher.on('data', (e: string) => log(String(e), 'game'))
  launcher.on('progress', (e: { type: string; task: number; total: number }) =>
    emitProgress({
      phase: mapPhase(e.type),
      message: `${e.type} (${e.task}/${e.total})`,
      current: e.task,
      total: e.total,
      percent: e.total ? Math.round((e.task / e.total) * 100) : 0
    })
  )
  launcher.on(
    'download-status',
    (e: { name?: string; current: number; total: number }) =>
      emitProgress({
        phase: 'assets',
        message: `Téléchargement ${e.name ?? ''}`,
        current: e.current,
        total: e.total,
        percent: e.total ? Math.round((e.current / e.total) * 100) : 0
      })
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proc = (await launcher.launch(opts as any)) as ChildProcess | null
  currentProc = proc
  emitProgress({ phase: 'running', message: 'Minecraft est lancé !' })

  if (proc) {
    proc.on('close', (code) => {
      currentProc = null
      abortController = null
      emitProgress({ phase: 'closed', message: `Minecraft fermé (code ${code ?? 0})` })
      ctx.onClose(code ?? 0)
    })
  } else {
    currentProc = null
  }
}
