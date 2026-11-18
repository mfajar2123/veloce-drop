# VeloceDrop

VeloceDrop is a bilingual static site with 10 image and document tools processed in the browser. It has one Indonesian and one English route per tool, with relevant formats and size presets grouped inside shared workspaces. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for current scope, verification, and hosting.

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

Deploy targets are Netlify (primary) and GitHub Pages. Both are static; nothing here needs a server runtime.

### Netlify

`netlify.toml` holds the build command (`pnpm build`), the `dist` publish directory, the `/` to `/id/` redirect, and long-lived caching for hashed assets. Netlify also applies `dist/_headers`, so the CSP, framing, and referrer policies are enforced as real response headers there.

Set `PUBLIC_SITE_URL` in the Netlify environment to the final HTTPS origin, for example `https://velocedrop.netlify.app` or a custom domain. Without it, canonical and sitemap URLs fall back to `https://velocedrop.example`, which `scripts/verify-pages-output.mjs` rejects on purpose.

The CSP is hash-based. `pnpm build` emits per-page hashes through Astro's `security.csp`, then `postbuild` merges them into `dist/_headers` with `scripts/generate-headers.mjs`. Rebuild rather than editing `dist` by hand, or the header policy will not match the shipped scripts. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### GitHub Pages

For GitHub Pages, set the repository's Pages publishing source to **GitHub Actions**. `.github/workflows/pages.yml` builds and deploys the static site on pushes to `main` or `master`; `actions/configure-pages` supplies the site URL and repository base path. The build rewrites route and public-asset references so images, the favicon, PDF.js files, and the locally loaded portrait model continue to resolve for both root and project sites. `scripts/verify-pages-output.mjs` checks every local HTML `src` and `href`, the generated URLs, and required assets before the workflow uploads the artifact.

GitHub Pages does not apply the `public/_headers` file as response headers. This means the deployed CSP, framing, and referrer policies are not enforced there; a proxy/CDN or a different host is required for that. The static HTML build does not prove deployed response-header behavior. [GitHub Pages discussion](https://github.com/orgs/community/discussions/54257)

For another static host, set `PUBLIC_SITE_URL` to the site's final HTTPS origin and `PUBLIC_BASE_PATH` to its path prefix (or `/` at the domain root). Without a production URL, canonical and sitemap URLs use `https://velocedrop.example`; that placeholder must not be published. Configure the host to serve `public/_headers` as response headers. Static redirects and security-header behavior should be verified on the chosen provider.

The deployment must include `public/models/modnet.onnx` and `public/ort/ort-wasm-simd-threaded.wasm` at their existing paths. The portrait tool requests these public assets from the same origin only after the user presses its model-loading button; together they are 40,737,492 bytes. Users' files are processed in the browser and are not intentionally uploaded. See [docs/PRIVACY.md](docs/PRIVACY.md) for the implementation limits and [ASSET_CREDITS.md](ASSET_CREDITS.md) for asset provenance and licenses.

Example contact details are centralized in `src/site-config.ts` and deliberately inactive. Ads are disabled there with no publisher ID; do not set them up until a real provider, consent policy, and network/privacy disclosures are configured.

The `protobufjs` installation script is explicitly denied in `pnpm-workspace.yaml`; it checks dependent version notation and is not required for inference.

Before publication, replace the inactive sample contact, set `PUBLIC_SITE_URL`, and verify the deployed headers, dependency licenses, and real-domain output. The Pages workflow is configured but has not run because this local checkout has no GitHub remote. Netlify has not been connected to this checkout yet either, so neither host has a verified public URL.

`pnpm assets:og` regenerates `public/images/og-share.png` from `public/images/og-share.svg`. Social platforms do not render SVG link previews, so the PNG is what `og:image` and `twitter:image` point at.
