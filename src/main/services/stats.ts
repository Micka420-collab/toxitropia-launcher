import type { PlayStats } from '@shared/types'
import { ACHIEVEMENTS } from '@shared/achievements'

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/** Nombre de jours calendaires entre deux clés YYYY-MM-DD. */
function diffDays(fromKey: string, toKey: string): number {
  const a = new Date(`${fromKey}T00:00:00Z`).getTime()
  const b = new Date(`${toKey}T00:00:00Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** Marque un nouveau lancement (compteur + date du premier lancement). */
export function applyLaunch(stats: PlayStats): PlayStats {
  return {
    ...stats,
    launches: stats.launches + 1,
    firstLaunchAt: stats.firstLaunchAt ?? new Date().toISOString()
  }
}

/**
 * Clôt une session de jeu : cumule le temps, met à jour la série de jours
 * consécutifs puis évalue les succès. Renvoie les succès nouvellement débloqués.
 */
export function applySessionEnd(
  stats: PlayStats,
  sessionMs: number,
  launchHour: number
): { stats: PlayStats; newlyUnlocked: string[] } {
  const ms = Math.max(0, sessionMs)
  const today = dayKey()

  let streak: number
  if (!stats.lastPlayedDate) {
    streak = 1
  } else {
    const d = diffDays(stats.lastPlayedDate, today)
    if (d <= 0) streak = Math.max(1, stats.streakDays)
    else if (d === 1) streak = stats.streakDays + 1
    else streak = 1
  }

  const next: PlayStats = {
    ...stats,
    totalMs: stats.totalMs + ms,
    sessions: stats.sessions + 1,
    longestSessionMs: Math.max(stats.longestSessionMs, ms),
    lastPlayedDate: today,
    streakDays: streak
  }

  const ctx = { launchHour, lastSessionMs: ms }
  const owned = new Set(next.achievements)
  const newlyUnlocked: string[] = []
  for (const a of ACHIEVEMENTS) {
    if (!owned.has(a.id) && a.test(next, ctx)) {
      owned.add(a.id)
      newlyUnlocked.push(a.id)
    }
  }
  next.achievements = [...owned]
  return { stats: next, newlyUnlocked }
}
