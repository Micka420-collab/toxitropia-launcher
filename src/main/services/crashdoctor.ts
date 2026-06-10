import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import type { CrashDiagnosis, CrashFix } from '@shared/types'

export interface CrashInput {
  gameDir: string
  /** Horodatage (ms) du début du lancement, pour ne lire que les fichiers récents. */
  since: number
  exitCode: number
  currentRamMb: number
  totalRamMb: number
}

interface Sources {
  crashReport?: { text: string; path: string }
  hsErr?: { text: string; path: string }
  log?: string
}

const MAX_READ = 200_000

async function readCapped(path: string): Promise<string> {
  const buf = await readFile(path, 'utf8')
  return buf.length > MAX_READ ? buf.slice(buf.length - MAX_READ) : buf
}

/** Cherche le fichier le plus récent d'un dossier correspondant à un filtre. */
async function newestFile(
  dir: string,
  match: (name: string) => boolean,
  since: number
): Promise<{ path: string; mtimeMs: number } | null> {
  let names: string[]
  try {
    names = await readdir(dir)
  } catch {
    return null
  }
  let best: { path: string; mtimeMs: number } | null = null
  for (const name of names) {
    if (!match(name)) continue
    const path = join(dir, name)
    try {
      const s = await stat(path)
      if (s.mtimeMs >= since - 10_000 && (!best || s.mtimeMs > best.mtimeMs)) {
        best = { path, mtimeMs: s.mtimeMs }
      }
    } catch {
      /* ignore */
    }
  }
  return best
}

async function gatherSources(input: CrashInput): Promise<Sources> {
  const out: Sources = {}

  const report = await newestFile(
    join(input.gameDir, 'crash-reports'),
    (n) => n.endsWith('.txt'),
    input.since
  )
  if (report) {
    try {
      out.crashReport = { text: await readCapped(report.path), path: report.path }
    } catch {
      /* ignore */
    }
  }

  const hs = await newestFile(
    input.gameDir,
    (n) => /^hs_err_pid.*\.log$/i.test(n),
    input.since
  )
  if (hs) {
    try {
      out.hsErr = { text: await readCapped(hs.path), path: hs.path }
    } catch {
      /* ignore */
    }
  }

  try {
    out.log = await readCapped(join(input.gameDir, 'logs', 'latest.log'))
  } catch {
    /* ignore */
  }

  return out
}

function tail(text: string, lines: number): string {
  const arr = text.split(/\r?\n/)
  return arr.slice(Math.max(0, arr.length - lines)).join('\n')
}

function buildExcerpt(combined: string): string {
  const interesting = combined
    .split(/\r?\n/)
    .filter((l) =>
      /(Exception|Error|Caused by|requires|missing|incompatible|Mixin|OutOfMemory|EXCEPTION_|Failed|Fatal)/i.test(
        l
      )
    )
  const picked = (interesting.length ? interesting : combined.split(/\r?\n/).filter(Boolean).slice(-12))
    .slice(0, 14)
    .map((l) => l.trim())
  let excerpt = picked.join('\n')
  if (excerpt.length > 1500) excerpt = excerpt.slice(0, 1500) + '…'
  return excerpt
}

function suspectMod(combined: string): string | undefined {
  const patterns = [
    /requires (?:any version|version [^ ]+) of (?:mod )?'?([\w .-]{2,40}?)'?,? which is missing/i,
    /due to errors, provided by '([^']+)'/i,
    /Suspected Mods?:\s*([^\n(]+)/i,
    /Mod '([^']+)' \([\w.-]+\)/i,
    /Failed to (?:create|load) mod instance for '?([\w.-]{2,40})'?/i
  ]
  for (const re of patterns) {
    const m = combined.match(re)
    if (m && m[1]) return m[1].trim()
  }
  return undefined
}

function ramTarget(input: CrashInput): number {
  const headroom = 2048
  const cap = Math.max(input.currentRamMb, input.totalRamMb - headroom)
  let t = Math.min(input.currentRamMb + 2048, cap)
  t = Math.max(t, input.currentRamMb)
  return Math.round(t / 512) * 512
}

interface Rule {
  test: RegExp
  build: (combined: string, input: CrashInput) => Omit<CrashDiagnosis, 'detected' | 'exitCode' | 'logExcerpt' | 'reportPath'>
}

