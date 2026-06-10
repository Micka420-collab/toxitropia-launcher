import type {
  AppState,
  CrashDiagnosis,
  GameFolder,
  InstalledMod,
  JavaInstall,
  LauncherManifest,
  LauncherSettings,
  LogLine,
  ModrinthInstallResult,
  ModrinthSearchResult,
  NowPlaying,
  ProgressEvent,
  RepairResult,
  Screenshot,
  ServerStatus,
  SystemInfo,
  TuningRecommendation
} from './types'

export interface LauncherApi {
  /** Plateforme hôte (process.platform) — pilote l'UI native (barre de titre mac vs Windows). */
  platform: 'win32' | 'darwin' | 'linux' | string

  getState(): Promise<AppState>
  setSettings(patch: Partial<LauncherSettings>): Promise<AppState>

  fetchManifest(url?: string): Promise<LauncherManifest>
  saveLocalManifest(manifest: LauncherManifest): Promise<LauncherManifest>
  exportManifest(manifest: LauncherManifest): Promise<string | null>
  importManifest(): Promise<LauncherManifest | null>

  loginMicrosoft(): Promise<AppState>
  loginOffline(username: string): Promise<AppState>
  logout(id: string): Promise<AppState>
  setActiveAccount(id: string): Promise<AppState>

  launch(): Promise<{ ok: boolean }>
  abort(): Promise<{ ok: boolean }>

  /** Enregistre le skin choisi (id catalogue + PNG) pour les comptes hors-ligne. */
  setSkin(id: number, data: Uint8Array): Promise<{ ok: boolean }>


  systemInfo(): Promise<SystemInfo>
  detectJava(): Promise<JavaInstall[]>
  getTuning(): Promise<TuningRecommendation>
  pickFolder(def?: string): Promise<string | null>
  pickFile(filters?: { name: string; extensions: string[] }[]): Promise<string | null>
  openExternal(url: string): Promise<boolean>
  openGameDir(): Promise<boolean>
  openLog(): Promise<boolean>

  adminHasPassword(): Promise<boolean>
  adminUnlock(password: string): Promise<boolean>
  adminSetPassword(password: string): Promise<boolean>
  adminLock(): Promise<boolean>

  canBuild(): Promise<boolean>
  buildExe(): Promise<{ code: number; output: string }>

  modrinthSearch(query: string, offset?: number): Promise<ModrinthSearchResult>
  modrinthInstall(p: {
    projectId: string
    slug: string
    title: string
    iconUrl?: string | null
  }): Promise<ModrinthInstallResult>
  modrinthInstalled(): Promise<InstalledMod[]>
  modrinthToggle(filename: string, enabled: boolean): Promise<InstalledMod[]>
  modrinthRemove(filename: string): Promise<InstalledMod[]>

  radioNowPlaying(channelId: string): Promise<NowPlaying | null>

  serverPing(ip: string, port?: number): Promise<ServerStatus>

  repairGame(): Promise<RepairResult>
  reinstallGame(): Promise<RepairResult>
  openFolder(kind: GameFolder): Promise<boolean>

  listScreenshots(): Promise<Screenshot[]>
  openScreenshot(name: string): Promise<boolean>
  deleteScreenshot(name: string): Promise<Screenshot[]>

  win: {
    minimize(): Promise<void>
    maximize(): Promise<void>
    close(): Promise<void>
  }

  on: {
    progress(cb: (e: ProgressEvent) => void): () => void
    log(cb: (l: LogLine) => void): () => void
    state(cb: (s: AppState) => void): () => void
    gameClose(cb: (code: number) => void): () => void
    build(cb: (line: string) => void): () => void
    crash(cb: (d: CrashDiagnosis) => void): () => void
    achievement(cb: (ids: string[]) => void): () => void
    maintenance(cb: (e: ProgressEvent) => void): () => void
  }
}
