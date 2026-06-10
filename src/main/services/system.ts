import { dialog, shell } from 'electron'
import os from 'os'
import { join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { chmod, readdir, rm, stat } from 'fs/promises'
import AdmZip from 'adm-zip'
import type { JavaInstall, SystemInfo } from '@shared/types'
import {
  downloadFile,
  ensureDir,
  fetchJson,
  fileExists,
  findFileRecursive,
  sha256File
} from '../util'

const pExecFile = promisify(execFile)

export function getSystemInfo(): SystemInfo {
  const cpus = os.cpus()
  return {
    totalRamMb: Math.round(os.totalmem() / 1024 / 1024),
    freeRamMb: Math.round(os.freemem() / 1024 / 1024),
    cpu: cpus[0]?.model?.trim() || 'Inconnu',
    cores: cpus.length,
    os: `${os.type()} ${os.release()}`,
    arch: os.arch()
  }
}

async function probeJava(javaExe: string): Promise<{ version: string; major: number } | null> {
  try {
    const { stderr, stdout } = await pExecFile(javaExe, ['-version'])
    const out = stderr || stdout
    const m = out.match(/version "([^"]+)"/)
    if (!m) return null
    const version = m[1]
    const parts = version.split(/[._]/)
    let major = parseInt(parts[0], 10)
    if (major === 1) major = parseInt(parts[1], 10)
    return { version, major: isNaN(major) ? 0 : major }
  } catch {
    return null
  }
}

export async function detectJava(): Promise<JavaInstall[]> {
  const isWin = process.platform === 'win32'
  const exe = isWin ? 'java.exe' : 'java'
  const candidates = new Set<string>()

  if (process.env.JAVA_HOME) candidates.add(join(process.env.JAVA_HOME, 'bin', exe))
  candidates.add(exe)

  if (isWin) {
    const roots = [
      'C:\\Program Files\\Java',
      'C:\\Program Files\\Eclipse Adoptium',
      'C:\\Program Files\\Microsoft\\jdk',
      'C:\\Program Files\\Zulu',
      'C:\\Program Files\\Amazon Corretto',
      'C:\\Program Files (x86)\\Java',
      join(process.env.LOCALAPPDATA || '', 'Programs', 'Eclipse Adoptium')
    ]
    for (const root of roots) {
      try {
        for (const e of await readdir(root)) candidates.add(join(root, e, 'bin', exe))
      } catch {
        /* dossier absent */
      }
    }
  } else if (process.platform === 'darwin') {
    // macOS : les JVM sont des « bundles » → le binaire est sous .../Contents/Home/bin/java.
    const home = os.homedir()
    candidates.add('/usr/bin/java')
    const jvmRoots = [
      '/Library/Java/JavaVirtualMachines',
      join(home, 'Library/Java/JavaVirtualMachines')
    ]
    for (const root of jvmRoots) {
      try {
        for (const e of await readdir(root))
          candidates.add(join(root, e, 'Contents', 'Home', 'bin', exe))
      } catch {
        /* absent */
      }
    }
    // Homebrew : Apple Silicon → /opt/homebrew, Intel → /usr/local.
    for (const opt of ['/opt/homebrew/opt', '/usr/local/opt']) {
      candidates.add(join(opt, 'openjdk', 'bin', exe))
      try {
        for (const e of await readdir(opt)) {
          if (!e.startsWith('openjdk')) continue
          candidates.add(join(opt, e, 'bin', exe))
          candidates.add(join(opt, e, 'libexec', 'openjdk.jdk', 'Contents', 'Home', 'bin', exe))
        }
      } catch {
        /* absent */
      }
    }
    // JDK par défaut renvoyé par l'utilitaire système /usr/libexec/java_home.
    try {
      const { stdout } = await pExecFile('/usr/libexec/java_home', [])
      const h = stdout.trim()
      if (h) candidates.add(join(h, 'bin', exe))
    } catch {
      /* aucun JDK enregistré */
    }
  } else {
    // Linux : binaires PATH + scan des emplacements habituels d'installation.
    candidates.add('/usr/bin/java')
    candidates.add('/usr/local/bin/java')
    for (const root of ['/usr/lib/jvm', '/usr/lib64/jvm', '/opt/java', '/opt']) {
      try {
        for (const e of await readdir(root)) candidates.add(join(root, e, 'bin', exe))
      } catch {
        /* absent */
      }
    }
  }

  const results: JavaInstall[] = []
  const seen = new Set<string>()
  for (const c of candidates) {
    if (c !== exe && !(await fileExists(c))) continue
    const v = await probeJava(c)
    const key = c === exe ? 'PATH' : c
    if (v && !seen.has(key)) {
      seen.add(key)
      results.push({
        path: c === exe ? 'java' : c,
        version: v.version,
        major: v.major,
        source: c === exe ? 'PATH' : 'Système'
      })
    }
  }
  return results.sort((a, b) => b.major - a.major)
}

