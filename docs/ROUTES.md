# Public routes

The product has **11 tools** with one Indonesian and one English workspace route each. The localized tool catalog is generated from `src/tool-registry.ts`; it is the source of truth for search, related steps, route generation, language switching, and the sitemap.

| Tool | Indonesian route | English route |
| --- | --- | --- |
| Compress one image | `/id/kompres-foto/` | `/en/compress-image/` |
| Compress images in batches | `/id/kompres-foto-massal/` | `/en/batch-compress-images/` |
| Resize and crop, with common size presets | `/id/ukuran/ubah-ukuran-gambar/` | `/en/resize-image/` |
| Convert image formats | `/id/konversi/gambar/` | `/en/convert-image/` |
| Remove an image background | `/id/hapus-latar/` | `/en/remove-background/` |
| Add a batch logo watermark | `/id/watermark-logo-massal/` | `/en/watermark-logo/` |
| Combine photos into a PDF | `/id/foto-ke-pdf/` | `/en/photos-to-pdf/` |
| Convert PDF pages to JPG | `/id/pdf-ke-jpg/` | `/en/pdf-to-jpg/` |
| Compress a PDF | `/id/kompres-pdf/500kb/` | `/en/compress-pdf/500kb/` |
| Arrange a photo print sheet | `/id/cetak-foto/` | `/en/print-photo-sheet/` |
| Scan a document | `/id/scan-dokumen/` | `/en/scan-document/` |

The image converter groups PNG, WebP, HEIC/HEIF, SVG and ICO actions in one workspace. The resize workspace includes common passport, print and social-media sizes. The PDF compressor keeps its target editable. These choices reduce duplicate landing pages without removing these options from their parent tool.

Other public pages include `/id/` and `/en/`, the tool catalogs at `/id/alat/` and `/en/tools/`, localized About, Help, Contact, Terms and Privacy pages, `/sitemap.xml`, `/robots.txt`, and `/404.html`. The root `/` redirects to `/en/` using the generated static redirect; the final HTTP status depends on host configuration.

Netlify redirects legacy English tool slugs to the current English routes with a 301. Retired preset and specialist routes return the site's 404 page. See [TOOL_SELECTION.md](TOOL_SELECTION.md) for the selection criteria and [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) for current test evidence.
