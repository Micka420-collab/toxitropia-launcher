import type { RosterPlayer, ServerStatus } from '@shared/types'

export type { RosterPlayer, ServerStatus }

/**
 * Statut du serveur. Le ping réel est effectué côté main (TCP Server List Ping
 * natif, comme le jeu) : pas de blocage CORS, et fonctionne avec les serveurs
 * locaux (LAN) injoignables par les API publiques.
 */
export function pingServer(ip: string, port?: number): Promise<ServerStatus> {
  return window.api.serverPing(ip, port)
}
