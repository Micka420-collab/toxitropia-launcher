import { create } from 'zustand'
import type {
  AppState,
  CrashDiagnosis,
  JavaInstall,
  LogLine,
  NowPlaying,
  ProgressEvent,
  SystemInfo
} from '@shared/types'
import { STATIONS } from './stations'

export type Page =
  | 'home'
  | 'mods'
  | 'skins'
  | 'stats'
  | 'console'
  | 'settings'
  | 'admin'
  | 'radio'
  | 'screenshots'

const RUNNING_PHASES = new Set(['checking', 'java', 'manifest', 'mods', 'assets', 'libraries', 'natives', 'forge', 'launching', 'running'])

interface UIState {
  ready: boolean
  page: Page
  app: AppState | null
  system: SystemInfo | null
  javas: JavaInstall[]
  logs: LogLine[]
  progress: ProgressEvent | null
  launching: boolean
  /** Progression d'une opération de maintenance (vérifier/réparer/réinstaller). */
  maintenance: ProgressEvent | null
  buildLog: string
  loginOpen: boolean
  toast: { kind: 'ok' | 'err'; text: string } | null
  crash: CrashDiagnosis | null
  newAchievements: string[] | null

  // Radio
  radioStationId: string | null
  radioPlaying: boolean
  radioVolume: number
  radioLoading: boolean
  radioError: string | null
  radioFavorites: string[]
  radioNowPlaying: NowPlaying | null
  /** Timestamp (ms) auquel la radio s'éteindra, ou null si pas de minuteur. */
  radioSleepUntil: number | null

  setPage: (p: Page) => void
  setLoginOpen: (v: boolean) => void
  setToast: (t: UIState['toast']) => void
  dismissCrash: () => void
  dismissAchievements: () => void
  init: () => Promise<void>
  refreshJava: () => Promise<void>
  play: () => Promise<void>
  abort: () => Promise<void>
  clearLogs: () => void

  // Radio actions
  playRadio: (id: string) => void
  toggleRadio: () => void
  stopRadio: () => void
  setRadioVolume: (v: number) => void
  toggleFavorite: (id: string) => void
  nextStation: () => void
  prevStation: () => void
  shuffleStation: () => void
  setRadioSleep: (minutes: number | null) => void
  setNowPlaying: (np: NowPlaying | null) => void
  /** Usage interne : RadioPlayer reporte l'état réel du flux audio. */
  setRadioStatus: (s: Partial<Pick<UIState, 'radioPlaying' | 'radioLoading' | 'radioError'>>) => void
}

