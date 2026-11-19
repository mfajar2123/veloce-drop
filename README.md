# Doculven

Doculven is a bilingual static site with 11 image and document tools processed in the browser, including a camera document scanner. It has one Indonesian and one English route per tool, with relevant formats and size presets grouped inside shared workspaces. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for current scope, verification, and hosting.

## Development

Requires Node.js 22.13 or newer and pnpm.

```sh
pnpm install
pnpm dev
pnpm lint
pnpm check
pnpm test:unit
pnpm build
pnpm performance:landing
pnpm preview
pnpm test:e2e
```

`pnpm performance:landing` runs after `pnpm build` and totals the gzip size of the JavaScript referenced by the Indonesian landing page, enforcing the 100,000-byte budget. It is an asset budget check, not a Lighthouse or field Core Web Vitals audit.

The build's `prebuild` step regenerates the LGPL source archive for the locked `heic-to` decoder at `public/licenses/heic-to-1.6.7-source.zip`. `pnpm test:unit` checks that archive against the installed package and checks the source privacy boundaries and static-host header policy. See [docs/DEPENDENCY_LICENSES.md](docs/DEPENDENCY_LICENSES.md) for the package inventory and redistribution conditions.

`pnpm assets:prepare` re-encodes the checked-in synthetic landing sources into local WebP assets using the installed Playwright Chromium browser. The public site self-hosts Plus Jakarta Sans and JetBrains Mono; font and image provenance is recorded in [ASSET_CREDITS.md](ASSET_CREDITS.md).

Install the Playwright browsers before running browser tests: `pnpm exec playwright install`. The full local-model integration run is `pnpm exec playwright test tests/background.spec.ts --workers=1` and takes longer than the other suites.

## Static deployment

Netlify is the deployment target. The site is static; nothing here needs a server runtime.

`netlify.toml` holds the build command (`pnpm build`), the `dist` publish directory, the `/` to `/en/` redirect, and long-lived caching for hashed assets. The build writes one `Permissions-Policy` per HTML route and allows camera access only on the two scanner pages. Netlify applies these policies and the CSP, framing, and referrer policies from `dist/_headers`.

Set `PUBLIC_SITE_URL` in the Netlify environment to the final HTTPS origin, for example `https://doculven.netlify.app` or a custom domain. Without it, canonical and sitemap URLs fall back to `https://doculven.example`, which `scripts/verify-pages-output.mjs` rejects on purpose.

The CSP is hash-based. `pnpm build` emits per-page hashes through Astro's `security.csp`, then `postbuild` merges them into `dist/_headers` with `scripts/generate-headers.mjs`. Rebuild rather than editing `dist` by hand, or the header policy will not match the shipped scripts. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

If the site is ever served under a path prefix instead of a domain root, set `PUBLIC_BASE_PATH` to that prefix. At the domain root the default `/` needs no rewriting.

The deployment must include `public/models/modnet.onnx` and `public/ort/ort-wasm-simd-threaded.wasm` at their existing paths. The portrait tool loads these public assets from the same origin automatically when the tool page opens, then keeps them resident for further photos; together they are 40,737,492 bytes. Users' files are processed in the browser and are not intentionally uploaded. See [docs/PRIVACY.md](docs/PRIVACY.md) for the implementation limits and [ASSET_CREDITS.md](ASSET_CREDITS.md) for asset provenance and licenses.

Contact details live in `src/site-config.ts` and are used by the localized Contact pages, which link to `mailto:` and offer a copy button. Ads are disabled there with no publisher ID; do not set them up until a real provider, consent policy, and network/privacy disclosures are configured.

The `protobufjs` installation script is explicitly denied in `pnpm-workspace.yaml`; it checks dependent version notation and is not required for inference.

Before publication, set `PUBLIC_SITE_URL` and verify the deployed headers, dependency licenses, and real-domain output. Netlify has not been connected to this checkout yet, so no public URL and no deployed-header behaviour has been verified.

`pnpm assets:og` regenerates `public/images/og-share.png` from `public/images/og-share.svg`. Social platforms do not render SVG link previews, so the PNG is what `og:image` and `twitter:image` point at.
