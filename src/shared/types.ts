// Contrat de types partagé entre le process principal (main) et le renderer.

export type LoaderType = 'vanilla' | 'fabric' | 'forge' | 'neoforge' | 'quilt'

export interface ModFile {
  name: string
  url: string
  sha1?: string
  size?: number
  /** Dossier relatif au game dir. Par défaut "mods". */
  path?: string
  optional?: boolean
  enabled?: boolean
}

export interface ResourceFile {
  name: string
  url: string
  sha1?: string
  /** Chemin relatif au game dir, ex: "config/foo.toml", "resourcepacks/bar.zip". */
  target: string
}

export interface ServerInfo {
  name: string
  ip: string
  port: number
}

export interface BrandingConfig {
  appName: string
  primaryColor: string
  accentColor: string
  logoUrl?: string
  backgroundUrl?: string
  discordUrl?: string
  websiteUrl?: string
}

export interface NewsItem {
  id: string
  title: string
  body: string
  date: string
  image?: string
  tag?: string
}

/** Manifeste distant (ou intégré) qui définit le modpack + le serveur. */
export interface LauncherManifest {
  schemaVersion: number
  updatedAt: string
  server: ServerInfo
  minecraft: {
    version: string
    loader: LoaderType
    loaderVersion?: string
  }
  java: {
    recommendedMajor: number
    autoDownload: boolean
  }
  mods: ModFile[]
  resources: ResourceFile[]
  /** Supprime les mods gérés qui ne sont plus dans le manifeste. */
  enforceModSync: boolean
  branding: BrandingConfig
  news: NewsItem[]
  recommendedRamMb: number
}

export type SeasonalEffect = 'auto' | 'none' | 'snow' | 'halloween'

export interface LauncherSettings {
  manifestUrl: string
  gameDir: string
  javaPath: string
  ramMb: number
  resolution: { width: number; height: number; fullscreen: boolean }
  jvmArgs: string
  keepLauncherOpen: boolean
  autoConnect: boolean
  /** Effet visuel saisonnier de l'interface. */
  seasonalEffect: SeasonalEffect
  /** Skin choisi (id du catalogue intégré) pour les comptes hors-ligne. null = défaut. */
  skinId: number | null
}

/** Statistiques de jeu locales (temps de jeu, séries, succès). */
export interface PlayStats {
  totalMs: number
  sessions: number
  launches: number
  firstLaunchAt: string | null
  lastPlayedDate: string | null
  streakDays: number
  longestSessionMs: number
  achievements: string[]
}

export type CrashFix =
  | { kind: 'setRam'; ramMb: number }
  | { kind: 'openGameDir' }
  | { kind: 'openLog' }
  | { kind: 'none' }

/** Diagnostic produit par l'assistant anti-crash. */
export interface CrashDiagnosis {
  detected: boolean
  severity: 'info' | 'warning' | 'critical'
  title: string
  cause: string
  solution: string
  culprit?: string
  fix?: CrashFix
  logExcerpt?: string
  reportPath?: string
  exitCode: number
}

/** Recommandation de l'auto-tuner de performances. */
export interface TuningRecommendation {
  recommendedRamMb: number
  jvmArgs: string
  score: number
  scoreLabel: string
  notes: string[]
  current: { ramMb: number; matchesRam: boolean }
}

export interface AccountProfile {
  id: string
  type: 'microsoft' | 'offline'
  uuid: string
  name: string
  /** Blob d'autorisation MCLC (microsoft). */
  mclc?: unknown
  /** Token de refresh msmc pour ré-authentifier sans re-login. */
  refreshToken?: string
  expiresAt?: number
}

export interface AppState {
  settings: LauncherSettings
  accounts: AccountProfile[]
  activeAccountId: string | null
  manifest: LauncherManifest | null
  adminUnlocked: boolean
  stats: PlayStats
}

export type LaunchPhase =
  | 'idle'
  | 'checking'
  | 'java'
  | 'manifest'
  | 'mods'
  | 'assets'
  | 'libraries'
  | 'natives'
  | 'forge'
  | 'launching'
  | 'running'
  | 'closed'
  | 'error'

export interface ProgressEvent {
  phase: LaunchPhase
  message: string
  current?: number
  total?: number
  percent?: number
}

export interface LogLine {
  level: 'info' | 'warn' | 'error' | 'debug' | 'game'
  text: string
  ts: number
}

export interface JavaInstall {
  path: string
  version: string
  major: number
  source: string
}

export interface SystemInfo {
  totalRamMb: number
  freeRamMb: number
  cpu: string
  cores: number
  os: string
  arch: string
}

export interface LaunchResult {
  ok: boolean
  error?: string
}

// --- Modrinth (recherche & installation de mods) ---

/** Un résultat de recherche Modrinth, normalisé pour le renderer. */
export interface ModrinthHit {
  projectId: string
  slug: string
  title: string
  description: string
  author: string
  downloads: number
  follows: number
  iconUrl: string | null
  categories: string[]
  /** 'required' | 'optional' | 'unsupported' */
  clientSide: string
  serverSide: string
}

export interface ModrinthSearchResult {
  hits: ModrinthHit[]
  total: number
  offset: number
  limit: number
}

export interface ModrinthInstallResult {
  filename: string
  title: string
}

/** Un mod présent dans le dossier mods/ du jeu. */
export interface InstalledMod {
  /** Nom de fichier canonique (toujours .jar, sans le suffixe .disabled). */
  filename: string
  enabled: boolean
  sizeBytes: number
  /** Métadonnées si installé via Modrinth. */
  projectId?: string
  title?: string
  iconUrl?: string | null
  versionNumber?: string
  /** 'modrinth' (installé par l'utilisateur) ou 'manual' (déposé à la main). */
  source: 'modrinth' | 'manual'
  /** true si le mod fait partie du modpack serveur (géré par la sync, lecture seule). */
  managed: boolean
}

/** Morceau en cours sur une station radio. */
export interface NowPlaying {
  title: string
  artist: string
}

// --- Statut du serveur Minecraft ---

export interface RosterPlayer {
  name: string
  uuid?: string
}

export interface ServerStatus {
  online: boolean
  players?: { online: number; max: number }
  list?: RosterPlayer[]
  version?: string
  motd?: string[]
  icon?: string
}

// --- Maintenance & médias ---

/** Dossiers du jeu ouvrables depuis le launcher. */
export type GameFolder =
  | 'game'
  | 'mods'
  | 'resourcepacks'
  | 'screenshots'
  | 'crash-reports'
  | 'logs'
  | 'config'

/** Résumé d'une vérification / réparation du modpack. */
export interface RepairResult {
  /** Nombre total de fichiers gérés vérifiés (mods + ressources). */
  total: number
  /** Fichiers (re)téléchargés car manquants ou corrompus. */
  downloaded: number
  /** Fichiers obsolètes supprimés (plus dans le manifeste / réinstallation). */
  removed: number
}

/** Une capture d'écran présente dans gameDir/screenshots. */
export interface Screenshot {
  name: string
  mtimeMs: number
  sizeBytes: number
}
