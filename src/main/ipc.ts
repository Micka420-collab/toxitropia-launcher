import { BrowserWindow, ipcMain } from 'electron'
import { spawn } from 'child_process'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { app } from 'electron'
import { IPC } from '@shared/ipc'
import type {
  GameFolder,
  LauncherManifest,
  LauncherSettings,
  LogLine,
  ProgressEvent
} from '@shared/types'
import { normalizeManifest, fetchManifest, exportManifest } from './services/manifest'
import { loginMicrosoft, loginOffline } from './services/auth'
import { launchGame, abortLaunch, isRunning } from './services/launcher'
import {
  detectJava,
  getSystemInfo,
  openExternal,
  openPath,
  pickFile,
  pickFolder,
  saveFileDialog
} from './services/system'
import { computeTuning } from './services/tuner'
import { analyzeCrash } from './services/crashdoctor'
import * as modrinth from './services/modrinth'
import { fetchNowPlaying } from './services/radio'
import { pingMinecraftServer } from './services/serverping'
import { syncModpack, wipeManagedFiles } from './services/modpack'
import { listScreenshots, deleteScreenshot, screenshotPath } from './services/media'
import { ensureDir, readJson } from './util'
import * as store from './store'

let getWindow: () => BrowserWindow | null = () => null

function send(channel: string, payload?: unknown): void {
  getWindow()?.webContents.send(channel, payload)
}

function pushState(): void {
  send(IPC.evtState, store.getPublicState())
}

