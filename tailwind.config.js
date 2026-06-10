/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Vert « toxique / radioactif » — accent principal du thème post-apo.
        brand: {
          50: '#f7fde8',
          100: '#ecf9c6',
          200: '#daf291',
          300: '#c2e85a',
          400: '#abd936',
          500: '#8fc026',
          600: '#6f9a18',
          700: '#547414',
          800: '#425c16',
          900: '#384e18',
          950: '#1c2b09'
        },
        // Surfaces « cendre / friche » — gris-vert sombre et crasseux.
        surface: {
          950: '#0a0b09',
          900: '#0f110d',
          850: '#151812',
          800: '#1c2017',
          700: '#282d20',
          600: '#383e2c',
          500: '#4b5239'
        },
        // Rouille / métal oxydé.
        rust: {
          400: '#c4602f',
          500: '#a8451f',
          600: '#7e3217',
          700: '#5c2611'
        },
        ember: {
          300: '#ffd08a',
          400: '#ffb454',
          500: '#f59331',
          600: '#db7312',
          700: '#b3560a'
        },
        hazard: '#e8b417', // jaune danger industriel
        danger: '#c2342a', // rouge alerte / sang séché
        bark: '#241a10', // débris de bois sombre
        stone: '#6f6a61' // pierre / béton
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'Rajdhani', 'Sora', 'Inter', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(143, 192, 38, 0.5)',
        'glow-lg': '0 0 80px -10px rgba(143, 192, 38, 0.55)',
        'glow-ember': '0 0 36px -8px rgba(245, 147, 49, 0.5)',
        'glow-danger': '0 0 34px -8px rgba(194, 52, 42, 0.55)'
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        float: 'float 4s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
