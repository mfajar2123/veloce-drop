---
lang: en
translationKey: batch-processing-workflow
title: A batch workflow for compressing and watermarking a photo set
summary: Processing fifty product photos one at a time is a waste of an afternoon. Here is how to do it in a few passes without losing track of which file is which.
category: compression
toolId: batch
publishedAt: 2026-11-05
readingMinutes: 6
related:
  - watermark-that-survives-resizing
  - compress-image-without-losing-quality
---

A single image task takes seconds. The same task repeated across a hundred files takes an afternoon and produces mistakes. The difference is not speed, it is bookkeeping: knowing which file is which, and knowing that a failed item did not silently slip through.

## Sort out naming before anything else

The most expensive mistake in batch work is losing track of the mapping between input and output.

If your files are named `IMG_2841.jpg` through `IMG_2890.jpg`, output named `compressed-1.jpg` through `compressed-50.jpg` destroys the mapping. You can no longer tell which result belongs to which product.

Two fixes:

- **Keep original names.** Most batch tools, including VeloceDrop, preserve the input filename in the output.
- **Rename deliberately first.** If names are meaningless camera identifiers, rename them to something meaningful — `shirt-blue-front.jpg` — before processing, using a file manager's batch rename.

Duplicate filenames are a real hazard. Two folders each containing `photo.jpg` will collide in a ZIP. A sensible tool disambiguates with a suffix rather than overwriting.

## Pass one: decide the target before touching anything

For a product set, ask:

- What is the destination — marketplace, own site, email?
- What file size limit applies?
- What dimensions does the marketplace display at?

Marketplaces typically resize to their own standard. Sending a 4000-pixel image where 1500 is displayed wastes bandwidth on upload and gains nothing in the listing. Sending a 400-pixel image where 1500 is displayed looks soft.

Pick one target size and one quality, then apply it to everything. Consistency across a product set matters more than per-image optimization.

## Pass two: compress in one batch

Add the whole set, set the target once, and let it run.

Watch for three things in the results:

- **Items that failed.** A corrupt file or an unsupported format will fail individually. A good tool reports per-item status rather than aborting the batch.
- **Items that missed the target.** If five of fifty cannot reach the target at full dimensions, decide once whether those five should be resized, rather than treating each as a special case.
- **The warning about quality.** If the batch compressed everything to the minimum quality to hit the target, the images will look bad. Raise the target rather than shipping damaged photos.

Download as a ZIP rather than clicking each file. The ZIP preserves names and keeps the set together.

## Pass three: watermark, if needed

If the images need a logo, do it as a separate pass on the compressed output, not before. Two reasons:

- Watermarking first means the watermark itself is then compressed, which softens it.
- If the watermark setting turns out wrong, you can redo it from the compressed set without recompressing again.

Set the logo width as a **percentage**, not pixels, so it stays proportional across a set with varying dimensions. Test opacity on one image at display size before applying to all fifty.

## Pass four: verify a sample

Do not ship a batch you have not inspected. Open three files:

1. **The first one.**
2. **The largest source file.** It is the most likely to have missed the target.
3. **A random one from the middle.**

Check that the file opens, the dimensions are as expected, and the visual quality is acceptable. A batch that worked for 47 of 50 files and silently failed on three is worse than a batch that reported three failures.

## What to keep

Keep the originals. Batch compression is a one-way transformation, and you will occasionally need to redo it with different settings after seeing the result on the actual platform.

Organize as: `originals/`, `compressed/`, `watermarked/`. Overwriting in place removes your ability to go back.

## The limits worth knowing

Batch tools cap concurrency and total size for good reasons — memory. A hundred 20-megapixel images cannot all be decoded simultaneously on any normal machine.

VeloceDrop limits a batch to 25 images, 20 MB each, 100 MB total, and processes them sequentially, releasing memory between items. If you have two hundred files, run the batch eight times rather than trying to force everything through at once. That is a deliberate trade-off for not crashing the tab.
