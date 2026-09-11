import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Baut die Landing-Page zu genau einer Datei: keine Code-Teilung, Schriften
// und CSS als Data-URI eingebettet. Damit laesst sie sich verschicken oder
// als Artifact veroeffentlichen, ohne Server.
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SHARE_PREVIEW': '"1"',
  },
  build: {
    outDir: 'dist-share',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'share.html'),
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'share.js',
        assetFileNames: 'share[extname]',
      },
    },
  },
})