export function registerIpc(windowGetter: () => BrowserWindow | null): void {
  getWindow = windowGetter

  ipcMain.handle(IPC.stateGet, () => store.getPublicState())

  ipcMain.handle(IPC.settingsSet, async (_e, patch: Partial<LauncherSettings>) => {
    await store.setSettings(patch)
    pushState()
    return store.getPublicState()
  })

  // --- Manifest ---
  ipcMain.handle(IPC.manifestFetch, async (_e, url?: string) => {
    const target = (url ?? store.getState().settings.manifestUrl ?? '').trim()
    if (!target) throw new Error("Aucune URL de configuration distante définie.")
    const manifest = await fetchManifest(target)
    await store.setManifest(manifest)
    pushState()
    return manifest
  })

  ipcMain.handle(IPC.manifestSaveLocal, async (_e, manifest: LauncherManifest) => {
    const normalized = normalizeManifest(manifest)
    await store.setManifest(normalized)
    pushState()
    return normalized
  })

  ipcMain.handle(IPC.manifestExport, async (_e, manifest: LauncherManifest) => {
    const dest = await saveFileDialog('launcher-manifest.json')
    if (!dest) return null
    await exportManifest(normalizeManifest(manifest), dest)
    return dest
  })

  ipcMain.handle(IPC.manifestImport, async () => {
    const file = await pickFile([{ name: 'Manifest JSON', extensions: ['json'] }])
    if (!file) return null
    const raw = await readJson<Partial<LauncherManifest>>(file)
    if (!raw) throw new Error('Fichier JSON invalide')
    const manifest = normalizeManifest(raw)
    await store.setManifest(manifest)
    pushState()
    return manifest
  })

  // --- Auth ---
  ipcMain.handle(IPC.authMicrosoft, async () => {
    const account = await loginMicrosoft()
    await store.upsertAccount(account)
    pushState()
    return store.getPublicState()
  })

  ipcMain.handle(IPC.authOffline, async (_e, username: string) => {
    const account = loginOffline(username)
    await store.upsertAccount(account)
    pushState()
    return store.getPublicState()
  })

  ipcMain.handle(IPC.authLogout, async (_e, id: string) => {
    await store.removeAccount(id)
    pushState()
    return store.getPublicState()
  })

  ipcMain.handle(IPC.authSetActive, async (_e, id: string) => {
    await store.setActiveAccount(id)
    pushState()
    return store.getPublicState()
  })

  // --- Launch ---
  ipcMain.handle(IPC.launchStart, async () => {
    if (isRunning()) throw new Error('Minecraft est déjà en cours.')
    const state = store.getState()
    const account = store.getActiveAccount()
    if (!account) throw new Error('Connecte-toi avec un compte avant de jouer.')
    const manifest = state.manifest ?? normalizeManifest(null)
    const win = getWindow()

    const launchedAt = Date.now()
    const launchHour = new Date().getHours()
    await store.recordLaunchStats()
    pushState()

    await launchGame({
      manifest,
      settings: state.settings,
      account,
      emitProgress: (e: ProgressEvent) => send(IPC.evtProgress, e),
      emitLog: (l: LogLine) => send(IPC.evtLog, l),
      onAccountRefreshed: (a) => {
        void store.upsertAccount(a).then(pushState)
      },
      onClose: (code) => {
        send(IPC.evtGameClose, code)
        if (win && !state.settings.keepLauncherOpen) win.show()

        // Stats : clôture de session + succès débloqués.
        void store.recordSessionEndStats(Date.now() - launchedAt, launchHour).then((newly) => {
          pushState()
          if (newly.length) send(IPC.evtAchievement, newly)
        })

        // Assistant anti-crash.
        const sys = getSystemInfo()
        void analyzeCrash({
          gameDir: state.settings.gameDir,
          since: launchedAt,
          exitCode: code,
          currentRamMb: state.settings.ramMb,
          totalRamMb: sys.totalRamMb
        })
          .then((d) => {
            if (d.detected) send(IPC.evtCrash, d)
          })
          .catch(() => undefined)
      }
    })

    if (win && !state.settings.keepLauncherOpen) win.minimize()
    return { ok: true }
  })

  ipcMain.handle(IPC.launchAbort, () => {
    abortLaunch()
    return { ok: true }
  })

  // --- Skin (catalogue intégré) : le renderer envoie le PNG choisi, on le stocke dans
  // userData/skin.png ; au lancement il est copié dans CustomSkinLoader pour les comptes
  // hors-ligne (cf. launcher.ts). On mémorise aussi l'id pour surligner le choix dans l'UI.
  ipcMain.handle(IPC.skinSet, async (_e, id: number, data: Uint8Array) => {
    await writeFile(join(app.getPath('userData'), 'skin.png'), Buffer.from(data))
    await store.setSettings({ skinId: id })
    pushState()
    return { ok: true }
  })

  // --- System ---
  ipcMain.handle(IPC.systemInfo, () => getSystemInfo())
  ipcMain.handle(IPC.systemDetectJava, () => detectJava())
  ipcMain.handle(IPC.systemTuning, () => {
    const s = store.getState()
    const manifest = s.manifest ?? normalizeManifest(null)
    return computeTuning(
      getSystemInfo(),
      manifest.recommendedRamMb,
      manifest.mods.length,
      s.settings.ramMb
    )
  })
  ipcMain.handle(IPC.systemPickFolder, (_e, def?: string) => pickFolder(def))
  ipcMain.handle(IPC.systemPickFile, (_e, filters?: Electron.FileFilter[]) => pickFile(filters))
  ipcMain.handle(IPC.systemOpenExternal, (_e, url: string) => {
    openExternal(url)
    return true
  })
  ipcMain.handle(IPC.systemOpenGameDir, () => {
    openPath(store.getState().settings.gameDir)
    return true
  })
  ipcMain.handle(IPC.systemOpenLog, () => {
    openPath(join(store.getState().settings.gameDir, 'logs', 'latest.log'))
    return true
  })

  // --- Admin ---
  ipcMain.handle(IPC.adminHasPassword, () => store.hasAdminPassword())
  ipcMain.handle(IPC.adminUnlock, async (_e, password: string) => {
    const ok = store.checkAdminPassword(password)
    if (ok) {
      await store.setAdminUnlocked(true)
      pushState()
    }
    return ok
  })
  ipcMain.handle(IPC.adminSetPassword, async (_e, password: string) => {
    await store.setAdminPassword(password)
    return true
  })
  ipcMain.handle(IPC.adminLock, async () => {
    await store.setAdminUnlocked(false)
    pushState()
    return true
  })

  // --- Build .exe ---
  ipcMain.handle(IPC.buildCan, () => !app.isPackaged)
  ipcMain.handle(IPC.buildExe, async () => {
    if (app.isPackaged) {
      throw new Error("Le build n'est possible que depuis les sources (npm).")
    }
    const root = process.cwd()
    const isWin = process.platform === 'win32'
    const cmd = isWin ? 'npm.cmd' : 'npm'
    // Sur le PC Windows de l'admin, C: est plein : on redirige les caches electron /
    // electron-builder et le TEMP vers F:. Hors Windows on n'impose aucun cache custom.
    const buildEnv: Record<string, string> = isWin
      ? {
          ELECTRON_CACHE: 'F:\\electron-cache',
          electron_config_cache: 'F:\\electron-cache',
          ELECTRON_BUILDER_CACHE: 'F:\\electron-builder-cache',
          TEMP: 'F:\\tmp',
          TMP: 'F:\\tmp'
        }
      : {}
    if (isWin) {
      await Promise.all([
        ensureDir(buildEnv.ELECTRON_CACHE),
        ensureDir(buildEnv.ELECTRON_BUILDER_CACHE),
        ensureDir(buildEnv.TEMP)
      ])
    }
    // Script selon l'OS hôte : un .dmg/.app ne se génère que SOUS macOS, un .exe que sous Windows.
    const buildScript = isWin ? 'build:win' : process.platform === 'darwin' ? 'build:mac' : 'build:dir'
    return await new Promise<{ code: number; output: string }>((resolve) => {
      let output = ''
      // shell: true requis sous Windows pour lancer npm.cmd (mitigation EINVAL de CVE-2024-27980).
      const child = spawn(cmd, ['run', buildScript], {
        cwd: root,
        env: { ...process.env, ...buildEnv },
        shell: true
      })
      const onData = (d: Buffer): void => {
        const text = d.toString()
        output += text
        send(IPC.evtBuild, text)
      }
      child.stdout.on('data', onData)
      child.stderr.on('data', onData)
      child.on('close', (code) => {
        const distDir = join(root, 'dist')
        send(IPC.evtBuild, `\n>>> Build terminé (code ${code ?? 0}). Sortie : ${distDir}\n`)
        resolve({ code: code ?? 0, output })
      })
      child.on('error', (err) => {
        send(IPC.evtBuild, `\nErreur build : ${err.message}\n`)
        resolve({ code: 1, output: String(err) })
      })
    })
  })

  // --- Modrinth ---
  ipcMain.handle(IPC.modrinthSearch, (_e, query: string, offset?: number) => {
    const s = store.getState()
    const m = s.manifest ?? normalizeManifest(null)
    return modrinth.searchMods({
      query: query ?? '',
      gameVersion: m.minecraft.version,
      loader: m.minecraft.loader,
      offset
    })
  })
  ipcMain.handle(
    IPC.modrinthInstall,
    (_e, p: { projectId: string; slug: string; title: string; iconUrl?: string | null }) => {
      const s = store.getState()
      const m = s.manifest ?? normalizeManifest(null)
      return modrinth.installMod({
        gameDir: s.settings.gameDir,
        projectId: p.projectId,
        slug: p.slug,
        title: p.title,
        iconUrl: p.iconUrl ?? null,
        gameVersion: m.minecraft.version,
        loader: m.minecraft.loader
      })
    }
  )
  ipcMain.handle(IPC.modrinthInstalled, () => {
    const s = store.getState()
    return modrinth.listInstalled(s.settings.gameDir, s.manifest)
  })
  ipcMain.handle(IPC.modrinthToggle, async (_e, filename: string, enabled: boolean) => {
    const s = store.getState()
    await modrinth.setModEnabled(s.settings.gameDir, filename, enabled)
    return modrinth.listInstalled(s.settings.gameDir, s.manifest)
  })
  ipcMain.handle(IPC.modrinthRemove, async (_e, filename: string) => {
    const s = store.getState()
    await modrinth.removeMod(s.settings.gameDir, filename)
    return modrinth.listInstalled(s.settings.gameDir, s.manifest)
  })

  // --- Radio ---
  ipcMain.handle(IPC.radioNowPlaying, (_e, channelId: string) => fetchNowPlaying(channelId))

  // --- Serveur Minecraft ---
  ipcMain.handle(IPC.serverPing, (_e, ip: string, port?: number) => pingMinecraftServer(ip, port))

  // --- Maintenance : vérifier / réparer / réinstaller le modpack ---
  ipcMain.handle(IPC.gameRepair, () => {
    const s = store.getState()
    const manifest = s.manifest ?? normalizeManifest(null)
    return syncModpack(manifest, s.settings.gameDir, (e) => send(IPC.evtMaintenance, e))
  })

  ipcMain.handle(IPC.gameReinstall, async () => {
    const s = store.getState()
    const manifest = s.manifest ?? normalizeManifest(null)
    send(IPC.evtMaintenance, { phase: 'mods', message: 'Nettoyage des fichiers gérés…', percent: 0 })
    const removedLoader = await wipeManagedFiles(s.settings.gameDir)
    const res = await syncModpack(manifest, s.settings.gameDir, (e) => send(IPC.evtMaintenance, e))
    return { ...res, removed: res.removed + removedLoader }
  })

  // --- Dossiers du jeu ---
  ipcMain.handle(IPC.systemOpenFolder, async (_e, kind: GameFolder) => {
    const gameDir = store.getState().settings.gameDir
    const target = kind === 'game' ? gameDir : join(gameDir, kind)
    if (kind !== 'game') await ensureDir(target).catch(() => undefined)
    openPath(target)
    return true
  })

  // --- Captures d'écran ---
  ipcMain.handle(IPC.screenshotsList, () => listScreenshots(store.getState().settings.gameDir))
  ipcMain.handle(IPC.screenshotOpen, (_e, name: string) => {
    openPath(screenshotPath(store.getState().settings.gameDir, name))
    return true
  })
  ipcMain.handle(IPC.screenshotDelete, async (_e, name: string) => {
    const gameDir = store.getState().settings.gameDir
    await deleteScreenshot(gameDir, name)
    return listScreenshots(gameDir)
  })

  // --- Window controls ---
  ipcMain.handle(IPC.winMinimize, () => getWindow()?.minimize())
  ipcMain.handle(IPC.winMaximize, () => {
    const w = getWindow()
    if (!w) return
    if (w.isMaximized()) w.unmaximize()
    else w.maximize()
  })
  ipcMain.handle(IPC.winClose, () => getWindow()?.close())
}
