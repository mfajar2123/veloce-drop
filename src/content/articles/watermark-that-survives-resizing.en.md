---
lang: en
translationKey: watermark-that-survives-resizing
title: Placing a logo watermark that still looks right after resizing
summary: A watermark sized in pixels breaks the moment the image is resized. Relative sizing, margins and opacity are what make it survive.
category: watermark
toolId: logo-watermark
publishedAt: 2026-11-09
readingMinutes: 5
image: /images/articles/watermark-that-survives-resizing.webp
imageAlt: "Vintage printed label with lettering and ornament"
imageCredit: "From Harpel's Typograph by Double--M"
imageCreditUrl: "https://www.flickr.com/photos/49879584@N00/4619270851"
imageLicense: "by 2.0"
related:
  - background-removal-limits
  - compress-image-without-losing-quality
---

A watermark has one job: to stay on the image, readable, without ruining it. Doing that across a batch of photos with different dimensions requires choosing the right unit of measurement.

## Size in pixels is the wrong unit

If you place a 200-pixel-wide logo on a 4000-pixel photo, it occupies 5% of the width. On a 1000-pixel thumbnail, the same 200 pixels occupy 20% — five times more visually dominant.

This is why professional watermark tools size the logo **relative to the image width**. Set 15% and it stays 15% whether the photo is 800 pixels or 8000. VeloceDrop uses relative width for exactly this reason, within a 5–50% range.

The same logic applies to position: a margin specified in pixels drifts visually as dimensions change. A margin expressed as a percentage of the shorter side stays proportional.

## Choosing the position

Five standard positions — four corners and centre — cover most needs:

- **Bottom-right** is the conventional choice. It reads as a signature without obstructing the subject in most compositions.
- **Bottom-left** works when the bottom-right is visually busy.
- **Top corners** are less common but useful when the subject sits low in the frame.
- **Centre** maximises protection and maximises visual damage. Use it only for proofs you do not want reused.

For e-commerce, a small corner mark is usually enough. Buyers find a large centred watermark intrusive, and it can trigger marketplace rules about overlaying product images.

## Opacity: visible but not distracting

Full opacity looks like a sticker pasted on. Very low opacity disappears after one recompression.

A practical range is **40–70%** for a light-coloured background and **60–85%** for a dark one. Test on one image at the actual display size before applying to the batch.

Remember that JPEG compression at low quality can blot out a faint watermark entirely. If the image will be compressed afterwards, err on the side of higher opacity.

## Logo preparation

The source logo matters as much as the settings:

- **Use PNG with transparency.** A logo on a white rectangle creates a visible box.
- **Use a high-contrast version.** A logo that nearly matches the photo's tone will vanish at moderate opacity.
- **Keep it simple.** Fine details in a small mark become mush after resizing and compression.
- **Mind the aspect ratio.** The tool scales by width; a very tall logo may become too small to read.

A common mistake is exporting a logo at 4000 pixels and letting the tool scale it down. Better to provide it near the size it will actually be used, so that downscaling artifacts do not compound.

## What a watermark does and does not do

It is honest to be clear about this: a visible watermark is a deterrent, not protection. It can be cropped, painted over, or removed with varying degrees of effort. Anyone determined enough will remove it.

What it does well:

- Discourages casual reuse of preview images.
- Establishes provenance when an image is shared without attribution.
- Signals "this is a proof" for client review.

What it does not do:

- Prevent theft.
- Survive a determined edit.
- Replace proper licensing or a visible copyright notice.

VeloceDrop's own documentation makes this point rather than overselling the feature.

## Batch workflow

1. **Test on one image first.** Position, size, and opacity interact with the content.
2. **Apply to the batch** and review the first three results.
3. **Watch for edge cases** — images where the chosen corner is occupied by the subject.
4. **Export as PNG** if you need transparency preserved, or JPEG for smaller files.

The tool reports each file's result individually, so a single failure does not block the rest of the batch.