const RULES: Rule[] = [
  {
    test: /OutOfMemoryError|Could not reserve enough space|GC overhead limit exceeded|unable to create new native thread/i,
    build: (_c, input) => {
      const target = ramTarget(input)
      const canBump = target > input.currentRamMb
      const fix: CrashFix = canBump ? { kind: 'setRam', ramMb: target } : { kind: 'none' }
      return {
        severity: 'critical',
        title: 'Mémoire insuffisante',
        cause: `Minecraft a manqué de mémoire (RAM). ${input.currentRamMb} Mo sont alloués, ce n'est pas assez pour ce modpack.`,
        solution: canBump
          ? `Augmente la RAM allouée à ${target} Mo. Clique sur « Corriger automatiquement » pour appliquer ce réglage.`
          : `Ta RAM est déjà au maximum recommandé. Ferme les autres applications avant de jouer, ou ajoute de la mémoire à ton PC.`,
        fix
      }
    }
  },
  {
    test: /UnsupportedClassVersionError|has been compiled by a more recent version of the Java|class file version/i,
    build: () => ({
      severity: 'critical',
      title: 'Mauvaise version de Java',
      cause: 'La version de Java utilisée est trop ancienne (ou trop récente) pour cette version de Minecraft.',
      solution:
        'Va dans Réglages → Java et choisis « Automatique », ou installe la version recommandée. Active aussi le téléchargement auto de Java.',
      fix: { kind: 'none' }
    })
  },
  {
    test: /Incompatible mods? found|Mod resolution (?:failed|encountered)|requires .* which is missing|Missing or unsupported mandatory dependencies|net\.fabricmc\.loader\.impl\.FormattedException/i,
    build: (combined) => {
      const mod = suspectMod(combined)
      return {
        severity: 'critical',
        title: 'Mods incompatibles ou dépendance manquante',
        cause: mod
          ? `Le mod « ${mod} » a besoin d'une dépendance absente, ou entre en conflit avec un autre mod.`
          : `Un mod a besoin d'une dépendance absente, ou plusieurs mods sont incompatibles entre eux.`,
        solution:
          'Resynchronise la configuration du serveur (bouton Synchroniser dans Réglages). Si tu as ajouté des mods manuellement, ouvre le dossier du jeu et retire-les.',
        culprit: mod,
        fix: { kind: 'openGameDir' }
      }
    }
  },
  {
    test: /Duplicate mods|found a duplicate mod|is already provided by/i,
    build: (combined) => ({
      severity: 'critical',
      title: 'Mod en double',
      cause: 'Le même mod est présent en plusieurs exemplaires dans le dossier mods.',
      solution:
        'Ouvre le dossier du jeu et supprime les doublons dans le dossier « mods », puis relance.',
      culprit: suspectMod(combined),
      fix: { kind: 'openGameDir' }
    })
  },
  {
    test: /Mixin (?:apply|prepare) failed|org\.spongepowered\.asm\.mixin|MixinApplyError|InvalidMixinException/i,
    build: (combined) => {
      const mod = suspectMod(combined)
      return {
        severity: 'critical',
        title: 'Conflit de mod (Mixin)',
        cause: mod
          ? `Le mod « ${mod} » n'est pas compatible avec cette version de Minecraft ou avec un autre mod.`
          : `Un mod n'est pas compatible avec cette version de Minecraft ou avec un autre mod.`,
        solution:
          'Vérifie que tous les mods correspondent à la bonne version. Resynchronise la configuration depuis Réglages, ou retire le mod fautif du dossier du jeu.',
        culprit: mod,
        fix: { kind: 'openLog' }
      }
    }
  },
  {
    test: /Pixel format not accelerated|Couldn't set pixel format|Failed to create window|GLFW error|WGL: |EXCEPTION_ACCESS_VIOLATION[\s\S]{0,200}(nvoglv|atio6axx|ig\d|opengl)|Reason: Process crashed/i,
    build: () => ({
      severity: 'critical',
      title: 'Problème de carte graphique / pilotes',
      cause: 'Minecraft n’a pas pu créer la fenêtre de jeu. C’est presque toujours un pilote graphique obsolète.',
      solution:
        'Mets à jour les pilotes de ta carte graphique (NVIDIA / AMD / Intel), puis relance. Vérifie aussi que le PC utilise bien la carte dédiée.',
      fix: { kind: 'none' }
    })
  },
  {
    test: /Connection refused|Connection timed out|UnknownHostException|Failed to connect to the server|io\.netty\.channel/i,
    build: () => ({
      severity: 'warning',
      title: 'Connexion au serveur impossible',
      cause: 'Le jeu s’est lancé mais n’a pas pu rejoindre le serveur (serveur hors ligne ou mauvaise adresse).',
      solution:
        'Vérifie que le serveur est en ligne (voir l’accueil) et que l’adresse est correcte dans le panneau Admin.',
      fix: { kind: 'none' }
    })
  }
]

const NOT_DETECTED: CrashDiagnosis = {
  detected: false,
  severity: 'info',
  title: '',
  cause: '',
  solution: '',
  exitCode: 0
}

/** Analyse la dernière session : détecte et explique un éventuel crash en français. */
export async function analyzeCrash(input: CrashInput): Promise<CrashDiagnosis> {
  const sources = await gatherSources(input)
  const hasFreshReport = !!sources.crashReport || !!sources.hsErr
  const crashy = input.exitCode !== 0 || hasFreshReport
  if (!crashy) return NOT_DETECTED

  const combined = [
    sources.crashReport?.text ?? '',
    sources.hsErr?.text ?? '',
    sources.log ? tail(sources.log, 800) : ''
  ]
    .filter(Boolean)
    .join('\n\n')

  if (!combined.trim() && input.exitCode === 0) return NOT_DETECTED

  const reportPath = sources.crashReport?.path ?? sources.hsErr?.path
  const logExcerpt = buildExcerpt(combined)

  for (const rule of RULES) {
    if (rule.test.test(combined)) {
      const d = rule.build(combined, input)
      return { ...d, detected: true, exitCode: input.exitCode, logExcerpt, reportPath }
    }
  }

  // Crash non identifié.
  return {
    detected: true,
    severity: hasFreshReport ? 'critical' : 'warning',
    title: 'Crash inattendu',
    cause:
      "Minecraft s’est fermé de façon anormale, mais la cause exacte n’a pas pu être identifiée automatiquement.",
    solution:
      'Consulte le journal ci-dessous ou ouvre le rapport de crash complet pour identifier la cause.',
    fix: reportPath ? { kind: 'openLog' } : { kind: 'openGameDir' },
    logExcerpt,
    reportPath,
    exitCode: input.exitCode
  }
}
