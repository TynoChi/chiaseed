import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        chiaseed: 'chiaseed.html',
        admin: 'admin.html',
        simulator: 'simulator.html',
        // Add more if needed
      }
    }
  }
});
