export const IPC = {
  stateGet: 'state:get',
  settingsSet: 'settings:set',

  manifestFetch: 'manifest:fetch',
  manifestSaveLocal: 'manifest:saveLocal',
  manifestExport: 'manifest:export',
  manifestImport: 'manifest:import',

  authMicrosoft: 'auth:microsoft',
  authOffline: 'auth:offline',
  authLogout: 'auth:logout',
  authSetActive: 'auth:setActive',

  launchStart: 'launch:start',
  launchAbort: 'launch:abort',

  // Skin (catalogue intégré, comptes hors-ligne)
  skinSet: 'skin:set',

  systemInfo: 'system:info',
  systemDetectJava: 'system:detectJava',
  systemTuning: 'system:tuning',
  systemPickFolder: 'system:pickFolder',
  systemPickFile: 'system:pickFile',
  systemOpenExternal: 'system:openExternal',
  systemOpenGameDir: 'system:openGameDir',
  systemOpenLog: 'system:openLog',

  adminHasPassword: 'admin:hasPassword',
  adminUnlock: 'admin:unlock',
  adminSetPassword: 'admin:setPassword',
  adminLock: 'admin:lock',

  buildCan: 'build:can',
  buildExe: 'build:exe',

  // Modrinth (recherche / installation de mods)
  modrinthSearch: 'modrinth:search',
  modrinthInstall: 'modrinth:install',
  modrinthInstalled: 'modrinth:installed',
  modrinthToggle: 'modrinth:toggle',
  modrinthRemove: 'modrinth:remove',

  // Radio
  radioNowPlaying: 'radio:nowPlaying',

  // Serveur Minecraft
  serverPing: 'server:ping',

  // Maintenance (vérifier / réparer / réinstaller le modpack) + dossiers
  gameRepair: 'game:repair',
  gameReinstall: 'game:reinstall',
  systemOpenFolder: 'system:openFolder',

  // Galerie de captures d'écran
  screenshotsList: 'screenshots:list',
  screenshotOpen: 'screenshots:open',
  screenshotDelete: 'screenshots:delete',

  winMinimize: 'win:minimize',
  winMaximize: 'win:maximize',
  winClose: 'win:close',

  // Événements (main -> renderer)
  evtProgress: 'evt:progress',
  evtLog: 'evt:log',
  evtState: 'evt:state',
  evtGameClose: 'evt:gameClose',
  evtBuild: 'evt:build',
  evtCrash: 'evt:crash',
  evtAchievement: 'evt:achievement',
  evtMaintenance: 'evt:maintenance'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
