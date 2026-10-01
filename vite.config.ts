import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works at https://<user>.github.io/<repo>/ regardless of repo name.
// Two pages: the machine (index.html) and the codebreaking walkthrough (codebreaking.html).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: 'index.html',
        codebreaking: 'codebreaking.html',
      },
    },
  },
})
