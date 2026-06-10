import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Square, Users, Wifi, WifiOff, Newspaper, ExternalLink } from 'lucide-react'
import { useStore } from '@/lib/store'
import { pingServer, type ServerStatus, type RosterPlayer } from '@/lib/mcstatus'
import { Badge, Spinner } from '@/components/ui'
import { Play3DButton } from '@/components/Play3DButton'
import { BackgroundScene } from '@/components/three/BackgroundScene'
import { PlayerAvatar } from '@/components/three/PlayerAvatar'
import { cn } from '@/lib/cn'
import { SKINS, DEFAULT_SKIN } from '@/lib/skins'

export function Home(): JSX.Element {
  const app = useStore((s) => s.app)
  const launching = useStore((s) => s.launching)
  const progress = useStore((s) => s.progress)
  const play = useStore((s) => s.play)
  const abort = useStore((s) => s.abort)
  const setLoginOpen = useStore((s) => s.setLoginOpen)

  const manifest = app?.manifest
  const server = manifest?.server
  const account = app?.accounts.find((a) => a.id === app.activeAccountId) ?? null
  const hasAccount = !!account
  const branding = manifest?.branding
  // Skin choisi (catalogue local) → affiché sur l'avatar Home pour les comptes hors-ligne (sync avec la page Skins).
  const skinId = app?.settings.skinId ?? DEFAULT_SKIN
  const localSkin =
    account?.type === 'offline' ? (SKINS.find((s) => s.id === skinId) ?? SKINS[0])?.url : undefined
  const [status, setStatus] = useState<ServerStatus | null>(null)

  useEffect(() => {
    if (!server?.ip) return
    let alive = true
    const run = (): void => {
      void pingServer(server.ip, server.port).then((s) => alive && setStatus(s))
    }
    run()
    const t = setInterval(run, 30000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [server?.ip, server?.port])

  const pct = progress?.percent ?? (progress?.total ? (progress.current! / progress.total) * 100 : null)

  return (
    <div className="relative h-full">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: manifest?.branding.backgroundUrl
              ? `url(${manifest.branding.backgroundUrl})`
              : 'radial-gradient(120% 120% at 50% 0%, rgba(143,192,38,0.16), transparent 55%), radial-gradient(90% 90% at 85% 6%, rgba(168,69,31,0.16), transparent 60%)'
          }}
        />
        {/* Fond 3D animé : blocs Minecraft flottants + particules */}
        <BackgroundScene
          accent={branding?.primaryColor ?? '#8fc026'}
          accent2={branding?.accentColor ?? '#c2e85a'}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-950/30 via-surface-950/60 to-surface-950" />

        <div className="relative flex items-stretch gap-6 px-8 pb-8 pt-12">
          <div className="min-w-0 flex-1">
            <Badge className="mb-4">
              {manifest?.minecraft.version ?? '—'} · {manifest?.minecraft.loader ?? 'vanilla'}
            </Badge>
            <div className="flex items-center gap-3">
              {status?.icon && (
                <img
                  src={status.icon}
                  alt=""
                  className="h-12 w-12 rounded-lg border border-white/10 shadow"
                />
              )}
              <h1 className="text-4xl font-black tracking-tight text-white drop-shadow">
                {server?.name ?? 'Mon Serveur'}
              </h1>
            </div>
            {/* MOTD du serveur (live si dispo, sinon slogan) — l'adresse IP n'est pas affichée */}
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              {'☢ Le dernier archipel — survie apocalyptique tropicale'}
            </p>

            {/* Status row */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StatusPill status={status} />
              {status?.online && status.players && (
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200">
                  <Users size={13} className="accent-text" />
                  <b className="text-white">{status.players.online}</b> / {status.players.max} joueurs
                </span>
              )}
              {status?.version && (
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-400">
                  {status.version}
                </span>
              )}
            </div>

            {/* MOTD live du serveur (récupéré au ping quand il est en ligne) */}
            {status?.online && status.motd && status.motd.some((l) => l.trim() && !l.includes('Powered by Aether')) && (
              <div className="mt-3 max-w-xl rounded-lg border border-white/10 bg-black/30 px-4 py-2.5">
                {status.motd.filter((l) => !l.includes('Powered by Aether')).map((line, i) => (
                  <p key={i} className="truncate text-sm leading-relaxed text-slate-200">
                    {line || ' '}
                  </p>
                ))}
              </div>
            )}

            {/* Roster live des joueurs connectés */}
            {status?.online && status.list && status.list.length > 0 && (
              <Roster players={status.list} />
            )}

            {/* Play CTA */}
            <div className="mt-7">
              {launching ? (
                <div className="max-w-xl">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={abort}
                      className="flex h-14 items-center gap-2.5 rounded-2xl bg-red-500/90 px-6 font-semibold text-white shadow-lg transition hover:bg-red-500"
                    >
                      <Square size={18} /> Annuler
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <Spinner className="h-4 w-4" />
                        <span className="truncate">{progress?.message ?? 'Préparation…'}</span>
                      </div>
                      <div className="xp-bar mt-2 h-2.5 overflow-hidden rounded-sm border-2 border-black/50 bg-black/40">
                        <motion.div
                          className="h-full accent-gradient"
                          animate={{ width: pct != null ? `${pct}%` : '40%' }}
                          transition={{ duration: 0.3 }}
                          style={pct == null ? { opacity: 0.6 } : undefined}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Play3DButton
                  onClick={() => (hasAccount ? play() : setLoginOpen(true))}
                  label={hasAccount ? 'JOUER' : 'Se connecter'}
                />
              )}
            </div>
          </div>

          {/* Avatar 3D du joueur (seulement si connecté) */}
          {account && (
            <div className="hidden shrink-0 items-end md:flex">
              <PlayerAvatar
                name={account.name}
                uuid={account.uuid}
                type={account.type}
                active={launching}
                width={220}
                height={320}
                skinUrl={localSkin}
              />
            </div>
          )}
        </div>
      </div>

      {/* News */}
      <div className="px-8 pb-10">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
          <Newspaper size={15} /> Actualités
        </h2>
        {manifest?.news.length ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {manifest.news.map((n) => (
              <article
                key={n.id}
                className="card overflow-hidden p-0 transition hover:border-white/15"
              >
                {n.image && (
                  <div
                    className="h-32 bg-cover bg-center"
                    style={{ backgroundImage: `url(${n.image})` }}
                  />
                )}
                <div className="p-5">
                  <div className="mb-1.5 flex items-center gap-2">
                    {n.tag && <Badge>{n.tag}</Badge>}
                    <span className="text-xs text-slate-500">{n.date}</span>
                  </div>
                  <h3 className="font-semibold text-white">{n.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-400">
                    {n.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-sm text-slate-500">
            Aucune actualité pour le moment.
          </div>
        )}

        {/* Links */}
        {(manifest?.branding.discordUrl || manifest?.branding.websiteUrl) && (
          <div className="mt-5 flex gap-3">
            {manifest?.branding.websiteUrl && (
              <LinkChip url={manifest.branding.websiteUrl} label="Site web" />
            )}
            {manifest?.branding.discordUrl && (
              <LinkChip url={manifest.branding.discordUrl} label="Discord" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Roster({ players }: { players: RosterPlayer[] }): JSX.Element {
  const shown = players.slice(0, 14)
  const extra = players.length - shown.length
  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="flex -space-x-2">
        {shown.map((p) => (
          <img
            key={p.uuid ?? p.name}
            src={`https://mc-heads.net/avatar/${encodeURIComponent(p.uuid || p.name)}/32`}
            alt={p.name}
            title={p.name}
            className="h-8 w-8 rounded-md border-2 border-surface-950 bg-surface-800 transition-transform hover:z-10 hover:scale-110"
          />
        ))}
      </div>
      {extra > 0 && <span className="text-xs font-medium text-slate-400">+{extra} autres</span>}
    </div>
  )
}

function StatusPill({ status }: { status: ServerStatus | null }): JSX.Element {
  if (!status) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-400">
        <Spinner className="h-3 w-3" /> Vérification…
      </span>
    )
  }
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
        status.online
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-red-500/30 bg-red-500/10 text-red-300'
      )}
    >
      {status.online ? <Wifi size={13} /> : <WifiOff size={13} />}
      {status.online ? 'En ligne' : 'Hors ligne'}
    </span>
  )
}

function LinkChip({ url, label }: { url: string; label: string }): JSX.Element {
  return (
    <button
      onClick={() => window.api.openExternal(url)}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
    >
      {label} <ExternalLink size={12} />
    </button>
  )
}
