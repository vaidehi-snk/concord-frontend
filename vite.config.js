import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Preload the two Latin font files so headings don't swap in late
function preloadFonts() {
  return {
    name: 'concord-preload-fonts',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      const files = Object.keys(ctx.bundle || {}).filter((f) => /(fraunces|hanken-grotesk)-latin-(opsz|wght)-normal-.*\.woff2$/.test(f))
      return {
        html,
        tags: files.map((f) => ({ tag: 'link', attrs: { rel: 'preload', href: `/${f}`, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' })),
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadFonts()],
})
