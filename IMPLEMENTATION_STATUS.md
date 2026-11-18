# Implementation status

## Active scope

The project owner narrowed the product to 10 tool types on 2026-11-10. The catalog has exactly 10 entries and publishes 20 localized tool routes. The selection rationale and ad-network constraints are recorded in [docs/TOOL_SELECTION.md](docs/TOOL_SELECTION.md); the route source of truth is [docs/ROUTES.md](docs/ROUTES.md).

| Tool | Included behavior |
| --- | --- |
| Image compression | One image, editable byte target, JPEG or WebP |
| Batch image compression | Multiple files, per-file results, ZIP export |
| Resize and crop | Custom dimensions, photo, print, and social presets |
| Image format conversion | PNG, WebP, HEIC/HEIF, SVG, ICO, lossless PNG optimization |
| Background removal | Local model, mask refinement, export |
| Logo watermark | Apply a logo to multiple photos, export ZIP |
| Photos to PDF | Arrange and export selected images |
| PDF to JPG | Select pages, export images or ZIP |
| PDF compression | Editable target, 500 KB default |
| Photo print sheet | Arrange photos on print layouts |

Dedicated routes and workspaces for other tools were removed. Their remaining implementation files are removed when they are not shared with one of these 10 tools. Relevant presets stay within their parent workspace.

## Verification

- Hardening pass on 2026-11-18, after build and test artifacts and stale documents were removed from the working tree: `pnpm build` emits 36 pages; `pnpm check` reports 0 errors, warnings, or hints across 107 files; `pnpm lint` exits 0; `pnpm test:unit` passes 21/21; `scripts/verify-pages-output.mjs` passes for 13 required paths and 34 localized metadata sets when built with a real `PUBLIC_SITE_URL`.
- Content Security Policy was previously broken on any host that served `public/_headers`: the hashless `script-src 'self'` blocked all 179 inline script tags, which disabled the catalog filters, the landing search, the mobile navigation, and every React island. Apache, Netlify and Cloudflare Pages all honour `_headers`, so the site would have been non-interactive in production even though local `astro preview` ignored the file and looked fine.
- The fix enables Astro's `security.csp`, which emits per-page `sha256` hashes, and adds `scripts/generate-headers.mjs` to `postbuild` to merge those hashes into `dist/_headers`. Verified by serving `dist` with the real header: landing search, mobile navigation, catalog filters, and a tool island all initialize with zero blocking violations.
- The policy keeps two documented exceptions. `'unsafe-eval'` is required by the Emscripten libheif HEIC decoder; without it every HEIC conversion returns "file cannot be read". `connect-src` includes `data:` so locally generated blobs can be read back through `fetch`. Both are covered by `tests/security-headers.test.mjs`.
- Playwright on the CSP build: Chromium full suite 75/75 passed, and SEO plus accessibility passed 34/34 across Firefox and WebKit. The interaction audit (both locales, every tool route) and the MODNet background-removal integration passed under the new policy.
- `og:image` and `twitter:image` pointed at an SVG, which Facebook, X, LinkedIn and WhatsApp do not render, so shared links had no preview. `scripts/generate-og-image.mjs` now renders a 1200 × 630 `public/images/og-share.png` from the SVG, and the layout and output verifier reference it.
- Netlify is the only documented deployment target, configured through `netlify.toml` and connected to the GitHub repository. The GitHub Pages workflow was removed. No `Content-Security-Policy` is declared in `netlify.toml` on purpose: a second hashless policy would be enforced alongside the generated one and re-break the site.
- Lighthouse numbers, earlier browser-suite totals, and the per-route audit reports previously recorded here are not reproduced in this pass because their source documents were removed. Treat any performance figure as unverified until it is re-measured.
- The favicon is a 96 × 96 PNG linked from the root redirect, localized home pages, and 404 page. Google Search does not promise display and does not support a distinct project icon for a URL served from a subdirectory; a custom domain or a hostname-root site is required.

## Release limits

Ad slots remain disabled and no ad-network approval or earnings are claimed. A real domain, active contact details, publisher configuration, consent handling, and production hosting checks are still needed before release. Browser print output has not been verified on physical printers. Large client-side model and PDF/image workloads depend on device memory. Netlify has not been connected yet, so no public URL and no deployed-header behaviour has been verified.
