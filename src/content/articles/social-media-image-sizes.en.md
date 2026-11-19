---
lang: en
translationKey: social-media-image-sizes
title: Social media image sizes that still look right after upload
summary: Every platform re-crops and re-compresses your image. Preparing for the right aspect ratio is the only part you control.
category: resize
toolId: resize-image
publishedAt: 2026-11-06
readingMinutes: 6
related:
  - passport-photo-sizes-explained
  - compress-image-without-losing-quality
---

Uploading an image to a social platform feels like the end of the process. It is not. The platform re-encodes it, often re-crops it, and displays it at a size you did not choose. Understanding that pipeline explains why a photo that looks sharp on your phone looks soft in the feed.

## The re-compression is unavoidable

Every major platform re-encodes uploaded images to control storage and delivery cost. A 3 MB original becomes a few hundred kilobytes. There is no setting to prevent this.

The practical consequence: uploading a massive file to "preserve quality" does not work. The platform will compress it anyway. What you can control is the **starting quality and the aspect ratio**.

Uploading an image that is already sharp at the display size, and already compressed sensibly, produces a better result than uploading a giant file the platform then crushes.

## Aspect ratios, not pixel counts

The ratio is what matters most, because a mismatch causes cropping.

| Placement | Ratio | Notes |
| --- | --- | --- |
| Instagram feed (square) | 1:1 | Crops landscape and portrait |
| Instagram feed (portrait) | 4:5 | Maximum vertical space in feed |
| Instagram Story / Reels | 9:16 | Full screen, vertical |
| Instagram profile | 1:1 | Displayed as a circle |
| YouTube thumbnail | 16:9 | Text near edges may be cut |
| YouTube banner | 16:9 | Safe area is much smaller than the canvas |
| Facebook cover | ~2.7:1 | Varies between desktop and mobile |

If your image is 4:5 and the slot is 1:1, the platform crops the top and bottom. Anything important near those edges disappears.

## The safe area is smaller than the canvas

This catches people constantly on YouTube banners, Facebook covers, and Instagram stories.

The upload canvas is large. The *visible* area across all devices is a subset of it. A YouTube banner uploaded at 2560 × 1440 is only guaranteed to show a central region of roughly 1546 × 423 pixels on some screens. Text placed near the edges vanishes on phones.

VeloceDrop's YouTube banner preset draws the safe area as a guide, scaled from the published region, so you can see what will actually remain visible.

## Choosing the export size

Bigger is not better, but too small is worse.

For a 4:5 Instagram post, exporting at 1080 × 1350 is the standard recommendation. Going larger gains nothing because the platform downsamples; going smaller means upscaling and visible softness.

Same pattern per platform: match the recommended export size, not the maximum your camera produced.

## Cropping deliberately

When the target ratio differs from the source, you have two options:

1. **Crop** — fill the frame, lose edges.
2. **Pad** — keep everything, add empty space.

For portraits, cropping usually looks better. For text or graphics, padding is safer because nothing important is lost, but be aware that a padded image on a platform with a different background colour shows visible bars.

The crop position matters too. A centred crop works for symmetrical subjects; a subject standing off-centre needs the crop shifted. Tools that let you drag the crop area and preview the result solve this in seconds.

## What to check before uploading

- **Ratio matches the slot.** Crop deliberately rather than letting the platform decide.
- **Important content is inside the safe area.** Especially for banners.
- **The file is decently compressed.** A 500 KB file uploads faster and gets treated no differently.
- **Text is large enough.** Anything below roughly 24 px at display size is unreadable on a phone.

## The one thing you cannot control

Platforms change their specifications without notice, apply different crops on different devices, and sometimes serve a different image to different users. Preparing a sensible file at the recommended ratio is the extent of your control; there is no configuration that guarantees identical output everywhere.
