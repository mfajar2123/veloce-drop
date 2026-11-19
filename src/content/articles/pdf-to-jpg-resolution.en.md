---
lang: en
translationKey: pdf-to-jpg-resolution
title: Choosing the right resolution when converting PDF pages to JPG
summary: 72, 144 or 200 DPI decides whether the output is readable, printable, or unusably large. The choice depends on one question.
category: documents
toolId: pdf-jpg
publishedAt: 2026-11-04
readingMinutes: 5
related:
  - pdf-compression-and-lost-text
  - photos-to-pdf-page-order
---

Converting a PDF page to an image requires a resolution setting, and most people pick one without knowing what it changes. It changes two things that trade off directly against each other: how readable the text is, and how large the file becomes.

## What DPI means here

DPI is dots per inch. In this context it means: how many pixels represent one inch of the original page.

A4 is 210 × 297 mm, which is about 8.27 × 11.69 inches. At:

- **72 DPI** → 595 × 842 pixels
- **144 DPI** → 1191 × 1684 pixels
- **200 DPI** → 1654 × 2339 pixels

Each step roughly doubles the pixel count in each direction, which means roughly four times the pixels and file size.

## The three practical choices

**72 DPI — for previews and minimum size.**

Text is soft. Small type is hard to read, and thin lines often break up. This setting is right when the image will only be glanced at, or when a strict file size limit forces it.

**144 DPI — the general-purpose answer.**

Text is sharp on screen and acceptable when printed at the original page size. This is the setting to choose when you do not know the intended use. It is a reasonable default for documents that will be emailed or uploaded.

**200 DPI — when it will be printed or OCR'd.**

Sharp text, but large files. A 10-page document at 200 DPI can easily produce 15 MB of JPEGs. Choose it when the output will be printed, or when the image will be run through text recognition.

## Why higher is not always better

Beyond about 300 DPI, you are capturing detail that was already at the limit of the original PDF's resolution. The file grows and the visual result does not improve. For a PDF built from a 150 DPI scan, exporting at 200 DPI gains almost nothing over 150.

The other ceiling is memory. A very large page at high DPI can exceed a comfortable pixel budget, which is why tools impose a maximum per-page pixel count rather than letting a 200 DPI conversion of an oversized page exhaust the tab.

## What is lost regardless of resolution

Converting a PDF page to JPG produces a picture of a page. That means:

- **Text is no longer text.** No selecting, no searching, no copying.
- **Links do not work.** A hyperlink in the PDF becomes a picture of a hyperlink.
- **Annotations are not included.** Comments and form fields are not rendered as interactive elements.
- **Vector content is rasterized.** Lines, diagrams, and text become pixels, so zooming in reveals softness instead of sharp edges.

If any of those matter, converting to an image is the wrong operation. Extract the text with a text extraction tool, or keep the document as PDF.

## Choosing pages

Most conversions only need some pages. A 40-page report where you need pages 3 and 7 should not produce 40 images.

Page selection usually accepts a list and ranges: `1,3-5,8` means page 1, pages 3 through 5, and page 8. Typing it once is faster than extractions repeated per page.

## Quality versus size, after the fact

JPG quality and DPI are separate controls. DPI decides how many pixels; quality decides how aggressively those pixels are compressed. Lowering quality saves size without reducing dimensions, but it introduces block artifacts around text — visible as rectangular halos around letters.

For document images, keep quality high (90 or above) and control size with DPI instead. Text responds badly to aggressive JPEG compression because text is made entirely of sharp high-contrast edges.

## A practical checklist

1. **Ask what the image is for.** Screen reading, printing, or text recognition.
2. **Pick DPI accordingly.** 72, 144, or 200.
3. **Select only the pages you need.**
4. **Check one page** before converting the rest.
5. **Accept that the text is now a picture** — if that is not acceptable, stop and use a different approach.
