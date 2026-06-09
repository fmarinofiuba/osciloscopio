import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  root: '.',
  base: './',
  plugins: [react()],
  server: {
    host: true,
    hmr: { overlay: true },
    watch: {
      usePolling: true,
      interval: 200,
    },
  },
  build: {
    sourcemap: mode === 'development',
    minify: mode === 'development' ? false : 'esbuild',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        main: resolve(__dirname, 'main.html'),
        testDisplayRenderer: resolve(__dirname, 'testDisplayRenderer.html'),
        displayRendererTester: resolve(__dirname, 'tests/display-renderer/index.html'),
        cameraControllerTester: resolve(__dirname, 'tests/camera-controller/index.html'),
      },
    },
  },
}));