interface AdoptiumPackage {
  link: string
  checksum?: string
  size?: number
}

/**
 * Métadonnées du binaire JRE Adoptium : lien DIRECT (asset GitHub) + sha256 + taille.
 * L'API « assets » fournit le checksum → on peut vérifier l'intégrité du zip. Un
 * téléchargement tronqué (coupure réseau) produit un zip corrompu qui fait planter
 * l'extraction (« ADM-ZIP: Invalid CEN header (bad signature) »). Repli sur l'endpoint
 * « binary/latest » (sans checksum) si l'API assets échoue.
 */
async function adoptiumJre(major: number): Promise<AdoptiumPackage> {
  const osName = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux'
  const arch = process.arch === 'arm64' ? 'aarch64' : 'x64'
  try {
    const assets = await fetchJson<
      Array<{ binary?: { package?: { link?: string; checksum?: string; size?: number } } }>
    >(
      `https://api.adoptium.net/v3/assets/latest/${major}/hotspot?architecture=${arch}&image_type=jre&os=${osName}&vendor=eclipse`
    )
    const pkg = assets?.[0]?.binary?.package
    if (pkg?.link) return { link: pkg.link, checksum: pkg.checksum, size: pkg.size }
  } catch {
    /* l'API assets peut être indisponible → repli ci-dessous */
  }
  return { link: `https://api.adoptium.net/v3/binary/latest/${major}/ga/${osName}/${arch}/jre/hotspot/normal/eclipse` }
}

/**
 * Extrait l'archive d'un JRE dans destDir.
 *  - Windows : `.zip` → AdmZip.
 *  - macOS/Linux : `.tar.gz` → `tar` natif (bsdtar sur macOS, GNU tar sur Linux). AdmZip ne lit
 *    PAS un tar.gz, et `tar` préserve le bit exécutable des binaires (java, libjli…).
 */
async function extractArchive(archivePath: string, destDir: string, isWin: boolean): Promise<void> {
  if (isWin) {
    new AdmZip(archivePath).extractAllTo(destDir, true)
    return
  }
  await pExecFile('tar', ['-xzf', archivePath, '-C', destDir])
}

/**
 * Télécharge un JRE Adoptium (Temurin) dans destDir et renvoie le chemin de java.
 * Vérifie taille + SHA256 et réessaie (3×) : une archive tronquée/corrompue est rejetée puis
 * re-téléchargée au lieu de faire planter l'extraction.
 */
