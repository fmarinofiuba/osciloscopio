import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        displayRendererTester: resolve(__dirname, 'tests/display-renderer/index.html'),
        cameraControllerTester: resolve(__dirname, 'tests/camera-controller/index.html'),
      },
    },
  },
});
