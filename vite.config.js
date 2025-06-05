import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        profile: resolve(__dirname, 'profile.html'),
        leaderboard: resolve(__dirname, 'leaderboard.html')
      }
    }
  },
  css: {
    devSourcemap: true
  },
  publicDir: 'public',
  root: '.'
});