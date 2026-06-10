import { app } from 'electron'
import { join } from 'path'
import type {
  AccountProfile,
  AppState,
  LauncherManifest,
  LauncherSettings,
  PlayStats
} from '@shared/types'
import { DEFAULT_MANIFEST, defaultSettings, defaultStats } from '@shared/defaults'
import { applyLaunch, applySessionEnd } from './services/stats'
import { fetchManifest } from './services/manifest'
import { readJson, writeJson, sha256 } from './util'

interface PersistedState extends AppState {
  adminPasswordHash: string | null
}

let state: PersistedState
let statePath: string

export function getStatePath(): string {
  return statePath
}

export async function initStore(): Promise<void> {
  const userData = app.getPath('userData')
  statePath = join(userData, 'launcher-state.json')
  const defaultGameDir = join(userData, 'minecraft')
  const loaded = await readJson<PersistedState>(statePath)
  if (loaded) {
    state = {
      settings: { ...defaultSettings(defaultGameDir), ...(loaded.settings ?? {}) },
      accounts: loaded.accounts ?? [],
      activeAccountId: loaded.activeAccountId ?? null,
      manifest: loaded.manifest ?? null,
      adminUnlocked: false,
      adminPasswordHash: loaded.adminPasswordHash ?? null,
      stats: { ...defaultStats(), ...(loaded.stats ?? {}) }
    }
  } else {
    state = {
      settings: defaultSettings(defaultGameDir),
      accounts: [],
      activeAccountId: null,
      manifest: null,
      adminUnlocked: false,
      adminPasswordHash: null,
      stats: defaultStats()
    }
  }

  // Migration : adopte le serveur par défaut tant que l'ancien placeholder
  // n'a pas été personnalisé par l'utilisateur.
  if (state.manifest && state.manifest.server?.ip === 'play.monserveur.fr') {
    state.manifest.server = { ...DEFAULT_MANIFEST.server }
  }

  // Si aucune URL de manifeste n'est définie (ancienne install / état vide),
  // on adopte celle par défaut pour que le modpack soit distribué automatiquement.
  if (!state.settings.manifestUrl) {
    state.settings.manifestUrl = defaultSettings(defaultGameDir).manifestUrl
  }

  // Sync auto du manifeste au démarrage : le client a toujours le modpack serveur à jour
  // (NeoForge, mods, pack, serveur). Best-effort avec timeout pour ne pas bloquer si hors-ligne.
  if (state.settings.manifestUrl) {
    try {
      state.manifest = await fetchManifest(state.settings.manifestUrl, AbortSignal.timeout(6000))
    } catch {
      // Échec du fetch (serveur injoignable) : ne JAMAIS conserver un manifeste périmé
      // qui ciblerait une autre version/loader/serveur (ex. ancien Spigot 1.12.2 → :25570) —
      // sinon le launcher lancerait le mauvais client. On retombe sur le manifeste par défaut
      // (NeoForge 1.21.1) si le cache est absent OU incompatible avec la cible courante.
      const cached = state.manifest
      const compatibleCache =
        !!cached &&
        cached.minecraft?.loader === DEFAULT_MANIFEST.minecraft.loader &&
        cached.minecraft?.version === DEFAULT_MANIFEST.minecraft.version
      if (!compatibleCache) state.manifest = { ...DEFAULT_MANIFEST }
    }
  }

  await persist()
}

async function persist(): Promise<void> {
  await writeJson(statePath, state)
}

export function getState(): PersistedState {
  return state
}

/** State sans secrets, sûr à envoyer au renderer. */
export function getPublicState(): AppState {
  return {
    settings: state.settings,
    accounts: state.accounts.map((a) => ({
      id: a.id,
      type: a.type,
      uuid: a.uuid,
      name: a.name,
      expiresAt: a.expiresAt
    })),
    activeAccountId: state.activeAccountId,
    manifest: state.manifest,
    adminUnlocked: state.adminUnlocked,
    stats: state.stats
  }
}

export async function setSettings(patch: Partial<LauncherSettings>): Promise<void> {
  state.settings = { ...state.settings, ...patch }
  await persist()
}

export async function setManifest(m: LauncherManifest | null): Promise<void> {
  state.manifest = m
  await persist()
}

export async function upsertAccount(account: AccountProfile): Promise<void> {
  const idx = state.accounts.findIndex((a) => a.id === account.id || a.uuid === account.uuid)
  if (idx >= 0) state.accounts[idx] = account
  else state.accounts.push(account)
  state.activeAccountId = account.id
  await persist()
}

export async function removeAccount(id: string): Promise<void> {
  state.accounts = state.accounts.filter((a) => a.id !== id)
  if (state.activeAccountId === id) state.activeAccountId = state.accounts[0]?.id ?? null
  await persist()
}

export async function setActiveAccount(id: string): Promise<void> {
  if (state.accounts.some((a) => a.id === id)) {
    state.activeAccountId = id
    await persist()
  }
}

export function getActiveAccount(): AccountProfile | null {
  return state.accounts.find((a) => a.id === state.activeAccountId) ?? null
}

export function getStats(): PlayStats {
  return state.stats
}

/** Incrémente le compteur de lancements (appelé au début d'un lancement). */
export async function recordLaunchStats(): Promise<void> {
  state.stats = applyLaunch(state.stats)
  await persist()
}

/** Clôture une session : cumule le temps, met à jour la série et débloque les succès. */
export async function recordSessionEndStats(
  sessionMs: number,
  launchHour: number
): Promise<string[]> {
  const { stats, newlyUnlocked } = applySessionEnd(state.stats, sessionMs, launchHour)
  state.stats = stats
  await persist()
  return newlyUnlocked
}

export async function setAdminUnlocked(v: boolean): Promise<void> {
  state.adminUnlocked = v
}

export async function setAdminPassword(password: string): Promise<void> {
  state.adminPasswordHash = password ? sha256(password) : null
  await persist()
}

export function hasAdminPassword(): boolean {
  return !!state.adminPasswordHash
}

export function checkAdminPassword(password: string): boolean {
  if (!state.adminPasswordHash) return true
  return state.adminPasswordHash === sha256(password)
}
