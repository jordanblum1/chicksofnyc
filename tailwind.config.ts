import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-orange': {
          100: '#FFE4D6',
          200: '#FFB088',
          300: '#FF8547',
          400: '#FF6D1F',
          500: '#FF5500',
          600: '#CC4400',
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        'modal-slide-up': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px) scale(0.95)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-in-right': {
          '0%': { 
            opacity: '0',
            transform: 'translateX(20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        'border-pulse': {
          '0%, 100%': { borderColor: 'rgb(255, 85, 0, 0.3)' },
          '50%': { borderColor: 'rgb(255, 85, 0, 0.6)' }
        },
        'wing-flap': {
          '0%, 100%': { 
            transform: 'rotate(-5deg) scale(1)'
          },
          '50%': { 
            transform: 'rotate(5deg) scale(1.1)'
          }
        }
      },
      animation: {
        'modal-slide-up': 'modal-slide-up 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'border-pulse': 'border-pulse 2s ease-in-out infinite',
        'wing-flap': 'wing-flap 2s ease-in-out infinite'
      }
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
};
export default config;
