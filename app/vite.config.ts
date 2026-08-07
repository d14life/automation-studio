import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  /* Three entries: the live page, the v2 draft and the standalone rock scene.
     Each builds to its own html and shares the same public/ assets, so adding
     one changes nothing about the others. rock.html is a toy page to hand out
     by link — deliberately separate from the site, because it owns the whole
     screen and has no page scroll of its own. */
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        v2: fileURLToPath(new URL('./v2.html', import.meta.url)),
        rock: fileURLToPath(new URL('./rock.html', import.meta.url)),
      },
    },
  },
})
