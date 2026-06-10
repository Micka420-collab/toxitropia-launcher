import { useState } from 'react'
import {
  Home,
  Package,
  Terminal,
  Settings as SettingsIcon,
  ShieldCheck,
  LogOut,
  Plus,
  ChevronDown,
  UserPlus,
  BarChart3,
  Radio,
  Image,
  Shirt,
  Snowflake,
  Ghost
} from 'lucide-react'
import { useStore, type Page } from '@/lib/store'
import { cn } from '@/lib/cn'
import type { AccountProfile, SeasonalEffect } from '@shared/types'

const NAV: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'mods', label: 'Mods', icon: Package },
  { id: 'skins', label: 'Skins', icon: Shirt },
  { id: 'stats', label: 'Stats & succès', icon: BarChart3 },
  { id: 'radio', label: 'Radio', icon: Radio },
  { id: 'screenshots', label: 'Galerie', icon: Image },
  { id: 'console', label: 'Console', icon: Terminal },
  { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
  { id: 'admin', label: 'Admin', icon: ShieldCheck }
]

function avatarUrl(acc: AccountProfile): string {
  const id = acc.type === 'microsoft' && acc.uuid ? acc.uuid : acc.name
  return `https://mc-heads.net/avatar/${encodeURIComponent(id)}/40`
}

export function Sidebar(): JSX.Element {
  const page = useStore((s) => s.page)
  const setPage = useStore((s) => s.setPage)
  const app = useStore((s) => s.app)
  const setLoginOpen = useStore((s) => s.setLoginOpen)
  const [menuOpen, setMenuOpen] = useState(false)

  const accounts = app?.accounts ?? []
  const active = accounts.find((a) => a.id === app?.activeAccountId) ?? null
  const seasonal = app?.settings.seasonalEffect ?? 'auto'

  function toggleSeason(s: SeasonalEffect): void {
    void window.api.setSettings({ seasonalEffect: seasonal === s ? 'auto' : s })
  }

  async function switchTo(id: string): Promise<void> {
    await window.api.setActiveAccount(id)
    setMenuOpen(false)
  }
  async function logout(id: string): Promise<void> {
    await window.api.logout(id)
    setMenuOpen(false)
  }

  return (
    <aside className="no-drag tex-crack flex w-[230px] shrink-0 flex-col border-r-2 border-black/60 bg-surface-950/40 p-3">
      <nav className="flex flex-col gap-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const activeNav = page === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                activeNav
                  ? 'bg-white/10 text-white shadow-inner'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              {activeNav && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full accent-bg" />
              )}
              <Icon size={18} className={activeNav ? 'accent-text' : ''} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto">
        {/* Ambiance saisonnière — bascule rapide */}
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <span className="mr-auto text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Ambiance
          </span>
          <button
            title="Neige (Noël)"
            onClick={() => toggleSeason('snow')}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-lg transition-colors',
              seasonal === 'snow'
                ? 'accent-bg text-white shadow-glow'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            )}
          >
            <Snowflake size={15} />
          </button>
          <button
            title="Halloween"
            onClick={() => toggleSeason('halloween')}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-lg transition-colors',
              seasonal === 'halloween'
                ? 'bg-orange-500 text-white shadow-glow'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            )}
          >
            <Ghost size={15} />
          </button>
        </div>

        {active ? (
          <div className="relative">
            {menuOpen && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-30 overflow-hidden rounded-xl border border-white/10 bg-surface-850 p-1.5 shadow-2xl">
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2 py-1.5',
                      a.id === active.id ? 'bg-white/5' : 'hover:bg-white/5'
                    )}
                  >
                    <button
                      onClick={() => switchTo(a.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <img src={avatarUrl(a)} alt="" className="h-6 w-6 rounded" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-slate-200">
                          {a.name}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {a.type === 'microsoft' ? 'Premium' : 'Hors-ligne'}
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => logout(a.id)}
                      title="Déconnecter"
                      className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:bg-red-500/20 hover:text-red-300"
                    >
                      <LogOut size={13} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setLoginOpen(true)
                    setMenuOpen(false)
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  <span className="grid h-6 w-6 place-items-center rounded bg-white/5">
                    <UserPlus size={13} />
                  </span>
                  Ajouter un compte
                </button>
              </div>
            )}

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="mc-slot flex w-full items-center gap-2.5 rounded-md border-2 border-bark/60 p-2 text-left transition-colors hover:border-bark"
            >
              <img src={avatarUrl(active)} alt="" className="h-9 w-9 rounded" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-100">
                  {active.name}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {active.type === 'microsoft' ? 'Compte Premium' : 'Hors-ligne'}
                </span>
              </span>
              <ChevronDown
                size={16}
                className={cn('text-slate-500 transition-transform', menuOpen && 'rotate-180')}
              />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setLoginOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl accent-gradient px-3 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
          >
            <Plus size={16} />
            Se connecter
          </button>
        )}
      </div>
    </aside>
  )
}
