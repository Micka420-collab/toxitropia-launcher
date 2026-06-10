import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Gamepad2, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Button, TextInput } from './ui'

export function Login(): JSX.Element {
  const open = useStore((s) => s.loginOpen)
  const setOpen = useStore((s) => s.setLoginOpen)
  const setToast = useStore((s) => s.setToast)

  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState<'ms' | 'offline' | null>(null)

  const validOffline = /^[A-Za-z0-9_]{3,16}$/.test(username)

  async function microsoft(): Promise<void> {
    setBusy('ms')
    try {
      await window.api.loginMicrosoft()
      setToast({ kind: 'ok', text: 'Compte Microsoft connecté' })
      setOpen(false)
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Échec de la connexion Microsoft' })
    } finally {
      setBusy(null)
    }
  }

  async function offline(): Promise<void> {
    if (!validOffline) return
    setBusy('offline')
    try {
      await window.api.loginOffline(username.trim())
      setToast({ kind: 'ok', text: `Connecté en tant que ${username.trim()}` })
      setOpen(false)
      setUsername('')
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Échec de la connexion' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && setOpen(false)}
        >
          <motion.div
            className="card relative w-[420px] p-7"
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              disabled={!!busy}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold tracking-tight text-white">Connexion</h2>
            <p className="mt-1 text-sm text-slate-400">Choisis comment te connecter pour jouer.</p>

            <button
              onClick={microsoft}
              disabled={!!busy}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-[#2f72d8] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#3a80ea] disabled:opacity-60"
            >
              {busy === 'ms' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <MicrosoftLogo />
              )}
              Se connecter avec Microsoft
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-white/10" />
              OU
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div>
              <span className="label flex items-center gap-1.5">
                <Gamepad2 size={13} /> Mode hors-ligne
              </span>
              <div className="flex gap-2">
                <TextInput
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && offline()}
                  placeholder="Pseudo (3-16 caractères)"
                  maxLength={16}
                  disabled={!!busy}
                />
                <Button
                  variant="accent"
                  onClick={offline}
                  disabled={!validOffline || !!busy}
                  className="shrink-0"
                >
                  {busy === 'offline' ? <Loader2 size={16} className="animate-spin" /> : 'Jouer'}
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Le mode hors-ligne ne nécessite pas d&apos;achat de Minecraft, mais certains serveurs
                premium le refusent.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MicrosoftLogo(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden>
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  )
}
