---
lang: en
translationKey: pdf-compression-and-lost-text
title: Compressing a PDF usually destroys its text. Know before you do it
summary: Most quick PDF compressors, including this one, rasterize pages. That means the text stops being text — no selecting, no searching, no copy-paste.
category: documents
toolId: pdf-500kb
publishedAt: 2026-11-14
readingMinutes: 7
image: /images/articles/pdf-compression-and-lost-text.webp
imageAlt: "Stacked black and white newspapers showing printed text"
imageCredit: "Newspapers B&W (5) by NS Newsflash"
imageCreditUrl: "https://www.flickr.com/photos/62693815@N03/6277209256"
imageLicense: "by 2.0"
related:
  - photos-to-pdf-page-order
  - passport-photo-sizes-explained
---

You compressed a PDF to fit an upload limit, and now the recipient cannot select or search the text. Nothing malfunctioned. This is the expected behaviour of the most common compression method, and it matters before you press the button, not after.

## Two completely different kinds of PDF

**Text-based PDFs** store characters, font references, and positioning instructions. A 40-page contract can be under 200 KB because it is mostly instructions, not pictures. You can select text, search it, and copy it. Screen readers can read it.

**Scanned PDFs** are photographs of pages wrapped in a PDF container. Every page is one big image. A 40-page scan is easily 20 MB, and the text is not text at all.

Most real documents are a mix: text with embedded images, logos, and sometimes scanned pages inside.

## What "compress" does to each

There are two compression strategies, and they behave very differently.

**Lossless structural compression** removes redundancy inside the PDF — duplicate font subsets, unused objects, inefficient streams. Text stays text. The savings are real but modest, typically 5–25%. Nothing visible changes.

**Rasterization** renders each page to an image at a chosen resolution, then re-encodes those images as JPEG at a chosen quality. This is what most "compress PDF to X KB" tools do, and it is why they can hit aggressive targets.

Rasterization has consequences that are permanent:

- Text is no longer text. No selecting, no searching, no copying.
- Links, form fields, and annotations disappear.
- A screen reader sees images with no alternative text.
- Quality depends on the DPI you chose. Text at 72 DPI is noticeably soft.
- File size depends on page count, since each page becomes a separate image.

Doculven uses rasterization and says so on the tool page. That is why the FAQ entry explains the trade-off rather than hiding it.

## Choosing a resolution

If you must rasterize, DPI decides the quality/size balance:

| DPI | Looks like | Good for |
| --- | --- | --- |
| 72 | Soft text, visible blur on small print | Minimum-size email attachments |
| 96 | Readable on screen, soft when printed | Screen-only reading |
| 144 | Sharp on screen, acceptable in print | General purpose |
| 200+ | Sharp, but large files | Documents that may be printed |

Higher DPI means more pixels per page, which means a larger file. If your target is small and your page count is high, you will be forced downward whether you like it or not.

## What to do instead, when the text matters

If the document must remain searchable, accessible, or editable, do not rasterize it. Options, in order of preference:

1. **Print to PDF again** from the source application with "compress images" enabled — many applications can downsample embedded images while keeping text intact.
2. **Reduce only the images** inside the PDF, keeping the text layer.
3. **Split the document** into smaller parts if the limit is per-file.
4. **Ask whether the limit is real.** Some portals state a limit but accept larger files; some will compress server-side anyway.

If none of those work and you must rasterize, keep the original. The compressed file is a derivative, not a replacement.

## A checklist before compressing

- Does the recipient need to search, select, or copy the text?
- Will this document be read by a screen reader?
- Does it contain form fields or links that must work?
- Will anyone print it?
- Is the original safely stored?

If the answer to the first three is no and the last is yes, rasterization is reasonable. Otherwise, reconsider.

## A note on achieving a specific target

A byte target is a request, not a guarantee. The tool tries a set of JPEG qualities at the chosen resolution and reports whether it met the target. When it cannot, it tells you the smallest result it produced — that number tells you whether to lower the DPI, raise the target, or accept that this document needs a different approach.
