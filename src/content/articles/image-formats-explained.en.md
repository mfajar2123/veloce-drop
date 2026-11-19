---
lang: en
translationKey: image-formats-explained
title: "PNG, JPEG, WebP, HEIC, SVG and ICO: when to use which"
summary: Six formats, six different purposes. Most conversion problems come from using the right tool for the wrong job.
category: conversion
toolId: image-converter
publishedAt: 2026-11-07
readingMinutes: 8
image: /images/articles/image-formats-explained.webp
imageAlt: "Grid of file type icons"
imageCredit: "Speed-Dial-2-Text-Icons by joergermeister"
imageCreditUrl: "https://www.flickr.com/photos/61928961@N00/6899657941"
imageLicense: "by 2.0"
related:
  - jpeg-vs-webp-for-web-uploads
  - heic-to-jpg-on-windows
---

Image formats are not interchangeable containers. Each was designed for a specific problem, and picking the wrong one produces the familiar symptoms: blurry text, huge files, lost transparency, or a file that will not open.

## JPEG — photographs, and only photographs

JPEG uses lossy compression based on the human visual system. It is extremely good at photographs and extremely bad at everything with sharp edges.

**Use for:** photos, product shots, anything continuous-tone.
**Avoid for:** text, screenshots, logos, line art, anything with transparency.
**Typical size:** small for photos.

The classic mistake is screenshotting code, saving as JPEG, and wondering why the text is fuzzy. JPEG's block-based compression spends its precision on gradients and destroys high-contrast edges — exactly the opposite of what text needs.

## PNG — lossless, with transparency

PNG stores every pixel exactly, optionally with an alpha channel. Compression is lossless: the file is smaller than raw data, but no information is discarded.

**Use for:** screenshots, logos, icons, diagrams, anything with transparency, images that will be edited again.
**Avoid for:** large photographs, where it produces enormous files.
**Typical size:** large for photos, small and sharp for graphics.

A 4000 × 3000 photograph as PNG can exceed 20 MB. The same photo as JPEG is around 2 MB. For graphics with flat areas, PNG is often smaller *and* sharper.

## WebP — the modern default for the web

WebP does both lossy and lossless compression, supports transparency, and generally beats JPEG by 25–35% at matched visual quality.

**Use for:** website images, anything where size matters and the destination is a browser.
**Avoid for:** systems that only accept JPEG — older upload portals, some desktop software.
**Typical size:** smallest of the three for equivalent quality.

Browser support is universal in current versions. The constraint is not browsers, it is legacy software.

## HEIC — what iPhones produce

HEIC uses HEVC compression inside a container that can hold stills, Live Photo sequences, and depth data. It is roughly half the size of an equivalent JPEG.

**Use for:** nothing by choice — it is what the camera produced.
**Avoid for:** sharing with non-Apple systems, uploading to web forms.
**Typical size:** very small for the quality.

The problem is compatibility, not quality. Convert to JPEG for maximum reach, WebP for efficiency.

## SVG — vector, not raster

SVG is not an image in the pixel sense. It is a set of instructions: draw a circle here, a path there. It scales to any resolution without loss because there are no pixels until it is rendered.

**Use for:** logos, icons, illustrations, anything that must scale.
**Avoid for:** photographs. An SVG of a photo is usually a wrapper around an embedded raster image, gaining nothing.
**Typical size:** tiny for simple shapes.

SVG can contain scripts, external references, and embedded HTML, which makes it a security concern. Sanitization before rasterizing is not optional — a malicious SVG can execute script in some contexts. Doculven rejects SVG files containing scripts or external resources rather than trying to strip them.

## ICO — Windows icons

ICO is a container holding multiple resolutions of one icon, so Windows can pick the right size for the taskbar, the desktop, or a file listing.

**Use for:** Windows application icons, favicons in some contexts.
**Avoid for:** anything else.
**Typical size:** small, since icons are small by nature.

A correct ICO contains several frames — commonly 16, 32, 48, 64, 128, and 256 pixels. A single-resolution ICO looks wrong at some sizes.

## A decision table

| Content | Format | Why |
| --- | --- | --- |
| Photograph for the web | WebP, fallback JPEG | Smallest at good quality |
| Photograph for print | JPEG at high quality, or TIFF | Compatibility, quality |
| Screenshot with text | PNG | Sharp edges, lossless |
| Logo with transparency | SVG or PNG | Scaling, alpha |
| Phone photo to share | JPEG | Universal |
| Windows icon | ICO | Multi-resolution container |
| Web icon | PNG or SVG | Browser support |

## Conversion is not free

Every lossy-to-lossy conversion loses quality. JPEG → WebP → JPEG compounds artifacts at each step. Always convert from the original source when possible, and keep the original.

Converting JPEG to PNG does not restore quality — it just stops further loss. The file gets larger and no sharper.

That distinction catches people out constantly: converting a compressed photo to a "better" format cannot undo the compression that already happened.
