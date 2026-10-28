import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        accent: '#00d4a8',
      },
    },
  },
  plugins: [],
}
export default config
