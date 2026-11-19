---
lang: en
translationKey: print-photo-sheet-layouts
title: Laying out passport photos on 4R and A4 sheets
summary: How many 2×3, 3×4 or 4×6 cm photos actually fit on a sheet, why the count differs from your calculation, and how to cut them accurately.
category: print
toolId: print
publishedAt: 2026-11-11
readingMinutes: 5
related:
  - passport-photo-sizes-explained
  - photos-to-pdf-page-order
---

Printing several small photos on one sheet is cheaper than printing them individually, and it is the standard way to produce passport photos at home or at a local print shop. The layout arithmetic is simple, but the practical details are where people lose money.

## The arithmetic

Capacity depends on four values: paper size, photo size, margin, and spacing.

For a 4R sheet (101.6 × 152.4 mm) holding 3 × 4 cm photos with a 5 mm margin and 2 mm spacing:

- usable width = 101.6 − (2 × 5) = 91.6 mm
- usable height = 152.4 − (2 × 5) = 142.4 mm
- columns = floor((91.6 + 2) / (30 + 2)) = 2
- rows = floor((142.4 + 2) / (40 + 2)) = 3
- total = 6 photos

The `+ spacing` term in the numerator accounts for the fact that the last photo does not need trailing space. This is the step most manual calculations miss, and it is why you sometimes fit one more than expected.

On A4 (210 × 297 mm), 3 × 4 cm photos with the same margins fit 6 columns × 6 rows = 36.

## Orientation matters more than you think

A 4R sheet is portrait by default: 101.6 mm wide, 152.4 mm tall. Rotating the layout to landscape swaps those, which changes the column/row split and therefore the total.

For 3 × 4 cm photos, portrait 4R gives 2 × 3 = 6. Landscape gives 3 × 2 = 6 — same total, different arrangement. For 4 × 6 cm photos the difference can be decisive, because the photo's own aspect ratio interacts with the sheet's.

The tool computes and displays capacity for the selected orientation. Change orientation and watch the number rather than assuming.

## Allowing for printer margins

Consumer printers cannot print edge to edge. Typical unprintable borders are 3–10 mm per side, and they vary by model.

If you set the PDF margin to 0 and the printer clips 8 mm, your cut marks disappear and the outer photos lose content. Set the margin to at least 10 mm if the sheet will be printed on a home printer.

Print shops with borderless capability can handle smaller margins, but ask before assuming.

## Cutting accurately

Cut marks of 2 mm with a 2 mm gap from each photo give you a reference line without touching the image. Use a metal ruler and a sharp blade rather than scissors for repeatable results.

Two practical notes:

- **Print at 100%.** Any "fit to page" scaling invalidates the physical dimensions.
- **Verify with a ruler** after the first sheet. If a 30 mm photo measures 28 mm, the printer scaled something.

## Why the sizes still might be rejected

A sheet of perfectly sized photos can still be rejected if the *content* does not meet the requirement. Size is one rule among several: background colour, head position, expression, recency, and print quality all matter.

The layout tool handles dimensions and spacing. It cannot check whether the photo itself is acceptable.

## Choosing paper

Photo paper gives better results than plain paper for images, but for passport photos the receiving authority usually cares about the printed dimensions and clarity, not the substrate. Standard photo paper at 180–250 gsm is a reasonable default.

Matte finish avoids fingerprints and glare; glossy looks sharper but reflects light when scanned. If the photo will be scanned or photographed for a digital submission, matte is the safer choice.
