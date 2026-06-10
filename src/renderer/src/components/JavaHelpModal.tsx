import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Coffee, X, Settings as SettingsIcon } from 'lucide-react'
import { useStore } from '@/lib/store'

const JAVA_URL = 'https://adoptium.net/temurin/releases/?version=21&package=jre'

/**
 * Aide affichée quand le téléchargement automatique de Java échoue au lancement
 * (erreur marquée JAVA_DOWNLOAD_FAILED côté main). Donne un LIEN direct pour
 * installer le JRE 21 + la procédure pour pointer son chemin. Lit l'état `progress`
 * existant — n'ajoute aucun état au store.
 */
export function JavaHelpModal(): JSX.Element | null {
  const progress = useStore((s) => s.progress)
  const setPage = useStore((s) => s.setPage)
  const [dismissed, setDismissed] = useState<string | null>(null)

  const msg = progress?.phase === 'error' ? progress.message ?? '' : ''
  const isJava = /JAVA_DOWNLOAD_FAILED|adoptium|Java\s*21|JRE/i.test(msg)
  if (!isJava || dismissed === msg) return null

  // macOS : le binaire est .../Contents/Home/bin/java (pas de javaw.exe).
  const isMac = window.api?.platform === 'darwin'
  const javaBin = isMac ? 'bin/java' : 'javaw.exe'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[72] grid place-items-center bg-black/70 p-6 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="card w-full max-w-lg p-6"
          initial={{ scale: 0.94, y: 10 }}
          animate={{ scale: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="glow-acid grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent)]/15">
              <Coffee className="accent-text" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Java 21 requis</h2>
              <p className="text-xs text-slate-400">Le téléchargement automatique a échoué</p>
            </div>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-slate-300">
            Pas de panique — installe Java 21 manuellement en 3 étapes, le launcher s'en servira
            ensuite automatiquement :
          </p>
          <ol className="mb-5 space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="accent-text font-bold">1.</span> Télécharge le <b>JRE Temurin 21</b>{' '}
              (bouton ci-dessous) et installe-le.
            </li>
            <li className="flex gap-2">
              <span className="accent-text font-bold">2.</span> Ouvre <b>Réglages › Java</b> et
              indique le chemin du dossier d'installation (ou de <code>{javaBin}</code>).
            </li>
            <li className="flex gap-2">
              <span className="accent-text font-bold">3.</span> Reviens ici et clique <b>JOUER</b>.
            </li>
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => window.api.openExternal(JAVA_URL)}
              className="accent-gradient flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-glow transition hover:brightness-110"
            >
              <Download size={16} /> Télécharger Java 21
            </button>
            <button
              onClick={() => {
                setPage('settings')
                setDismissed(msg)
              }}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              <SettingsIcon size={16} /> Ouvrir les Réglages
            </button>
            <button
              onClick={() => setDismissed(msg)}
              className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:text-slate-200"
            >
              <X size={16} /> Fermer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
