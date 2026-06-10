import type { LauncherApi } from '@shared/api'

declare global {
  interface Window {
    api: LauncherApi
  }
}

export {}
