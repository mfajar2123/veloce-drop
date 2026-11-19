# Architecture

## Pages and routing

Astro builds a static site with Indonesian and English routes. `src/tool-registry.ts` defines the 10 bilingual tools, their categories, engines, SEO copy, FAQs, and next steps. The registry generates the catalog, tool routes, language alternates, and sitemap entries. Format and size variants are selected inside shared converter and resize workspaces. `ToolReference.astro` renders localized guidance on tool pages. `src/info-pages.ts` contains the bilingual About, Help, Contact, and Terms content; `site-config.ts` is the source for sample contact details and the default-disabled advertising slot. `/` redirects to `/id/`; `/404.html`, `/robots.txt`, and `/sitemap.xml` are generated at build time.

Astro renders page content and layout to HTML. React islands provide interactive workspaces; the layout is not hydrated as one React application. Catalog and landing searches use client-side scripts. Internal client navigation is enabled by Astro's router, and components reinitialize on Astro navigation events.

The landing page contains five sections. Its before/after sample uses locally served WebP files encoded from the same synthetic 1536 × 1024 image; displayed byte sizes are the actual derivative sizes. “Coba foto contoh” navigates with a fixed `example=workspace` flag; the compression tool fetches that known same-origin public image and creates a local file object, without putting bytes in the URL or session tray. The landing page omits Astro's client router because it does not need session handoffs, while tool routes keep the router for cross-tool state. Plus Jakarta Sans Variable and JetBrains Mono are self-hosted; no font CDN is used.

## File processing

Browser APIs, canvas and local libraries process input files. Pure helpers live under `src/engines`; PDF, ZIP and format-specific dependencies are loaded by the pages that use them. Background removal runs MODNet with ONNX Runtime Web in `src/workers/modnet.worker.ts`; the worker is terminated after each mask result so the model's WASM memory is released before further editing or navigation. PNG optimization runs Oxipng WASM in `src/workers/png-optimizer.worker.ts`. The HEIC decoder is dynamically imported when conversion starts. There is no application API or database.

Some image processing still decodes or runs on the main thread. Tool limits do not guarantee that every browser/device can process a file without memory pressure. A 3.2 MB lazy HEIC decoder chunk and PDF-related bundles remain in the production output; see [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) for known limits. A successful build does not establish a performance score.

## Session handoff

`src/engines/session-files.ts` retains up to five in-memory Blobs, caps the total at 50 MB, expires entries after 30 minutes, and supports one-use route handoffs. It does not persist data through localStorage or IndexedDB. `SessionTray` creates download object URLs only while needed and revokes them when entries are removed, cleared, or the component unmounts. A hard reload clears this application-held session state. Cross-tool and device-specific privacy behavior remains subject to the QA limitations in `IMPLEMENTATION_STATUS.md`.

## Build and hosting

Astro's static output is served by the selected hosting provider. `PUBLIC_SITE_URL` sets the origin used for canonical URLs, sitemap, and robots; its fallback is a reserved example domain. `public/_headers` contains security headers in syntax accepted by several static hosts, but the actual host must be configured and tested to serve them. Static redirect behavior is provider-specific; the generated root page uses immediate client and meta refresh fallbacks.

## Guides and articles

Articles are Markdown files in `src/content/articles/`, loaded through the Astro content collection defined in `src/content.config.ts`. Each file is named `<slug>.<lang>.md`, and `generateId` keeps the language suffix so an English and Indonesian version of the same article never collide in the data store.

`src/articles.ts` is the shared query layer: it strips the language suffix to build public URLs, sorts by publication date, and pairs translations through the `translationKey` field. Adding an article means adding two Markdown files with a shared `translationKey`; they appear in the index, sitemap, and translation link automatically.

The schema enforces the constraints that matter for search results: title up to 70 characters, summary between 80 and 160 characters, a category from a fixed list, and a `toolId` that must match a catalog entry so every guide links back to its workspace. The build fails on a violation rather than publishing a malformed page.

Routes: `/[lang]/articles/` is the index with client-side search, category filters, and pagination; `/[lang]/articles/[slug]/` renders the article with a table of contents generated from its `h2` headings, related-guide links, and `Article` plus `BreadcrumbList` structured data.

Article pages intentionally omit the `| VeloceDrop` title suffix. The added characters would push long headlines past the 70-character budget and cost space in search results.

`src/pages/rss.xml.ts` publishes an English feed of the most recent articles, discovered through a `<link rel="alternate">` in the document head.

Netlify is the deployment target; `netlify.toml` sets the build command, `dist` publish directory, the `/` to `/en/` redirect, and long-lived caching for hashed assets. There is no CI workflow in this repository: Netlify builds from the connected GitHub repository, so a push to `master` triggers the deploy. Do not declare `Content-Security-Policy` in `netlify.toml`: Netlify would serve it alongside the generated one and the stricter, hashless policy would block every inline script.

English is the default locale. `/` redirects to `/en/`, and `hreflang="x-default"` points at the English version of each page, so search engines treat English as the international entry point. The Indonesian site remains fully available under `/id/`.

### Content Security Policy

Astro's `security.csp` is enabled so the build emits a per-page `<meta>` policy with `sha256` hashes for the inline scripts Astro and the React islands actually ship. A meta policy cannot carry `frame-ancestors`, so that directive lives only in `public/_headers`.

`postbuild` runs `scripts/generate-headers.mjs`, which reads the hashes Astro emitted across all pages and merges them into the `script-src` of `dist/_headers`. Without that step the HTTP header policy has no hashes and blocks the site's inline scripts on any host that honours `_headers`. Two directives are deliberate exceptions:

- `'unsafe-eval'` for the HEIC/HEIF decoder. It is an Emscripten libheif build that evaluates generated code at runtime and fails to decode without it. The site has no HTML-injection path, so this does not expose a user-controlled eval sink.
- `connect-src` includes `data:` so locally generated image blobs can be read back through `fetch` without a network request.

Because the policy is hash-based, changing any inline script changes the hashes. Always rebuild through `pnpm build` rather than editing `dist` directly.

## Sharing metadata

`public/images/og-share.png` is a 1200 × 630 raster generated from `public/images/og-share.svg` by `scripts/generate-og-image.mjs`. Social platforms and messaging apps do not render SVG Open Graph images, so `og:image` and `twitter:image` point at the PNG. Regenerate it after changing the SVG.

Advertising is disabled in `site-config.ts` and has no publisher ID. Turning on a reserved slot does not integrate an ad provider or configure consent. Contact details also live in `site-config.ts` and drive the localized Contact pages. Set `PUBLIC_SITE_URL` before a real public release.
