// Cores em variáveis CSS (main.css): o modo claro só troca os valores. `red` usa os tons do `rose`.
const TONS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const escala = (nome) => Object.fromEntries(TONS.map((t) => [t, `rgb(var(--c-${nome}-${t}) / <alpha-value>)`]))

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--c-base) / <alpha-value>)',
        white: 'rgb(var(--c-white) / <alpha-value>)',
        slate: escala('slate'),
        cyan: escala('cyan'),
        emerald: escala('emerald'),
        amber: escala('amber'),
        rose: escala('rose'),
        red: escala('rose'),
        indigo: escala('indigo'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
