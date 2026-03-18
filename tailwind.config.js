/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#080808',
          bg2: '#0f0f0f',
          bg3: '#161616',
          bg4: '#1e1e1e',
          bg5: '#242424',
          gold: '#FFD700',
          red: '#FF2D55',
          green: '#00FF88',
          blue: '#0A84FF',
          orange: '#FF6B35',
          purple: '#BF5AF2',
          teal: '#5AC8FA',
          text: '#F0EDE8',
          muted: '#555555',
          muted2: '#777777',
          border: 'rgba(255,255,255,0.06)'
        }
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Barlow', 'sans-serif']
      },
      boxShadow: {
        levelup: '0 0 60px rgba(255, 215, 0, 0.18)'
      },
      maxWidth: {
        app: '30rem'
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        pulseRing: {
          '0%, 100%': { opacity: '0.25', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.04)' }
        }
      },
      animation: {
        floatUp: 'floatUp 0.5s ease forwards',
        pulseRing: 'pulseRing 2.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
