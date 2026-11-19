---
lang: en
translationKey: passport-photo-sizes-explained
title: Passport and visa photo sizes, in pixels and millimetres
summary: A practical reference for 2×3, 3×4, 4×6 cm, 2×2 inch, and UK/EU 35×45 mm photos, plus what these presets cannot check for you.
category: resize
toolId: resize-image
publishedAt: 2026-11-15
readingMinutes: 9
image: /images/articles/passport-photo-sizes-explained.webp
imageAlt: "Black and white portrait against a plain background"
imageCredit: "Portrait practice session by James Willamor"
imageCreditUrl: "https://www.flickr.com/photos/81464596@N00/5367086798"
imageLicense: "by-sa 2.0"
related:
  - print-photo-sheet-layouts
  - heic-to-jpg-on-windows
---

Photo size requirements vary by country and by the authority requesting them. This guide gives the common dimensions and their pixel equivalents at 300 DPI, which is the resolution most print and upload systems assume. It does not replace the official guidance from the authority you are applying to.

## The pixel maths first

Print sizes are physical. Digital files are pixels. The bridge between them is DPI — dots per inch.

At **300 DPI**, one inch is 300 pixels, so one millimetre is about 11.81 pixels. This is the conversion used below. At 600 DPI the same physical size contains four times the pixels; at 150 DPI, a quarter.

For upload systems, the pixel dimensions usually matter more than the physical size, because a screen has no millimetres. If a form says "minimum 600 × 600 pixels", give it pixels.

## Common sizes at 300 DPI

| Size | Physical | Pixels at 300 DPI |
| --- | --- | --- |
| 2 × 3 cm | 20 × 30 mm | 236 × 354 |
| 3 × 4 cm | 30 × 40 mm | 354 × 472 |
| 4 × 6 cm | 40 × 60 mm | 472 × 709 |
| 2 × 2 inch (US passport) | 51 × 51 mm | 600 × 600 |
| 35 × 45 mm (UK, EU, Schengen) | 35 × 45 mm | 413 × 531 |
| 4R print | 4 × 6 inch | 1200 × 1800 |
| A4 | 210 × 297 mm | 2480 × 3508 |

The 35 × 45 mm size is worth calling out separately. It is the standard for UK passports, most EU and Schengen visa applications, and many other national documents. It is *not* the same as 3 × 4 cm, even though the numbers look similar, and submitting the wrong one is a common cause of rejection.

## What a preset can and cannot do

A size preset sets two things: the aspect ratio and the output pixel dimensions. That is genuinely useful, and it is also the limit of what any tool can automate.

These are **not** checked by a preset:

- **Background colour.** Many authorities require plain white, some accept light grey, some require specific tones. You must supply a photo that already has the right background or remove it deliberately.
- **Head size and position.** Rules often specify that the head must occupy a percentage of the frame height, with defined space above. A crop preset does not detect faces and cannot centre your head for you.
- **Expression and pose.** Neutral expression, mouth closed, eyes open, looking straight ahead.
- **Glasses, head coverings, and exceptions.** Rules differ and often have religious or medical exemptions.
- **Print quality.** A photo upscaled from a small source looks soft when printed, even if the pixel dimensions are correct.
- **Recency.** Most applications require a photo taken within the last six months.

A tool that claims to "guarantee" compliance is overstating. Read the receiving authority's guidance, then use the tool to hit the dimensions.

## Cropping without distorting

The most common mistake is resizing without preserving the aspect ratio, which stretches the face. Always crop to the target ratio first, then scale.

In practice:

1. Choose the preset for your target size.
2. Set the fit mode to **fill and crop** rather than contain, so the frame is completely covered.
3. Position the crop so the head sits in the upper-middle of the frame with space above.
4. Keep the aspect ratio locked if you adjust dimensions manually.
5. Export as PNG if you will print, or JPEG if an upload form requires it.

## Printing at the correct size

A PDF or image is only correct on paper if the printer does not rescale it.

- Print at **100%** or "actual size", never "fit to page".
- Check the printer driver's scaling setting — many default to shrinking to fit margins.
- Verify with a ruler after the first print. A 35 mm photo measuring 33 mm means something rescaled it.
- Use a print sheet layout with cut marks so you can trim accurately.

## Submitting digitally

For uploads, read the form's rules carefully. They typically specify:

- accepted formats (often JPEG only),
- minimum and maximum pixel dimensions,
- maximum file size in KB or MB,
- sometimes a maximum file size after their own compression.

If the form rejects your file, check each of those four before changing anything else. Compressing further will not fix a dimension rule.
