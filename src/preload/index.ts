import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC } from '@shared/ipc'
import type { LauncherApi } from '@shared/api'

function sub<T>(channel: string, cb: (payload: T) => void): () => void {
  const listener = (_e: IpcRendererEvent, payload: T): void => cb(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: LauncherApi = {
  platform: process.platform,

  getState: () => ipcRenderer.invoke(IPC.stateGet),
  setSettings: (patch) => ipcRenderer.invoke(IPC.settingsSet, patch),

  fetchManifest: (url) => ipcRenderer.invoke(IPC.manifestFetch, url),
  saveLocalManifest: (m) => ipcRenderer.invoke(IPC.manifestSaveLocal, m),
  exportManifest: (m) => ipcRenderer.invoke(IPC.manifestExport, m),
  importManifest: () => ipcRenderer.invoke(IPC.manifestImport),

  loginMicrosoft: () => ipcRenderer.invoke(IPC.authMicrosoft),
  loginOffline: (username) => ipcRenderer.invoke(IPC.authOffline, username),
  logout: (id) => ipcRenderer.invoke(IPC.authLogout, id),
  setActiveAccount: (id) => ipcRenderer.invoke(IPC.authSetActive, id),

  launch: () => ipcRenderer.invoke(IPC.launchStart),
  abort: () => ipcRenderer.invoke(IPC.launchAbort),

  setSkin: (id, data) => ipcRenderer.invoke(IPC.skinSet, id, data),

  systemInfo: () => ipcRenderer.invoke(IPC.systemInfo),
  detectJava: () => ipcRenderer.invoke(IPC.systemDetectJava),
  getTuning: () => ipcRenderer.invoke(IPC.systemTuning),
  pickFolder: (def) => ipcRenderer.invoke(IPC.systemPickFolder, def),
  pickFile: (filters) => ipcRenderer.invoke(IPC.systemPickFile, filters),
  openExternal: (url) => ipcRenderer.invoke(IPC.systemOpenExternal, url),
  openGameDir: () => ipcRenderer.invoke(IPC.systemOpenGameDir),
  openLog: () => ipcRenderer.invoke(IPC.systemOpenLog),

  adminHasPassword: () => ipcRenderer.invoke(IPC.adminHasPassword),
  adminUnlock: (pw) => ipcRenderer.invoke(IPC.adminUnlock, pw),
  adminSetPassword: (pw) => ipcRenderer.invoke(IPC.adminSetPassword, pw),
  adminLock: () => ipcRenderer.invoke(IPC.adminLock),

  canBuild: () => ipcRenderer.invoke(IPC.buildCan),
  buildExe: () => ipcRenderer.invoke(IPC.buildExe),

  modrinthSearch: (query, offset) => ipcRenderer.invoke(IPC.modrinthSearch, query, offset),
  modrinthInstall: (p) => ipcRenderer.invoke(IPC.modrinthInstall, p),
  modrinthInstalled: () => ipcRenderer.invoke(IPC.modrinthInstalled),
  modrinthToggle: (filename, enabled) => ipcRenderer.invoke(IPC.modrinthToggle, filename, enabled),
  modrinthRemove: (filename) => ipcRenderer.invoke(IPC.modrinthRemove, filename),

  radioNowPlaying: (channelId) => ipcRenderer.invoke(IPC.radioNowPlaying, channelId),

  serverPing: (ip, port) => ipcRenderer.invoke(IPC.serverPing, ip, port),

  repairGame: () => ipcRenderer.invoke(IPC.gameRepair),
  reinstallGame: () => ipcRenderer.invoke(IPC.gameReinstall),
  openFolder: (kind) => ipcRenderer.invoke(IPC.systemOpenFolder, kind),

  listScreenshots: () => ipcRenderer.invoke(IPC.screenshotsList),
  openScreenshot: (name) => ipcRenderer.invoke(IPC.screenshotOpen, name),
  deleteScreenshot: (name) => ipcRenderer.invoke(IPC.screenshotDelete, name),

  win: {
    minimize: () => ipcRenderer.invoke(IPC.winMinimize),
    maximize: () => ipcRenderer.invoke(IPC.winMaximize),
    close: () => ipcRenderer.invoke(IPC.winClose)
  },

  on: {
    progress: (cb) => sub(IPC.evtProgress, cb),
    log: (cb) => sub(IPC.evtLog, cb),
    state: (cb) => sub(IPC.evtState, cb),
    gameClose: (cb) => sub(IPC.evtGameClose, cb),
    build: (cb) => sub(IPC.evtBuild, cb),
    crash: (cb) => sub(IPC.evtCrash, cb),
    achievement: (cb) => sub(IPC.evtAchievement, cb),
    maintenance: (cb) => sub(IPC.evtMaintenance, cb)
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-ignore (fallback sans isolation)
  window.api = api
}