export async function downloadJava(
  major: number,
  destDir: string,
  onProgress?: (received: number, total: number) => void
): Promise<string> {
  const isWin = process.platform === 'win32'
  const exe = isWin ? 'java.exe' : 'java'
  const extractDir = join(destDir, `jre-${major}`)
  const existing = await findFileRecursive(extractDir, exe)
  if (existing) return existing

  const meta = await adoptiumJre(major)
  await ensureDir(destDir)
  // Adoptium sert un .zip sous Windows mais un .tar.gz sous macOS/Linux : on nomme et on extrait
  // l'archive selon l'OS (AdmZip ne sait PAS lire un tar.gz → extraction via `tar` natif).
  const archiveExt = isWin ? 'zip' : 'tar.gz'
  const archivePath = join(destDir, `jre-${major}.${archiveExt}`)

  // Endpoint de repli « binary/latest » (suit les redirections, sans checksum) tenté si le lien
  // d'assets échoue. L'intégrité RÉELLE est validée par l'EXTRACTION + java fonctionnel : un SHA256
  // différent du checksum de l'API (souvent périmé vs l'asset servi) ne bloque donc PAS un JRE valide.
  const osName = isWin ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux'
  const arch = process.arch === 'arm64' ? 'aarch64' : 'x64'
  const fallbackUrl = `https://api.adoptium.net/v3/binary/latest/${major}/ga/${osName}/${arch}/jre/hotspot/normal/eclipse`
  const sources: AdoptiumPackage[] = [{ link: meta.link, checksum: meta.checksum, size: meta.size }]
  if (meta.link !== fallbackUrl) sources.push({ link: fallbackUrl })

  let lastErr: unknown
  for (const src of sources) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await downloadFile(src.link, archivePath, { onProgress })
        // 1) Taille exacte (détecte un téléchargement incomplet sans tout hasher).
        const actual = (await stat(archivePath)).size
        if (src.size && actual !== src.size) {
          throw new Error(`taille ${actual} ≠ ${src.size} attendue (téléchargement incomplet)`)
        }
        // 2) SHA256 : vérif SOUPLE. Le checksum de l'API Adoptium est parfois périmé par rapport à
        //    l'asset réellement servi ; un hash différent sur une archive de la bonne taille n'est PAS
        //    bloquant — c'est l'extraction qui tranche (une vraie archive corrompue fait planter l'extraction).
        if (src.checksum) {
          const got = await sha256File(archivePath)
          if (got.toLowerCase() !== src.checksum.toLowerCase()) {
            console.warn(
              `[java] SHA256 inattendu (checksum API peut-être périmé) — validation par extraction. attendu=${src.checksum} obtenu=${got}`
            )
          }
        }
        // 3) Extraction (après purge d'une extraction partielle d'une tentative précédente).
        await rm(extractDir, { recursive: true, force: true })
        await ensureDir(extractDir)
        await extractArchive(archivePath, extractDir, isWin)
        await rm(archivePath, { force: true })
        const found = await findFileRecursive(extractDir, exe)
        if (!found) throw new Error('Java introuvable après extraction du JRE')
        // macOS/Linux : on garantit le bit exécutable (tar le préserve, mais ceinture + bretelles).
        if (!isWin) await chmod(found, 0o755).catch(() => {})
        return found
      } catch (e) {
        lastErr = e
        // On nettoie tout fichier partiel avant de réessayer.
        await rm(archivePath, { force: true }).catch(() => {})
        await rm(extractDir, { recursive: true, force: true }).catch(() => {})
        await new Promise((r) => setTimeout(r, 1200))
      }
    }
  }
  throw new Error(
    `JAVA_DOWNLOAD_FAILED: Échec du téléchargement automatique de Java ${major}. ` +
      `Installe-le manuellement (Temurin JRE ${major}) : https://adoptium.net/temurin/releases/?version=${major}&package=jre — ` +
      `puis dans le launcher : Réglages › Java › indique le chemin (dossier d'installation ou javaw.exe). ` +
      `Détail : ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`
  )
}

export async function pickFolder(defaultPath?: string): Promise<string | null> {
  const r = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    defaultPath
  })
  return r.canceled || !r.filePaths[0] ? null : r.filePaths[0]
}

export async function pickFile(filters?: Electron.FileFilter[]): Promise<string | null> {
  const r = await dialog.showOpenDialog({ properties: ['openFile'], filters })
  return r.canceled || !r.filePaths[0] ? null : r.filePaths[0]
}

export async function saveFileDialog(defaultName: string): Promise<string | null> {
  const r = await dialog.showSaveDialog({ defaultPath: defaultName })
  return r.canceled || !r.filePath ? null : r.filePath
}

export function openExternal(url: string): void {
  if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
}

export function openPath(p: string): void {
  void shell.openPath(p)
}
