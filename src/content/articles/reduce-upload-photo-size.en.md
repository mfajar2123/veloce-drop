---
lang: en
translationKey: reduce-upload-photo-size
title: "Compress a photo for an upload size limit"
summary: "Reduce a JPG or WebP for a form without guessing which settings to change. Check file size, image dimensions, and fine print before uploading."
category: compression
toolId: compress-image
publishedAt: 2026-11-19
readingMinutes: 6
image: /images/articles/why-200kb-targets-fail.webp
imageAlt: "A close view of a camera lens"
imageCredit: "Vintage Camera Lens Macro by jcubic"
imageCreditUrl: "https://www.flickr.com/photos/56196558@N08/50132360368"
imageLicense: "by-sa 2.0"
related:
  - why-200kb-targets-fail
---

An upload form can reject a sharply focused photograph because it is a few kilobytes over the limit. It can also accept a smaller file that no longer contains readable information. Before you compress a photo for an upload, collect three separate requirements from the form: the allowed file types, the maximum number of bytes, and any limits on pixel dimensions. Keeping these rules separate makes it much easier to decide what to change.

## Record the file requirements

Read the message beside the upload button and open the instructions for the specific attachment. A passport portrait, a receipt and a scan of a certificate may have different rules even when they are on the same form. Preserve a copy of the original photo and give the export a new name. It is easier to start over from an original than to repair the texture in a JPEG that has already been compressed several times.

Some forms say the file must be smaller than 200 KB. Others say up to 200 KB. Round numbers displayed in a file browser may hide a few bytes either way. Aim for a small amount of room under the cap, then check the exported file's properties and the form's own validation message. If the portal also has a minimum size, stay within both limits. Avoid chasing a round target if the current file already meets the requirements and looks right.

## Choose the output format first

If the form says JPG or JPEG, use JPEG. WebP can often store a comparable photograph with fewer bytes, but a portal must support it before its size advantage is useful. PNG works well for some screenshots with hard edges and transparent regions, but a busy photo can be much larger as PNG. Changing a filename ending from .png to .jpg leaves the data inside unchanged. Export through the required encoder and open the result to check that your device recognises it.

For photos of documents, think about whether the receiver needs the full page or a specific region. When the whole page is requested, all the paper edges and printed details should remain visible. If the form requests a profile portrait, crop to the required framing before compression. Empty wall beyond the crop can add pixels to a file without adding anything the reviewer needs.

## Try a full size export

Open the [image compressor](/en/compress-image/) and select the original. Choose the allowed output and enter the target. Review the size reported by the tool after encoding. Keeping the original dimensions in the first attempt makes it easier to see how much quality the file limit costs. At the same zoom, compare details that matter, such as a date, textured hair, a barcode or a narrow edge between a pen stroke and paper.

The quality number is a setting for the encoder. It is not a direct percentage of visual quality or a prediction of the final file size. A smooth wall and a noisy wall at the same dimensions can produce very different file sizes. Fine leaves, fabric, handwritten marks and camera noise take more information to describe. When two photos react differently to the same setting, judge the resulting files separately.

## Resize when the full size result is too soft

If a full size version technically meets the cap but text is muddy or edges have visible blocks, consider a smaller pixel grid. First check the minimum width and height. A picture captured at 4000 by 3000 pixels may have far more pixels than a form needs. Reducing its width to 1600 pixels and keeping the same aspect ratio produces 1600 by 1200. That changes the pixel count from twelve million to just under two million. The resulting JPEG size depends on the photo and the encoder, but the smaller grid leaves fewer details to encode.

Start from the original or a clean crop. Resize once, then compress. When the form specifies exact dimensions, set those in the [resize tool](/en/resize-image/) before checking the byte target. Use crop or padding as the instructions permit. Stretching a wide image to fit a tall slot changes the appearance of faces, text and circular seals. Crop if you can discard the extra area, or use padding if the full scene must survive.

## Work through a sample rejection

Imagine a form asks for a JPEG portrait under 200 KB with a minimum width of 600 pixels. You start with a large phone photo. Crop the portrait first and check that the crop still exceeds the minimum. Try a JPEG from that crop at the target size. If hair and eyes look smeared, make a smaller version from the original crop that stays above 600 pixels. Compress the smaller version and compare your two exports at the same display size. Pick the one that keeps the face clear and leaves a small margin below the byte cap.

A document asks for a different review. Open the export at a zoom that makes the text comfortable to read. Check a few numbers near each edge, the signature and any faint stamp. If the capture has shadows or motion blur, retaking it under even light usually helps more than another round of quality changes. Photograph the required sheet with the camera roughly parallel to the page and avoid cropping off the printed borders.

## Inspect and submit the exact file

Confirm the final extension, byte size and pixel dimensions. Open the saved export from the downloads folder instead of trusting the editor tab. Compare the download against the form's preview after selecting it. A preview can be cropped by the portal even though your file still contains the whole image, so check whether the site asks you to reposition a crop before submission. Wait for the confirmation and keep the submitted copy separately from your original.

When a form rejects a file that appears small enough, check file type and dimensions before compressing again. Some portals read the encoded type instead of relying on the name. Another common cause is an unexpected minimum dimension or orientation rule. Return to the visible instructions and change only the failing property. This keeps otherwise acceptable image quality intact and gives you a clear explanation if you need to contact the recipient.
