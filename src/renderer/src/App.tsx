import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { TitleBar } from '@/components/TitleBar'
import { Sidebar } from '@/components/Sidebar'
import { Login } from '@/components/Login'
import { Spinner } from '@/components/ui'
import { Home } from '@/pages/Home'
import { Mods } from '@/pages/Mods'
import { Skins } from '@/pages/Skins'
import { Stats } from '@/pages/Stats'
import { Radio } from '@/pages/Radio'
import { Screenshots } from '@/pages/Screenshots'
import { Console } from '@/pages/Console'
import { Settings } from '@/pages/Settings'
import { Admin } from '@/pages/Admin'
import { CrashModal } from '@/components/CrashModal'
import { AchievementPopup } from '@/components/AchievementPopup'
import { RadioPlayer } from '@/components/RadioPlayer'
import { SeasonalEffects } from '@/components/SeasonalEffects'
import { IntroVideo } from '@/components/IntroVideo'
import { LoadingScreen } from '@/components/LoadingScreen'
import { ApocOverlay } from '@/components/ApocOverlay'
import { ApocBackground } from '@/components/ApocBackground'
import { JavaHelpModal } from '@/components/JavaHelpModal'
import { applySkin, DEFAULT_SKIN } from '@/lib/skins'

function applyBranding(primary?: string, accent?: string): void {
  const root = document.documentElement
  if (primary) root.style.setProperty('--accent', primary)
  if (accent) root.style.setProperty('--accent-2', accent)
}

export default function App(): JSX.Element {
  const ready = useStore((s) => s.ready)
  const page = useStore((s) => s.page)
  const init = useStore((s) => s.init)
  const branding = useStore((s) => s.app?.manifest?.branding)
  const toast = useStore((s) => s.toast)
  // Compte hors-ligne sans skin choisi → on lui attribue le skin par défaut (« pour les crack »).
  const offlineNeedsSkin = useStore((s) => {
    const a = s.app
    if (!a) return false
    const acc = a.accounts.find((x) => x.id === a.activeAccountId)
    return acc?.type === 'offline' && a.settings.skinId == null
  })

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    if (ready && offlineNeedsSkin) void applySkin(DEFAULT_SKIN)
  }, [ready, offlineNeedsSkin])

  useEffect(() => {
    applyBranding(branding?.primaryColor, branding?.accentColor)
  }, [branding?.primaryColor, branding?.accentColor])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-950/70 text-slate-200">
      {/* Fond global animé apocalyptique (map Minecraft), sous tout le contenu */}
      <ApocBackground />

      <TitleBar />

      {!ready ? (
        <div className="grid flex-1 place-items-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Spinner className="h-7 w-7" />
            <span className="text-sm">Initialisation…</span>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="relative min-w-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                className="h-full overflow-y-auto"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {page === 'home' && <Home />}
                {page === 'mods' && <Mods />}
                {page === 'skins' && <Skins />}
                {page === 'stats' && <Stats />}
                {page === 'radio' && <Radio />}
                {page === 'screenshots' && <Screenshots />}
                {page === 'console' && <Console />}
                {page === 'settings' && <Settings />}
                {page === 'admin' && <Admin />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      )}

      <Login />
      <CrashModal />
      <JavaHelpModal />
      <AchievementPopup />
      <RadioPlayer />
      <SeasonalEffects />

      {/* Ambiance apocalypse tropicale : vignette radioactive, CRT, cendres, spores */}
      <ApocOverlay />

      {/* Voile post-apo : vignette + scanlines crasseuses */}
      <div className="grit-overlay" />

      {/* Intro vidéo (style survie apocalyptique) — jouée une fois par lancement */}
      <IntroVideo />

      {/* Écran de chargement style Garry's Mod + ambiance Metro 2033 (pendant le lancement) */}
      <LoadingScreen />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-5 right-5 z-[60] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              background: toast.kind === 'ok' ? 'rgba(16,40,28,0.92)' : 'rgba(45,18,18,0.92)',
              borderColor: toast.kind === 'ok' ? 'rgba(25,184,90,0.4)' : 'rgba(239,68,68,0.4)'
            }}
          >
            {toast.kind === 'ok' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={18} className="text-red-400" />
            )}
            <span className={toast.kind === 'ok' ? 'text-emerald-100' : 'text-red-100'}>
              {toast.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
