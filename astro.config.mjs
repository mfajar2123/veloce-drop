import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const publicBasePath = process.env.PUBLIC_BASE_PATH || '/';
const siteUrl = process.env.PUBLIC_SITE_URL || 'https://doculven.example';

export default defineConfig({
  site: siteUrl,
  base: publicBasePath,
  trailingSlash: 'always',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        "img-src 'self' blob: data:",
        "media-src 'self' blob:",
        "font-src 'self' data:",
        "connect-src 'self' blob: data:",
        "worker-src 'self' blob:",
      ],
      scriptDirective: {
        // The HEIC/HEIF decoder is Emscripten-based libheif WASM and evaluates
        // generated code at runtime, so it needs 'unsafe-eval'. The site has no
        // user-controlled markup or HTML injection path that would make that
        // escalation exploitable, and every page ships only local bundles.
        resources: ["'self'", "'wasm-unsafe-eval'", "'unsafe-eval'"],
      },
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
      },
    },
  },
});
