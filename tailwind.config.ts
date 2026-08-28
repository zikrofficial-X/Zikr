import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#0E4B45',
          emeraldDeep: '#072E2A',
          gold: '#C7A86B',
          goldSoft: '#E6D7B3',
          cream: '#F6F0E5',
          mist: '#8FA49F'
        }
      },
      fontFamily: {
        arabic: ['var(--font-arabic)', 'serif']
      },
      boxShadow: {
        glow: '0 10px 30px rgba(199,168,107,0.2)'
      }
    }
  },
  plugins: [typography, animate],
};

export default config;
