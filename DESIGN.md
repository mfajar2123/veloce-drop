# Design direction

VeloceDrop uses a calm editorial studio for everyday image and document work. The audience needs to trust a file workflow before exploring its controls, so the primary surface is light, the headline is direct, and deep emerald marks actions and the product identity. Mint is reserved for the privacy story; amber is reserved for actual downloads. Measurements use tabular numerals.

Design dials: **ENERGY 2 / RHYTHM 3 / MOTION 1**. The landing sequence alternates a centered image demonstration, a compact tool index, a selectable editorial use case, a two-column privacy explanation, and one quiet closing action. Tool pages remain workspace-first. Motion communicates selection, comparison, or hover only; it does not loop. The recurring identity gesture is a precise vertical comparison line over a real, labeled sample image.

The shadcn Base UI button primitive is used for the sample handoff action. Its semantic primary token maps to Deep Vault Emerald, its focus ring maps to the existing blue focus color, and its default target is 44 px. The rest of the app keeps native controls and its established workspace styling.

Color tokens: Alabaster Mist `#F8FAFC`, white surface `#FFFFFF`, Deep Vault Emerald `#065F46`, Electric Mint `#10B981`, Warm Amber `#F59E0B`, Obsidian Slate `#0F172A`, Slate Border `#E2E8F0`, and Soft Slate `#F1F5F9`. Inputs have a 6 px radius, workspace panels 10 px, and emphasis relies on whitespace and borders rather than broad shadows. Plus Jakarta Sans Variable is used for interface and headings; JetBrains Mono is limited to measurements and byte counts. Both are self-hosted. Focus indicators are visible, controls have 44 px minimum interaction height, images declare intrinsic dimensions, and reduced-motion preferences are respected.

The landing photos are synthetic illustrations, not customers or endorsements. Its before/after comparison uses two browser-encoded WebP files with the same 1536 × 1024 pixels; displayed bytes come from the actual served derivatives. Selecting the sample places a public fixture in the in-memory workflow store so users can inspect the compression tool without opening a file picker. See `ASSET_CREDITS.md` for provenance and licenses.

The landing catalog begins with six frequent workflows so a first visit remains scannable; a clearly labeled, stateful control reveals the other four without making users guess a search term. The social use case uses the existing sample photo inside a 9:16 crop frame so the visual explains the destination preset rather than repeating a generic illustration.
