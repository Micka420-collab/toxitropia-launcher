import type { ReactNode } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import bundledLogo from '@/assets/logo.png'

export function TitleBar(): JSX.Element {
  const app = useStore((s) => s.app)
  const appName = app?.manifest?.branding.appName ?? 'Zarn'
  // Logo en haut à gauche : celui du manifeste s'il existe, sinon le logo embarqué.
  const logo = app?.manifest?.branding.logoUrl || bundledLogo
  // macOS : on laisse les « feux tricolores » natifs (en haut à gauche) → on cale le logo
  // vers la droite et on masque nos boutons custom (sinon doublon avec les natifs).
  const isMac = (window.api?.platform ?? '') === 'darwin'

  return (
    <header
      className={
        'drag tex-stone relative z-20 flex h-11 shrink-0 items-center justify-between border-b border-black/70 bg-surface-950/60 backdrop-blur ' +
        (isMac ? 'pl-[80px] pr-4' : 'pl-4')
      }
    >
      <span className="hazard-stripe pointer-events-none absolute inset-x-0 bottom-0 h-[3px] opacity-70" />
      <div className="flex items-center gap-2.5">
        {logo ? (
          <img src={logo} alt="" className="h-6 w-6 rounded object-contain" />
        ) : (
          <span className="grid h-5 w-5 place-items-center rounded accent-gradient text-[10px] font-black text-white">
            {appName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="text-[13px] font-semibold tracking-tight text-slate-200">{appName}</span>
      </div>

      {!isMac && (
        <div className="no-drag flex h-full items-stretch">
          <WinBtn onClick={() => window.api.win.minimize()} label="Réduire">
            <Minus size={15} />
          </WinBtn>
          <WinBtn onClick={() => window.api.win.maximize()} label="Agrandir">
            <Square size={12} />
          </WinBtn>
          <WinBtn onClick={() => window.api.win.close()} label="Fermer" danger>
            <X size={16} />
          </WinBtn>
        </div>
      )}
    </header>
  )
}

function WinBtn({
  children,
  onClick,
  label,
  danger
}: {
  children: ReactNode
  onClick: () => void
  label: string
  danger?: boolean
}): JSX.Element {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={
        'grid w-12 place-items-center text-slate-400 transition-colors hover:text-white ' +
        (danger ? 'hover:bg-red-500/90' : 'hover:bg-white/10')
      }
    >
      {children}
    </button>
  )
}
