---
lang: en
translationKey: compress-image-without-losing-quality
title: Compressing an image without ruining how it looks
summary: File size and visible quality trade off against each other, but not evenly. Here is how to find the point where the saving is large and the damage is not.
category: compression
toolId: compress-image
publishedAt: 2026-11-17
readingMinutes: 7
related:
  - why-200kb-targets-fail
  - jpeg-vs-webp-for-web-uploads
---

Most people compressing an image have the same unstated goal: make the file smaller without anyone noticing a difference. That goal is achievable more often than people expect, but only if you stop treating the quality slider as a single knob to drag down.

## Why the first 30% is cheap and the last 10% is expensive

Compression removes information the eye is unlikely to miss first. Smooth gradients, subtle colour shifts, and low-contrast texture are discarded at almost no perceptual cost. This is why going from quality 95 to quality 80 often halves the file with no visible change.

The last stretch is different. To go from 40% of the original size down to 30%, the encoder must start discarding structure the eye does notice: edge definition, skin tone transitions, the separation between similar colours. This is where blocky artifacts appear, and where further compression stops being free.

So the practical question is not "what quality should I use" but **"where is the knee of my particular image"**. That point differs per image, which is why a fixed rule like "always use 80" is wrong as often as it is right.

## Three signals that you have gone too far

**Blocking in flat areas.** Look at a sky, a painted wall, or a blurred background. At low quality these turn into 8×8 or 16×16 pixel squares with visible seams. Flat areas should stay flat.

**Ringing around high-contrast edges.** Text, window frames, and the boundary between a dark object and a bright background develop a halo — a faint repeating echo. This is the encoder running out of precision exactly where contrast is highest.

**Colour banding in gradients.** A sunset or a studio backdrop should transition smoothly. Compressed too far, it becomes a series of distinct bands.

The fastest test is to view the result at **100% zoom**, not fit-to-window. At fit-to-window you are looking at the image through a reduction, which hides exactly the artifacts compression creates.

## Choosing a format is a bigger lever than choosing a quality

For photographic content, WebP at a given visual quality typically produces a file 25–35% smaller than JPEG. That means you can often keep visually lossless settings *and* hit your size target, just by changing format.

For screenshots, diagrams, logos, and anything with text or sharp geometry, PNG is usually the right answer and lossy compression is the wrong tool entirely. Converting a screenshot of code to JPEG makes the text fuzzy at any quality, because the format was designed for photographs, not line art. If the file must be small, lossless PNG optimization is the correct path — it re-packs the data without discarding any.

A rough decision guide:

| Content | Best format |
| --- | --- |
| Photographs, product shots | WebP, fall back to JPEG |
| Screenshots, code, text | PNG (lossless) |
| Logos, icons, cut-outs | PNG or WebP with alpha |
| Photos needing maximum compatibility | JPEG |

## Metadata is free bytes

Every photo from a phone or camera carries metadata: camera model, exposure settings, sometimes GPS coordinates, and often a small embedded thumbnail. Re-encoding an image strips most of this automatically.

That matters twice over. It saves bytes at no visual cost, and it removes location data you may not want to publish. If you are posting a photo taken at home, the GPS tag is a privacy problem independent of file size.

## A repeatable workflow

1. **Start from the original**, not from a previously compressed copy. Compressing an already-compressed file compounds artifacts in a way that is difficult to undo.
2. **Set a target that reflects the destination.** A web gallery rarely needs more than 200–300 KB. A marketplace photo often needs under 1 MB. A print file should not be compressed at all.
3. **Let the tool search quality** rather than guessing. It encodes several levels and reports the actual result.
4. **Inspect at 100%** before accepting.
5. **Keep the original.** Compression is not reversible, and you will occasionally need to start over.

## The trade-off that is not worth making

If reaching a size target requires visible damage to a photo that is the main content of a page — a product image, a portfolio piece, a portrait — the better answer is usually to reduce dimensions or accept a larger file. Squeezing a hero image until it looks wrong saves bandwidth and costs credibility.

Size targets are constraints, not goals. The goal is an image that looks right at the size it will be displayed.
