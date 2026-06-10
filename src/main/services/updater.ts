import { autoUpdater } from 'electron-updater'
import type { BrowserWindow } from 'electron'

/**
 * Auto-update du launcher lui-même (electron-updater).
 * Feed défini par electron-builder.yml (publish: generic -> nginx VM).
 * Désactivé en dev (pas d'app-update.yml). Émet 'updater:status' au renderer
 * + notification native via checkForUpdatesAndNotify().
 */
export function initUpdater(getWindow: () => BrowserWindow | null): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  const send = (state: string, extra?: Record<string, unknown>): void => {
    const w = getWindow()
    if (w && !w.isDestroyed()) w.webContents.send('updater:status', { state, ...(extra ?? {}) })
  }

  autoUpdater.on('checking-for-update', () => send('checking'))
  autoUpdater.on('update-available', (i) => send('available', { version: i.version }))
  autoUpdater.on('update-not-available', () => send('none'))
  autoUpdater.on('download-progress', (p) => send('downloading', { percent: Math.round(p.percent) }))
  autoUpdater.on('update-downloaded', (i) => send('downloaded', { version: i.version }))
  autoUpdater.on('error', (e) => send('error', { message: String(e) }))

  void autoUpdater.checkForUpdatesAndNotify()

  // Re-vérifie périodiquement : un launcher laissé ouvert récupère une version publiée
  // APRÈS son démarrage sans dépendre d'un redémarrage manuel (cause n°1 du « pack pas à jour »).
  setInterval(() => {
    try {
      void autoUpdater.checkForUpdates()
    } catch {
      /* hors-ligne / dev sans app-update.yml : on ignore */
    }
  }, 30 * 60 * 1000)
}
