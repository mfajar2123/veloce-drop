# Dependency license inventory

Inventory generated with `pnpm licenses list --prod --json` on 2026-11-06 and cross-checked against the earlier Windows build inventory. It covers the 245 package instances in the production dependency graph for this lockfile. Package metadata declares MIT (191), Apache-2.0 (10), BSD-3-Clause (13), BSD-2-Clause (8), ISC (11), 0BSD (1), CC0-1.0 (1), OFL-1.1 (2), `(MIT AND Zlib)` (1), BlueOak-1.0.0 (3), LGPL-3.0 (1), Apache-2.0 AND LGPL-3.0-or-later (1), and MPL-2.0 (2). Package metadata is evidence of declared terms, not proof that every upstream source file or binary has no additional notice.

The SPDX expressions were checked against the upstream license texts: [MIT](https://spdx.org/licenses/MIT.html), [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0), [BSD-2-Clause](https://spdx.org/licenses/BSD-2-Clause.html), [BSD-3-Clause](https://spdx.org/licenses/BSD-3-Clause.html), [ISC](https://spdx.org/licenses/ISC.html), [0BSD](https://spdx.org/licenses/0BSD.html), [CC0-1.0](https://spdx.org/licenses/CC0-1.0.html), [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0), [OFL-1.1](https://openfontlicense.org/open-font-license-official-text/), [LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.html), [MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/), and [Zlib](https://zlib.net/zlib_license.html). The package list and notices remain the distribution-specific evidence.

## Commercial distribution review

No package in the generated production inventory declares a non-commercial-only license, GPL, or AGPL. The MIT, Apache, BSD, ISC, 0BSD, CC0, Blue Oak, and OFL declarations permit commercial use subject to their respective terms and notices. The `pako` package carries both MIT and Zlib terms. The site does not currently configure an advertising provider, and no ad-provider code or terms are included in this audit.

The following distributions need explicit handling:

- `heic-to` 1.6.7 is LGPL-3.0 and is shipped as an on-demand browser chunk. Its license is at `/licenses/heic-to-LGPL-3.0.txt`; the build generates `/licenses/heic-to-1.6.7-source.zip` with the exact installed package license, source inputs, and package build script. A unit test compares the archive contents to the installed package. Keep the decoder replaceable and preserve both files when redistributing.
- `@img/sharp-win32-x64` 0.35.5 declares Apache-2.0 AND LGPL-3.0-or-later. It is a Windows build-graph dependency. Confirm the final platform build does not redistribute it before release; if it does, retain the notices and source/relinking materials required by the selected license terms.
- `lightningcss` 1.32.0 and 1.33.0 declare MPL-2.0. They are build-tool packages and are not intentionally included in the static site output; preserve notices if a deployment artifact later redistributes them.
- `common-ancestor-path` 2.0.0, `lru-cache` 11.5.3, and `sax` 1.6.1 declare BlueOak-1.0.0. Their license requires recipients of copied software to receive its text or a link; the package inventory and their installed package notices are retained.
- Fontsource Plus Jakarta Sans Variable and JetBrains Mono use OFL-1.1. Their notices are in the installed packages; the site imports only selected subsets.
- MODNet is Apache-2.0. Its model card, source, checksum, size, and license are recorded in [ASSET_CREDITS.md](../ASSET_CREDITS.md).

This audit closes the dependency-metadata inventory for the current lockfile, not legal review of a future deployment. Before enabling advertising, re-run the inventory after dependency changes, inspect the final platform's shipped files, and review the selected ad provider's license, terms, requests, and consent requirements. This document is a technical inventory, not legal advice.
