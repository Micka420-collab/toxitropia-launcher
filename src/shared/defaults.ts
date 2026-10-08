import type { LauncherManifest, LauncherSettings, PlayStats } from './types'

export const SCHEMA_VERSION = 1

export const DEFAULT_MANIFEST: LauncherManifest = {
  schemaVersion: SCHEMA_VERSION,
  updatedAt: new Date(0).toISOString(),
  server: { name: 'MCGenesis', ip: '82.67.63.61', port: 25565 },
  minecraft: { version: '1.21.11', loader: 'vanilla' },
  java: { recommendedMajor: 21, autoDownload: true },
  // Paper accepts a matching vanilla client; the old NeoForge pack is incompatible.
  mods: [],
  resources: [],
  enforceModSync: true,
  branding: {
    appName: 'MCGenesis',
    primaryColor: '#36DFFF',
    accentColor: '#A78BFA',
    logoUrl: '',
    backgroundUrl: '',
    discordUrl: '',
    websiteUrl: 'https://casatropia.fr'
  },
  news: [
    {
      id: 'mcgenesis-concept',
      title: 'Joue avec les IA. Bâtissez ensemble.',
      body: 'Entre dans le monde des IA créées par Micka. Construisez votre cité, explorez ensemble et écrivez une histoire commune.',
      date: new Date().toISOString().slice(0, 10),
      tag: 'Saison'
    }
  ],
  recommendedRamMb: 4096
}

export function defaultSettings(gameDir: string): LauncherSettings {
  return {
    manifestUrl: '',
    gameDir,
    javaPath: '',
    ramMb: 4096,
    resolution: { width: 1280, height: 720, fullscreen: false },
    jvmArgs:
      '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M',
    keepLauncherOpen: false,
    autoConnect: true,
    seasonalEffect: 'auto',
    skinId: null
  }
}

export function defaultStats(): PlayStats {
  return {
    totalMs: 0,
    sessions: 0,
    launches: 0,
    firstLaunchAt: null,
    lastPlayedDate: null,
    streakDays: 0,
    longestSessionMs: 0,
    achievements: []
  }
}
