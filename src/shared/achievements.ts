import type { PlayStats } from './types'

export interface AchievementDef {
  id: string
  name: string
  desc: string
  icon: string
  /** Renvoie true si le succès est débloqué pour ces stats. */
  test: (s: PlayStats, ctx: AchievementContext) => boolean
}

export interface AchievementContext {
  /** Heure locale du lancement (0-23), utile pour les succès horaires. */
  launchHour: number
  /** Durée de la session qui vient de se terminer, en ms. */
  lastSessionMs: number
}

const H = 3_600_000

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_launch',
    name: 'Première étincelle',
    desc: 'Lancer le jeu pour la première fois.',
    icon: '🚀',
    test: (s) => s.launches >= 1
  },
  {
    id: 'play_1h',
    name: 'Mise en jambes',
    desc: 'Cumuler 1 heure de jeu.',
    icon: '⏱️',
    test: (s) => s.totalMs >= 1 * H
  },
  {
    id: 'play_10h',
    name: 'Aventurier',
    desc: 'Cumuler 10 heures de jeu.',
    icon: '⛏️',
    test: (s) => s.totalMs >= 10 * H
  },
  {
    id: 'play_100h',
    name: 'Vétéran',
    desc: 'Cumuler 100 heures de jeu.',
    icon: '🏆',
    test: (s) => s.totalMs >= 100 * H
  },
  {
    id: 'marathon',
    name: 'Marathonien',
    desc: 'Jouer plus de 3 heures en une seule session.',
    icon: '🔥',
    test: (_s, c) => c.lastSessionMs >= 3 * H
  },
  {
    id: 'night_owl',
    name: 'Oiseau de nuit',
    desc: 'Lancer le jeu entre minuit et 5 h du matin.',
    icon: '🦉',
    test: (_s, c) => c.launchHour >= 0 && c.launchHour < 5
  },
  {
    id: 'streak_3',
    name: 'Régulier',
    desc: 'Jouer 3 jours d’affilée.',
    icon: '📅',
    test: (s) => s.streakDays >= 3
  },
  {
    id: 'streak_7',
    name: 'Inarrêtable',
    desc: 'Jouer 7 jours d’affilée.',
    icon: '⚡',
    test: (s) => s.streakDays >= 7
  },
  {
    id: 'dedicated',
    name: 'Pilier du serveur',
    desc: 'Lancer le jeu 50 fois.',
    icon: '💎',
    test: (s) => s.launches >= 50
  },
  {
    id: 'play_50h',
    name: 'Confirmé',
    desc: 'Cumuler 50 heures de jeu.',
    icon: '🛡️',
    test: (s) => s.totalMs >= 50 * H
  },
  {
    id: 'play_250h',
    name: 'Maître du serveur',
    desc: 'Cumuler 250 heures de jeu.',
    icon: '👑',
    test: (s) => s.totalMs >= 250 * H
  },
  {
    id: 'play_500h',
    name: 'Légende vivante',
    desc: 'Cumuler 500 heures de jeu.',
    icon: '🌟',
    test: (s) => s.totalMs >= 500 * H
  },
  {
    id: 'play_1000h',
    name: 'Immortel',
    desc: 'Cumuler 1000 heures de jeu.',
    icon: '☄️',
    test: (s) => s.totalMs >= 1000 * H
  },
  {
    id: 'launches_10',
    name: 'Habitué',
    desc: 'Lancer le jeu 10 fois.',
    icon: '🚪',
    test: (s) => s.launches >= 10
  },
  {
    id: 'launches_100',
    name: 'Inconditionnel',
    desc: 'Lancer le jeu 100 fois.',
    icon: '🧲',
    test: (s) => s.launches >= 100
  },
  {
    id: 'sessions_25',
    name: 'Assidu',
    desc: 'Terminer 25 sessions de jeu.',
    icon: '🔁',
    test: (s) => s.sessions >= 25
  },
  {
    id: 'sessions_100',
    name: 'Increvable',
    desc: 'Terminer 100 sessions de jeu.',
    icon: '🔋',
    test: (s) => s.sessions >= 100
  },
  {
    id: 'session_6h',
    name: 'Ultra-marathon',
    desc: 'Jouer plus de 6 heures en une seule session.',
    icon: '🏃',
    test: (s) => s.longestSessionMs >= 6 * H
  },
  {
    id: 'session_12h',
    name: 'Sans sommeil',
    desc: 'Jouer plus de 12 heures en une seule session.',
    icon: '💀',
    test: (s) => s.longestSessionMs >= 12 * H
  },
  {
    id: 'streak_14',
    name: 'Routine de fer',
    desc: 'Jouer 14 jours d’affilée.',
    icon: '🗓️',
    test: (s) => s.streakDays >= 14
  },
  {
    id: 'streak_30',
    name: 'Mois parfait',
    desc: 'Jouer 30 jours d’affilée.',
    icon: '🏵️',
    test: (s) => s.streakDays >= 30
  },
  {
    id: 'early_bird',
    name: 'Lève-tôt',
    desc: 'Lancer le jeu entre 5 h et 8 h du matin.',
    icon: '🌅',
    test: (_s, c) => c.launchHour >= 5 && c.launchHour < 8
  },
  {
    id: 'lunch_break',
    name: 'Pause déjeuner',
    desc: 'Lancer le jeu entre 12 h et 14 h.',
    icon: '🥪',
    test: (_s, c) => c.launchHour >= 12 && c.launchHour < 14
  },
  {
    id: 'prime_time',
    name: 'Prime time',
    desc: 'Lancer le jeu entre 20 h et minuit.',
    icon: '📺',
    test: (_s, c) => c.launchHour >= 20 && c.launchHour < 24
  }
]

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}
