---
lang: en
translationKey: photos-to-pdf-page-order
title: "Photos to PDF: getting page order, size and margins right first time"
summary: Most bad photo PDFs fail on three things — wrong order, wrong paper size, and images that do not fill the page. All three are preventable.
category: documents
toolId: photo-pdf
publishedAt: 2026-11-12
readingMinutes: 6
image: /images/articles/photos-to-pdf-page-order.webp
imageAlt: "A stack of paper sheets seen from the side"
imageCredit: "Stack of Papers by jenni from the block"
imageCreditUrl: "https://www.flickr.com/photos/27624680@N02/7827785878"
imageLicense: "by 2.0"
related:
  - pdf-compression-and-lost-text
  - passport-photo-sizes-explained
---

Turning photos into a PDF is one of the most common document tasks and one of the most frequently botched. The recurring failures are predictable, which means they are avoidable.

## Failure one: pages in the wrong order

File pickers sort alphabetically by default. If your photos are named `IMG_2841.jpg`, `IMG_2842.jpg`, and `IMG_2843.jpg`, alphabetical order happens to match capture order — usually.

The moment names differ in length, alphabetisation breaks. `IMG_999.jpg` sorts before `IMG_1000.jpg` because `9` comes after `1` lexicographically only in the first character position; a shorter run of digits sorts first. Rename with zero padding, or reorder in the tool before generating.

Most photo-to-PDF tools let you reorder the queue. Use it. Checking the preview page count and sequence takes seconds; discovering the mistake after submission costs a day.

## Failure two: wrong paper size

Paper size affects how the image is placed on the page, not the image itself.

- **A4** — 210 × 297 mm. Standard almost everywhere except North America.
- **Letter** — 216 × 279 mm. Standard in the US and Canada.
- **F4 / Folio** — 215 × 330 mm. Common in Indonesia and parts of Southeast Asia for legal and administrative documents.
- **Follow the image** — the page takes the image's aspect ratio exactly.

Sending an A4 document to a US recipient, or a Letter document to an Indonesian institution, is a small error with disproportionate consequences. Many portals specify the required size.

## Failure three: images that do not fill the page

An image with a different aspect ratio than the paper has to be handled one of three ways:

1. **Fit inside** — the whole image is visible, with blank margins on two sides.
2. **Fill and crop** — the image covers the page, losing edges.
3. **Stretch** — the image distorts. Never do this for photographs.

For documents like ID cards or certificates, "fit inside" is usually correct, because losing content is worse than a margin. For photographs intended to be full-page, "fill and crop" looks intentional while "fit inside" looks like a mistake.

## Margins and print safety

Printers cannot print to the physical edge of the paper. Most leave a border of 3–10 mm. Content placed inside that border may be clipped.

If the PDF will be printed, keep a margin of at least 10 mm, or use the layout's built-in safe area. If it will only be viewed on screen, margins still improve readability.

## A sequence that avoids all three

1. **Sort the files before selecting them.** Rename with zero-padded numbers if order matters.
2. **Confirm the paper size** required by the recipient. If unspecified, A4 is the safest international default.
3. **Choose the fit behaviour** based on whether cropping or margins are more acceptable.
4. **Check the preview pages** — count and order — before generating.
5. **Open the generated PDF** and scroll through it. A generated file that opens correctly is the only proof that matters.

## Size, afterwards

A PDF made from 20 phone photos can easily reach 30–40 MB. If that exceeds a limit, the compression step changes the nature of the document: rasterizing will remove any selectable text and re-encode the images at lower quality.

For a photo-only PDF there is no text to lose, so rasterizing is far less damaging than it would be for a contract. The trade-off is image sharpness, controlled by the DPI setting.

## What the tool reports

VeloceDrop shows the page count and paper dimensions before export, and the resulting PDF embeds images at their native resolution where possible. It does not verify that your document meets an institution's requirements — that remains your check to make.
