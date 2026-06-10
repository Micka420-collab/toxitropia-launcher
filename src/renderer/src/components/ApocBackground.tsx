import bgUrl from '@/assets/bg-apocalypse.png'

/**
 * Fond global animé « apocalypse tropicale » : une map Minecraft panoramique
 * (image bundlée) en ken-burns lent, gradée en apocalyptique (assombrie + teintée
 * toxique/braise), avec halo radioactif pulsant et nappes de smog dérivantes.
 *
 * z-index 0 = TOUT EN BAS, derrière le contenu (App.tsx rend la coque
 * semi-transparente pour le révéler). pointer-events-none. Monté en 1er enfant de App.
 * Léger (image + CSS) — pas de Canvas, pour ne pas cumuler avec le BackgroundScene de Home.
 */
export function ApocBackground(): JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }} aria-hidden>
      {/* Map Minecraft, panoramique, ken-burns lent */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'apoc-kenburns 52s ease-in-out infinite',
          willChange: 'transform'
        }}
      />
      {/* Étalonnage apocalyptique : assombrit + teinte braise (haut) / toxique (bas) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,9,12,0.45) 0%, rgba(9,12,16,0.20) 48%, rgba(5,8,12,0.72) 100%),' +
            'radial-gradient(120% 90% at 50% 4%, rgba(245,147,49,0.15), transparent 55%),' +
            'radial-gradient(110% 80% at 50% 100%, rgba(171,217,54,0.10), transparent 62%)',
          mixBlendMode: 'multiply'
        }}
      />
      {/* Vignette radioactive globale */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(135% 120% at 50% 42%, transparent 54%, rgba(4,7,10,0.66) 100%)'
        }}
      />
      {/* Soleil / halo radioactif qui pulse, en haut */}
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '-16%',
          width: '48vw',
          height: '48vw',
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(circle, rgba(255,150,40,0.30), rgba(157,255,46,0.10) 38%, transparent 64%)',
          filter: 'blur(10px)',
          animation: 'rad-pulse 9s ease-in-out infinite'
        }}
      />
      {/* Smog dérivant (2 nappes désynchronisées) */}
      <div
        className="absolute inset-x-[-10%] bottom-0 h-[55%]"
        style={{
          background: 'radial-gradient(60% 100% at 30% 100%, rgba(40,60,36,0.5), transparent 70%)',
          filter: 'blur(28px)',
          mixBlendMode: 'screen',
          animation: 'apoc-smog 26s ease-in-out infinite alternate'
        }}
      />
      <div
        className="absolute inset-x-[-10%] bottom-0 h-[48%]"
        style={{
          background: 'radial-gradient(56% 100% at 72% 100%, rgba(90,40,30,0.42), transparent 70%)',
          filter: 'blur(32px)',
          mixBlendMode: 'screen',
          animation: 'apoc-smog 34s ease-in-out infinite alternate-reverse'
        }}
      />
    </div>
  )
}
