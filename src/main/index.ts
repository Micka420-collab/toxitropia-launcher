import { app, shell, BrowserWindow, protocol } from 'electron'
import { join, basename } from 'path'
import { readFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initStore, getState } from './store'
import { registerIpc } from './ipc'
import { initUpdater } from './services/updater'

let mainWindow: BrowserWindow | null = null

// Schéma privilégié `shot://` pour afficher les vignettes de captures d'écran
// (gameDir/screenshots) dans le renderer sans exposer file://. Doit être déclaré
// AVANT app.ready.
protocol.registerSchemesAsPrivileged([
  { scheme: 'shot', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
])

/** Sert un fichier image du dossier screenshots, sécurisé par basename (anti-traversal). */
async function handleShotProtocol(request: Request): Promise<Response> {
  try {
    const name = basename(decodeURIComponent(new URL(request.url).pathname))
    const file = join(getState().settings.gameDir, 'screenshots', name)
    const data = await readFile(file)
    const lower = name.toLowerCase()
    const type = lower.endsWith('.jpg') || lower.endsWith('.jpeg')
      ? 'image/jpeg'
      : lower.endsWith('.webp')
        ? 'image/webp'
        : 'image/png'
    return new Response(new Uint8Array(data), { headers: { 'Content-Type': type } })
  } catch {
    return new Response('', { status: 404 })
  }
}

function createWindow(): void {
  const isMac = process.platform === 'darwin'
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 1000,
    minHeight: 640,
    show: false,
    backgroundColor: '#0a0c10',
    autoHideMenuBar: true,
    // macOS : on garde les « feux tricolores » natifs (fermer/réduire/agrandir) intégrés dans
    // la barre custom, positionnés pour être centrés dans sa hauteur de 44 px. Windows/Linux :
    // fenêtre sans cadre + boutons custom (cf. TitleBar.tsx).
    ...(isMac
      ? { titleBarStyle: 'hidden' as const, trafficLightPosition: { x: 16, y: 15 } }
      : { frame: false, titleBarStyle: 'hidden' as const }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.toxitropia.launcher')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  await initStore()
  protocol.handle('shot', handleShotProtocol)
  registerIpc(() => mainWindow)
  createWindow()

  // Auto-update du launcher (production uniquement ; feed = electron-builder publish).
  if (!is.dev) initUpdater(() => mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
