---
lang: en
translationKey: fit-photo-to-pixel-dimensions
title: "Resize a photo to exact pixels without stretching"
summary: "Fit a photo to exact pixel dimensions by choosing a crop or adding margins. Keep faces, logos, and printed text in their original proportions."
category: resize
toolId: resize-image
publishedAt: 2026-11-19
readingMinutes: 6
image: /images/articles/passport-photo-sizes-explained.webp
imageAlt: "A photographer's portrait practice session"
imageCredit: "Portrait practice session by James Willamor"
imageCreditUrl: "https://www.flickr.com/photos/81464596@N00/5367086798"
imageLicense: "by-sa 2.0"
related:
  - passport-photo-sizes-explained
---

When a site asks for a photo that is exactly 600 by 800 pixels, typing both numbers into a resize form is only half the job. A wide photo and a narrow slot have different shapes. If every original pixel is squeezed into the new shape, people look thinner and round objects turn into ovals. To resize a photo without stretching it, decide what should happen to the part of the scene that does not fit.

## Read dimensions as width by height

In a label such as 600 × 800 px, the first number normally gives width and the second gives height. The example is taller than it is wide. A file of 800 × 600 is the reverse. Write both dimensions down and check whether the recipient gives a fixed size, a range or a simple maximum. A fixed size requires a canvas of exactly those dimensions. A maximum may let you resize proportionally and keep the whole image without padding.

A width expressed in centimetres means something different. For print, the pixel count depends on the output density. At 300 pixels per inch, a four inch side needs about 1200 pixels. For a web form that lists dimensions in pixels, the stored pixel grid is what you should check. Changing a DPI number in metadata alone does not create more usable detail or make a wide photo fit a tall frame.

## Compare the two shapes

Divide the width by the height to get the aspect ratio. A 1200 by 900 photo has a ratio of 4:3. A 600 by 800 destination has a ratio of 3:4. Because the original is wider relative to its height, it can fill the destination only by losing some width or by placing the whole photo inside the destination with space above and below.

For a photo that already has the same proportions, proportional resize alone works. An original that is 1800 × 2400 can become 600 × 800 without changing its framing. The simple check is to compare the two ratios before choosing how to resize. If the ratios differ only slightly, a tiny crop may be enough. If they differ substantially, preview the result carefully before committing to a tight crop.

## Use crop if the frame must be full

Open the [image resize tool](/en/resize-image/), add the original photo and set the target width and height. Select the option that fills the frame by cropping. Reposition the crop to keep the important part of the picture in view. For a portrait, check the top of the head, the sides of the face and the amount of space left under the chin. For a product, look for features near the sides, such as a handle that extends past the centre of the photo. Move the crop if the automatic centre cuts through it.

Cropping throws away part of the scene. A small crop can be useful when it removes background clutter, but you cannot restore cropped content from the downloaded file. Keep the original in a separate folder. If the upload system later requests a landscape version, go back to that source rather than cropping a second time from a portrait export.

## Add margins if the full scene must stay

Use a fit or padding option when the full subject must remain visible. A white or transparent border can be suitable for a product listing, depending on the destination. If the receiver specifies JPG, any transparent areas need a solid background in the output. Choose a background that lets the object and any edges remain visible. A white item against a white border may need a source photo with more edge definition.

A document or screenshot often benefits from padding because a missing corner can remove a field, a page number or a line of text. Check whether the destination explicitly allows borders. Some portrait rules require the face to occupy a defined area. Padding can preserve all of the image while still making the head too small for that requirement. In that case, return to the photo and adjust the crop or take a new picture that fits more naturally.

## Work an example before exporting

Take a landscape photograph of 1600 × 1200 and fit it into a square of 800 × 800. To fill the square with no margins, use a 1200 × 1200 crop from the original, then resize that square to 800 × 800. You are discarding a total of 400 pixels of width. That loss can come mostly from one side if the subject sits off centre.

If you choose to fit the entire landscape instead, scaling the width to 800 makes its height 600. The square needs 200 extra pixels of height. Centring gives 100 pixels of padding above and 100 below. The exported canvas is still 800 × 800. Recognising these two perfectly valid results helps you choose based on the recipient's instructions rather than assuming an export that looks different has failed.

## Verify the saved dimensions and look

Open the file from your downloads folder. Use properties or the image viewer's information panel to confirm the pixel dimensions. Check the actual exported framing at the size at which it will be viewed. Downscaling can make faint marks and thin text hard to read, even when the full version looks clean. A preview at a large zoom helps diagnose edge artefacts, but the delivery size is the place to judge readability.

If the receiver also specifies a file size cap, resize first and check the saved dimensions before opening the [image compressor](/en/compress-image/). Keep the exact shape as you compress and verify the dimensions again before submission. If the target can be met only by making the output hard to read, return to a clearer original or ask the recipient which constraint can be relaxed. Resizing can make a large image smaller with good results, but enlarging a tiny crop creates extra samples and cannot restore the original detail.

If you are preparing several variants, include the dimensions in each filename and keep each export alongside the original. A 600 by 800 upload can look very similar to an 800 by 1000 copy in a file picker. A clear name and a final properties check keep the two outputs from getting swapped.
