# Public routes

The product has **10 tools** with one Indonesian and one English workspace route each. The localized tool catalog is generated from `src/tool-registry.ts`; it is the source of truth for search, related steps, route generation, language switching, and the sitemap.

| Tool | Indonesian route | English route |
| --- | --- | --- |
| Compress one image | `/id/kompres-foto/` | `/en/compress-image/` |
| Compress images in batches | `/id/kompres-foto-massal/` | `/en/kompres-foto-massal/` |
| Resize and crop, with common size presets | `/id/ukuran/ubah-ukuran-gambar/` | `/en/ukuran/resize-image/` |
| Convert image formats | `/id/konversi/gambar/` | `/en/konversi/image/` |
| Remove an image background | `/id/hapus-latar/` | `/en/hapus-latar/` |
| Add a batch logo watermark | `/id/watermark-logo-massal/` | `/en/watermark-logo-massal/` |
| Combine photos into a PDF | `/id/foto-ke-pdf/` | `/en/foto-ke-pdf/` |
| Convert PDF pages to JPG | `/id/pdf-ke-jpg/` | `/en/pdf-ke-jpg/` |
| Compress a PDF | `/id/kompres-pdf/500kb/` | `/en/kompres-pdf/500kb/` |
| Arrange a photo print sheet | `/id/cetak-foto/` | `/en/cetak-foto/` |

The image converter groups PNG, WebP, HEIC/HEIF, SVG and ICO actions in one workspace. The resize workspace includes common passport, print and social-media sizes. The PDF compressor keeps its target editable. These choices reduce duplicate landing pages without removing these options from their parent tool.

Other public pages include `/id/` and `/en/`, the tool catalogs at `/id/alat/` and `/en/tools/`, localized About, Help, Contact, Terms and Privacy pages, `/sitemap.xml`, `/robots.txt`, and `/404.html`. The root `/` redirects to `/id/` using the generated static redirect; the final HTTP status depends on host configuration.

The previous one-route-per-preset and specialist tools are no longer generated or listed. Their former paths should return the site's 404 page. See [TOOL_SELECTION.md](TOOL_SELECTION.md) for the selection criteria and [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) for current test evidence.
