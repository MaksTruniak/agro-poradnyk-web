import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        agro: {
          dark: '#1A3A06',
          DEFAULT: '#3B6D11',
          light: '#6B8F4E',
          bg: '#F5F8F0',
          border: '#D4E8B8',
          hover: '#EAF4DD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config