function readFavorites(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem('radioFavorites') || '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

let sleepTimeout: ReturnType<typeof setTimeout> | null = null

function readStoredVolume(): number {
  const v = Number(localStorage.getItem('radioVolume'))
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.7
}

export const useStore = create<UIState>((set, get) => ({
  ready: false,
  page: 'home',
  app: null,
  system: null,
  javas: [],
  logs: [],
  progress: null,
  launching: false,
  maintenance: null,
  buildLog: '',
  loginOpen: false,
  toast: null,
  crash: null,
  newAchievements: null,

  radioStationId: localStorage.getItem('radioStationId'),
  radioPlaying: false,
  radioVolume: readStoredVolume(),
  radioLoading: false,
  radioError: null,
  radioFavorites: readFavorites(),
  radioNowPlaying: null,
  radioSleepUntil: null,

  setPage: (page) => set({ page }),
  setLoginOpen: (loginOpen) => set({ loginOpen }),
  setToast: (toast) => {
    set({ toast })
    if (toast) setTimeout(() => set((s) => (s.toast === toast ? { toast: null } : {})), 3500)
  },
  dismissCrash: () => set({ crash: null }),
  dismissAchievements: () => set({ newAchievements: null }),

  init: async () => {
    const [app, system] = await Promise.all([window.api.getState(), window.api.systemInfo()])
    set({ app, system, ready: true })

    void window.api
      .detectJava()
      .then((javas) => set({ javas }))
      .catch(() => undefined)

    window.api.on.state((s) => set({ app: s }))
    window.api.on.progress((p) =>
      set({ progress: p, launching: RUNNING_PHASES.has(p.phase) })
    )
    window.api.on.log((l) => set((st) => ({ logs: [...st.logs.slice(-1000), l] })))
    window.api.on.gameClose(() => set({ launching: false }))
    window.api.on.build((line) => set((st) => ({ buildLog: st.buildLog + line })))
    window.api.on.maintenance((e) => set({ maintenance: e }))
    window.api.on.crash((d) => set({ crash: d, launching: false }))
    window.api.on.achievement((ids) => {
      if (!ids.length) return
      set({ newAchievements: ids })
      setTimeout(() => set((s) => (s.newAchievements === ids ? { newAchievements: null } : {})), 6500)
    })

    if (app.settings.manifestUrl) {
      window.api
        .fetchManifest()
        .then(() => get().setToast({ kind: 'ok', text: 'Configuration distante synchronisée' }))
        .catch(() => undefined)
    }
  },

  refreshJava: async () => {
    const javas = await window.api.detectJava()
    set({ javas })
  },

  play: async () => {
    set({ launching: true, progress: { phase: 'checking', message: 'Préparation du lancement…' } })
    try {
      await window.api.launch()
    } catch (e) {
      const text = e instanceof Error ? e.message : String(e)
      set((st) => ({
        launching: false,
        progress: { phase: 'error', message: text },
        logs: [...st.logs, { level: 'error', text, ts: Date.now() }]
      }))
      get().setToast({ kind: 'err', text })
    }
  },

  abort: async () => {
    await window.api.abort()
    set({ launching: false, progress: null })
  },

  clearLogs: () => set({ logs: [] }),

  playRadio: (id) => {
    const { radioStationId, radioPlaying } = get()
    if (id === radioStationId) {
      set({ radioPlaying: !radioPlaying })
      return
    }
    localStorage.setItem('radioStationId', id)
    set({ radioStationId: id, radioPlaying: true, radioError: null, radioNowPlaying: null })
  },
  toggleRadio: () => set((s) => (s.radioStationId ? { radioPlaying: !s.radioPlaying } : {})),
  stopRadio: () => {
    if (sleepTimeout) {
      clearTimeout(sleepTimeout)
      sleepTimeout = null
    }
    set({ radioPlaying: false, radioNowPlaying: null, radioSleepUntil: null })
  },
  setRadioVolume: (v) => {
    const vol = Math.min(1, Math.max(0, v))
    localStorage.setItem('radioVolume', String(vol))
    set({ radioVolume: vol })
  },

  toggleFavorite: (id) => {
    const cur = get().radioFavorites
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    localStorage.setItem('radioFavorites', JSON.stringify(next))
    set({ radioFavorites: next })
  },
  nextStation: () => {
    if (!STATIONS.length) return
    const idx = STATIONS.findIndex((s) => s.id === get().radioStationId)
    const next = STATIONS[(idx + 1 + STATIONS.length) % STATIONS.length]
    get().playRadio(next.id)
  },
  prevStation: () => {
    if (!STATIONS.length) return
    const idx = STATIONS.findIndex((s) => s.id === get().radioStationId)
    const prev = STATIONS[(idx - 1 + STATIONS.length) % STATIONS.length]
    get().playRadio(prev.id)
  },
  shuffleStation: () => {
    const pool = STATIONS.filter((s) => s.id !== get().radioStationId)
    const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : STATIONS[0]
    if (pick) get().playRadio(pick.id)
  },
  setRadioSleep: (minutes) => {
    if (sleepTimeout) {
      clearTimeout(sleepTimeout)
      sleepTimeout = null
    }
    if (!minutes || minutes <= 0) {
      set({ radioSleepUntil: null })
      return
    }
    const ms = minutes * 60_000
    sleepTimeout = setTimeout(() => {
      sleepTimeout = null
      set({ radioPlaying: false, radioNowPlaying: null, radioSleepUntil: null })
    }, ms)
    set({ radioSleepUntil: Date.now() + ms })
  },
  setNowPlaying: (np) => set({ radioNowPlaying: np }),

  setRadioStatus: (s) => set(s)
}))
