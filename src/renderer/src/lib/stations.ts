export interface RadioStation {
  id: string
  name: string
  genre: string
  url: string
  /** Classe Tailwind de teinte pour l'icône (ex. 'text-emerald-400'). */
  color: string
}

/**
 * Stations de radio internet (flux MP3 directs SomaFM, libres d'écoute et
 * stables). Ambiance pensée pour accompagner une session de jeu.
 */
export const STATIONS: RadioStation[] = [
  {
    id: 'groovesalad',
    name: 'Groove Salad',
    genre: 'Ambient · Downtempo',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    color: 'text-emerald-400'
  },
  {
    id: 'dronezone',
    name: 'Drone Zone',
    genre: 'Ambient spatial',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    color: 'text-sky-400'
  },
  {
    id: 'spacestation',
    name: 'Space Station',
    genre: 'Musique spatiale',
    url: 'https://ice1.somafm.com/spacestation-128-mp3',
    color: 'text-violet-400'
  },
  {
    id: 'lush',
    name: 'Lush',
    genre: 'Chill vocal',
    url: 'https://ice1.somafm.com/lush-128-mp3',
    color: 'text-pink-400'
  },
  {
    id: 'indiepop',
    name: 'Indie Pop Rocks!',
    genre: 'Indie pop',
    url: 'https://ice1.somafm.com/indiepop-128-mp3',
    color: 'text-rose-400'
  },
  {
    id: 'defcon',
    name: 'DEF CON Radio',
    genre: 'Électro · Hacker',
    url: 'https://ice1.somafm.com/defcon-128-mp3',
    color: 'text-red-400'
  },
  {
    id: 'secretagent',
    name: 'Secret Agent',
    genre: 'Lounge · Spy',
    url: 'https://ice1.somafm.com/secretagent-128-mp3',
    color: 'text-amber-400'
  },
  {
    id: 'beatblender',
    name: 'Beat Blender',
    genre: 'Deep house · Downtempo',
    url: 'https://ice1.somafm.com/beatblender-128-mp3',
    color: 'text-cyan-400'
  },
  {
    id: 'thetrip',
    name: 'The Trip',
    genre: 'Prog house',
    url: 'https://ice1.somafm.com/thetrip-128-mp3',
    color: 'text-fuchsia-400'
  },
  {
    id: 'fluid',
    name: 'Fluid',
    genre: 'Hip-hop instrumental',
    url: 'https://ice1.somafm.com/fluid-128-mp3',
    color: 'text-teal-400'
  },
  {
    id: 'folkfwd',
    name: 'Folk Forward',
    genre: 'Folk indie',
    url: 'https://ice1.somafm.com/folkfwd-128-mp3',
    color: 'text-orange-400'
  },
  {
    id: 'u80s',
    name: 'Underground 80s',
    genre: 'Synthpop 80s',
    url: 'https://ice1.somafm.com/u80s-128-mp3',
    color: 'text-indigo-400'
  },
  {
    id: 'metal',
    name: 'Metal Detector',
    genre: 'Métal',
    url: 'https://ice1.somafm.com/metal-128-mp3',
    color: 'text-zinc-300'
  },
  {
    id: 'poptron',
    name: 'PopTron',
    genre: 'Électro pop',
    url: 'https://ice1.somafm.com/poptron-128-mp3',
    color: 'text-lime-400'
  },
  {
    id: 'sonicuniverse',
    name: 'Sonic Universe',
    genre: 'Jazz moderne',
    url: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    color: 'text-yellow-400'
  },
  {
    id: 'vaporwaves',
    name: 'Vaporwaves',
    genre: 'Vaporwave',
    url: 'https://ice1.somafm.com/vaporwaves-128-mp3',
    color: 'text-purple-400'
  },
  {
    id: 'christmas',
    name: 'Christmas Lounge',
    genre: 'Noël · Lounge',
    url: 'https://ice1.somafm.com/christmas-128-mp3',
    color: 'text-red-300'
  },

  // --- Radios françaises ---
  {
    id: 'skyrock',
    name: 'Skyrock',
    genre: 'Rap & R&B 🇫🇷',
    url: 'https://icecast.skyrock.net/s/natio_mp3_128k',
    color: 'text-red-500'
  },
  {
    id: 'nrj',
    name: 'NRJ',
    genre: 'Hits 🇫🇷',
    url: 'https://scdn.nrjaudio.fm/audio1/fr/30001/mp3_128.mp3',
    color: 'text-rose-500'
  },
  {
    id: 'funradio',
    name: 'Fun Radio',
    genre: 'Dance & Électro 🇫🇷',
    url: 'https://streaming.radio.funradio.fr/fun-1-44-128',
    color: 'text-fuchsia-500'
  },
  {
    id: 'rtl2',
    name: 'RTL2',
    genre: 'Pop-rock 🇫🇷',
    url: 'https://streaming.radio.rtl2.fr/rtl2-1-44-128',
    color: 'text-sky-500'
  },
  {
    id: 'rtl',
    name: 'RTL',
    genre: 'Généraliste 🇫🇷',
    url: 'https://streaming.radio.rtl.fr/rtl-1-44-128',
    color: 'text-orange-500'
  },
  {
    id: 'mouv',
    name: "Mouv'",
    genre: 'Rap & hip-hop 🇫🇷',
    url: 'https://icecast.radiofrance.fr/mouv-midfi.mp3',
    color: 'text-pink-500'
  },
  {
    id: 'franceinter',
    name: 'France Inter',
    genre: 'Généraliste 🇫🇷',
    url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
    color: 'text-amber-400'
  },
  {
    id: 'fip',
    name: 'FIP',
    genre: 'Éclectique 🇫🇷',
    url: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
    color: 'text-red-400'
  },
  {
    id: 'fipreggae',
    name: 'FIP Reggae',
    genre: 'Reggae 🎶',
    url: 'https://icecast.radiofrance.fr/fipreggae-midfi.mp3',
    color: 'text-green-500'
  }
]

export function stationById(id: string): RadioStation | undefined {
  return STATIONS.find((s) => s.id === id)
}
