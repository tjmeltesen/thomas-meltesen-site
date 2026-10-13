import { defineConfig } from 'astro/config';

// Static output, no inline scripts or styles so the strict CSP (SRS-025) holds.
export default defineConfig({
  site: 'http://localhost:4321',
  output: 'static',
  server: { port: 4321, host: true },
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'never', assets: '_assets' },
  vite: { build: { assetsInlineLimit: 0 } },
});
